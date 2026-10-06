from fastapi import FastAPI, APIRouter, Header, HTTPException, Response, Depends
from docx_builder import build_docx
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import uuid
import random
import string
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

app = FastAPI()
api = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def viti_aktual() -> str:
    n = datetime.now(timezone.utc)
    y = n.year if (n.month, n.day) > (6, 15) else n.year - 1
    return f"{y}-{y + 1}"


def skadon_per(viti: str) -> str:
    end = int(viti.split("-")[1])
    return datetime(end, 6, 15, 23, 59, 59, tzinfo=timezone.utc).isoformat()


def check_expiry(lic: dict):
    if lic.get("skadon") and datetime.fromisoformat(lic["skadon"]) < datetime.now(timezone.utc):
        raise HTTPException(403, f"Licenca ka skaduar më 15.06.{lic['skadon'][:4]}. Kontaktoni administratorin për rinovim.")


def require_admin(pw: Optional[str]):
    if pw != ADMIN_PASSWORD:
        raise HTTPException(401, "Fjalëkalimi i adminit është i pasaktë!")


PAJISJE_TJETER = "Kjo licencë është e lidhur me një pajisje tjetër. Çdo licencë përdoret vetëm nga një mësues në një pajisje. Kontaktoni administratorin."


async def bind_device(lic: dict, pajisja: Optional[str], emri: str = ""):
    if not pajisja:
        raise HTTPException(400, "Pajisja nuk u identifikua. Rifreskoni faqen.")
    if lic.get("pajisja") and lic["pajisja"] != pajisja:
        raise HTTPException(403, PAJISJE_TJETER)
    if not lic.get("pajisja"):
        await db.licenses.update_one({"kodi": lic["kodi"]}, {"$set": {"pajisja": pajisja, "pajisjaEmri": emri[:80]}})


async def require_license(x_license: Optional[str] = Header(None), x_device: Optional[str] = Header(None)):
    lic = await db.licenses.find_one({"kodi": x_license or ""}, {"_id": 0})
    if not lic or not lic.get("aktivizuar"):
        raise HTTPException(401, "Licenca nuk është aktive. Hyni përsëri.")
    if not lic.get("aktiv"):
        raise HTTPException(403, "Kjo licencë është e caktivizuar nga administratori!")
    check_expiry(lic)
    await bind_device(lic, x_device)
    return lic


class License(BaseModel):
    kodi: str
    numriLendeve: int
    aktiv: bool = True
    aktivizuar: bool = False
    emri: str = ""
    mbiemri: str = ""
    email: str = ""
    lendet: List[str] = []
    vitiShkollor: str = ""
    skadon: str = ""
    krijuar: str = Field(default_factory=now_iso)


class AdminLogin(BaseModel):
    password: str


class NewLicense(BaseModel):
    numriLendeve: int
    vitiShkollor: str = ""


class Activate(BaseModel):
    kodi: str
    emri: str
    mbiemri: str
    email: str
    numriLendeve: int
    lendet: List[str]
    pajisja: str = ""
    pajisjaEmri: str = ""


class GenerateReq(BaseModel):
    lenda: str
    lendaKurrikules: str = ""
    klasa: str
    data: str
    tema: str = ""
    vitiShkollor: str = ""
    kaAk: bool = False
    akInitials: str = ""
    images: List[str] = []


# ---------- Admin ----------
@api.post("/admin/login")
async def admin_login(body: AdminLogin):
    require_admin(body.password)
    return {"ok": True}


@api.get("/admin/licenses")
async def admin_list(x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    lics = await db.licenses.find({}, {"_id": 0, "pajisja": 0}).sort("krijuar", -1).to_list(2000)
    counts = {c["_id"]: c["n"] async for c in db.ditare.aggregate([{"$group": {"_id": "$kodi", "n": {"$sum": 1}}}])}
    for lic in lics:
        lic["ditare"] = counts.get(lic["kodi"], 0)
    return lics


@api.post("/admin/licenses")
async def admin_create(body: NewLicense, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    if body.numriLendeve not in (0, 1, 2, 3):
        raise HTTPException(400, "Paketa duhet të jetë 1, 2, 3 lëndë ose Fillore")
    rnd = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    viti = body.vitiShkollor or viti_aktual()
    if not re.fullmatch(r"(\d{4})-(\d{4})", viti) or int(viti[5:]) != int(viti[:4]) + 1:
        raise HTTPException(400, "Viti shkollor duhet në formatin 2026-2027")
    lic = License(kodi=f"ASCAP-{rnd}-{random.randint(1000, 9999)}", numriLendeve=body.numriLendeve,
                  vitiShkollor=viti, skadon=skadon_per(viti))
    await db.licenses.insert_one(lic.model_dump())
    return lic.model_dump()


@api.patch("/admin/licenses/{kodi}/toggle")
async def admin_toggle(kodi: str, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    lic = await db.licenses.find_one({"kodi": kodi})
    if not lic:
        raise HTTPException(404, "Nuk u gjet")
    await db.licenses.update_one({"kodi": kodi}, {"$set": {"aktiv": not lic.get("aktiv", True)}})
    return {"ok": True}


@api.patch("/admin/licenses/{kodi}/renew")
async def admin_renew(kodi: str, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    lic = await db.licenses.find_one({"kodi": kodi})
    if not lic:
        raise HTTPException(404, "Nuk u gjet")
    start = max(int((lic.get("vitiShkollor") or viti_aktual())[:4]) + 1, int(viti_aktual()[:4]))
    viti = f"{start}-{start + 1}"
    await db.licenses.update_one({"kodi": kodi}, {"$set": {"vitiShkollor": viti, "skadon": skadon_per(viti)}})
    return {"ok": True, "vitiShkollor": viti}


@api.get("/admin/school-years")
async def school_years():
    y = int(viti_aktual()[:4])
    return [f"{y}-{y + 1}", f"{y + 1}-{y + 2}"]


@api.patch("/admin/licenses/{kodi}/device-reset")
async def admin_device_reset(kodi: str, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    await db.licenses.update_one({"kodi": kodi}, {"$set": {"pajisja": "", "pajisjaEmri": ""}})
    return {"ok": True}


@api.patch("/admin/licenses/{kodi}/reset")
async def admin_reset(kodi: str, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    await db.licenses.update_one({"kodi": kodi}, {"$set": {"aktivizuar": False, "pajisja": "", "pajisjaEmri": ""}})
    return {"ok": True}


@api.delete("/admin/licenses/{kodi}")
async def admin_delete(kodi: str, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    await db.licenses.delete_one({"kodi": kodi})
    return {"ok": True}


# ---------- License ----------
@api.post("/license/activate")
async def activate(body: Activate):
    kodi = body.kodi.strip().upper()
    lic = await db.licenses.find_one({"kodi": kodi}, {"_id": 0})
    if not lic:
        raise HTTPException(404, "Kodi i licencës është i pasaktë ose nuk ekziston!")
    if not lic.get("aktiv"):
        raise HTTPException(403, "Kjo licencë është e caktivizuar nga administratori!")
    check_expiry(lic)
    if lic["numriLendeve"] != body.numriLendeve:
        emer = lambda n: "Fillore" if n == 0 else f"për {n} lëndë"
        raise HTTPException(400, f"Ky kod i përket paketës {emer(lic['numriLendeve'])}, por keni zgjedhur paketën {emer(body.numriLendeve)}!")
    if lic.get("aktivizuar") and lic.get("email", "").lower() != body.email.strip().lower():
        raise HTTPException(403, "Ky kod është aktivizuar tashmë nga një mësues tjetër!")
    lendet = FILLORE if body.numriLendeve == 0 else list(dict.fromkeys(body.lendet))[:body.numriLendeve]
    if body.numriLendeve and len(lendet) != body.numriLendeve:
        raise HTTPException(400, "Zgjidhni lëndë të ndryshme!")
    await bind_device(lic, body.pajisja, body.pajisjaEmri)
    upd = {"emri": body.emri.strip(), "mbiemri": body.mbiemri.strip(), "email": body.email.strip(),
           "lendet": lendet, "aktivizuar": True}
    await db.licenses.update_one({"kodi": kodi}, {"$set": upd})
    return {**lic, **upd}


class LicLogin(BaseModel):
    kodi: str
    email: str
    pajisja: str = ""
    pajisjaEmri: str = ""


@api.post("/license/login")
async def lic_login(body: LicLogin):
    lic = await db.licenses.find_one({"kodi": body.kodi.strip().upper()}, {"_id": 0})
    if not lic or not lic.get("aktivizuar") or lic.get("email", "").lower() != body.email.strip().lower():
        raise HTTPException(401, "Kodi ose email-i është i pasaktë, ose licenca nuk është aktivizuar ende.")
    if not lic.get("aktiv"):
        raise HTTPException(403, "Kjo licencë është e caktivizuar nga administratori!")
    check_expiry(lic)
    await bind_device(lic, body.pajisja, body.pajisjaEmri)
    return lic


@api.get("/license/me")
async def me(lic: dict = Depends(require_license)):
    return lic


# ---------- Ditar ----------
FUSHA = {
    "Matematikë": "Matematikë", "Gjuhë Shqipe": "Gjuhët dhe komunikimi", "Anglisht": "Gjuhët dhe komunikimi",
    "Italisht": "Gjuhët dhe komunikimi", "Muzikë": "Arte", "Art Pamor": "Arte",
    "Edukim Fizik": "Edukim fizik, sporte dhe shëndet", "Histori": "Shoqëria dhe mjedisi",
    "Gjeografi": "Shoqëria dhe mjedisi", "Qytetari": "Shoqëria dhe mjedisi", "TIK": "TIK dhe Teknologji",
    "Kërcim": "Arte", "Teatër": "Arte", "Aftësim Teknologjik": "Teknologji dhe TIK",
    "Dituri Natyre": "Shkencat e natyrës", "Kurrikula në Bazë Shkolle": "Kurrikula në bazë shkolle",
    "Kurrikula me Zgjedhje": "Kurrikula me zgjedhje", "Letërsi": "Gjuhët dhe komunikimi", "Ekonomi": "Shoqëria dhe mjedisi",
    "Gjuhë Angleze": "Gjuhët dhe komunikimi", "Edukim Fizik, Sporte dhe Shëndet": "Edukim fizik, sporte dhe shëndet",
    "Edukim për Shoqërinë": "Shoqëria dhe mjedisi", "Aftësim Teknologjik Praktik": "Teknologji dhe TIK",
}

FILLORE = ["Gjuhë Shqipe", "Gjuhë Angleze", "Matematikë", "Dituri Natyre", "TIK", "Art Pamor", "Muzikë",
           "Edukim Fizik, Sporte dhe Shëndet", "Edukim për Shoqërinë", "Aftësim Teknologjik Praktik", "Kurrikula me Zgjedhje"]
KLASAT_FILLORE = [f"Klasa {i}" for i in range(1, 6)]
KURRIKULAT = ("Kurrikula me Zgjedhje", "Kurrikula në Bazë Shkolle")
GJUHA = {"Anglisht": "ANGLISHT (English)", "Gjuhë Angleze": "ANGLISHT (English)", "Italisht": "ITALISHT (Italiano)"}


def shkalla(klasa: str) -> str:
    if "Parafillor" in klasa:
        return "I"
    m = re.search(r"\d+", klasa)
    n = int(m.group()) if m else 5
    return {1: "I", 2: "I", 3: "II", 4: "II", 5: "III", 6: "III", 7: "IV", 8: "IV", 9: "IV", 10: "V", 11: "V", 12: "VI"}.get(n, "III")


SYSTEM = """Ti je ekspert i kurrikulës shqiptare (ASCAP) dhe harton ditarë mësimorë zyrtarë për mësuesit.
Përgjigju VETËM me një objekt JSON të vlefshëm, pa tekst tjetër, pa markdown. Shkruaj në gjuhën shqipe standarde."""

SCHEMA = """{
 "tema": "tema mësimore (nga libri nëse jepet foto)",
 "situata": "situatë konkrete e të nxënit, e lidhur me jetën e nxënësve (3-4 fjali)",
 "rezultatet": {"komunikimi": "...", "te_menduarit": "...", "personale": "..."},
 "fjalet_kyce": "5-7 fjalë kyçe nga përmbajtja, të ndara me presje",
 "burimet": "libri, faqet, mjete konkrete",
 "teknologjia": "...",
 "lidhja_fushat": "lëndë të tjera dhe si lidhen",
 "faza1": {"teknika": "...", "pershkrimi": "veprimtari konkrete për lidhjen me njohuritë e mëparshme"},
 "faza2": {"teknika": "...", "hapi1": "shpjegim konkret i koncepteve nga libri", "hapi2": "ushtrime/punë konkrete nga libri"},
 "faza3": {"teknika": "...", "pershkrimi": "..."},
 "vleresimi": ["Niveli 1 ...", "Niveli 2 ...", "Niveli 3 ..."],
 "feedback": "1-2 fjali konkrete feedback-u që mësuesi u jep nxënësve për këtë temë",
 "diferencimi": {"avancuar": "...", "ak": "..."},
 "detyrat": ["Detyrë bazë ...", "Detyrë mesatare ...", "Detyrë e avancuar ..."],
 "refleksioni": ["pyetje refleksioni 1", "pyetje refleksioni 2"]
}"""


def parse_json(text: str) -> dict:
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
    s, e = t.find("{"), t.rfind("}")
    return json.loads(t[s:e + 1])


@api.post("/ditar/generate")
async def generate(body: GenerateReq, lic: dict = Depends(require_license)):
    if body.lenda not in lic["lendet"]:
        raise HTTPException(403, "Kjo lëndë nuk përfshihet në licencën tuaj.")
    if lic["numriLendeve"] == 0 and body.klasa not in KLASAT_FILLORE:
        raise HTTPException(403, "Paketa Fillore vlen vetëm për klasat 1-5.")
    if not body.images and not body.tema.strip():
        raise HTTPException(400, "Ngarkoni foto të librit ose shkruani temën mësimore.")
    if len(body.images) > 6:
        raise HTTPException(400, "Maksimumi 6 foto për një ditar.")

    ak = f"Ka nxënës me AK (inicialet: {body.akInitials or 'pa inicialë'}) – përfshi masa konkrete mbështetëse." if body.kaAk else "Nuk ka nxënës me AK."
    emri_lendes = body.lenda
    if body.lenda in KURRIKULAT:
        if not body.lendaKurrikules.strip():
            raise HTTPException(400, "Shkruani emrin e lëndës për kurrikulën.")
        emri_lendes = f"{body.lenda}: {body.lendaKurrikules.strip()}"
    gjuha = GJUHA.get(body.lenda)
    gj = (f"\nE RËNDËSISHME: Shkruaj TË GJITHË përmbajtjen e JSON-it (vlerat) VETËM në {gjuha}, jo në shqip. "
          "Çelësat e JSON-it mbeten siç janë.") if gjuha else ""
    prompt = f"""Harto ditarin për: Lënda: {emri_lendes}; {body.klasa}; Shkalla {shkalla(body.klasa)}.
Tema e dhënë nga mësuesi: "{body.tema or '(nxirre nga fotot e librit)'}".
{ak}
{"Analizo me kujdes " + str(len(body.images)) + " fotot e faqeve të librit sipas radhës dhe shpërndaj informacionin e tyre (koncepte, shembuj, ushtrime, fjalë kyçe, faqe) në pjesët përkatëse të ditarit." if body.images else "Nuk ka foto; bazohu te tema."}
Ora zgjat 45 min (10 + 25 + 10). Ji specifik për përmbajtjen, jo i përgjithshëm.
Mos shkruaj parashtesa si "Niveli 1:" ose "Detyra 1:" në vlera.{gj}
Kthe JSON me këtë strukturë saktësisht:
{SCHEMA}"""

    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()), system_message=SYSTEM) \
        .with_model("gemini", "gemini-3-flash-preview")
    imgs = [ImageContent(image_base64=i.split(",", 1)[-1]) for i in body.images]
    try:
        resp = await chat.send_message(UserMessage(text=prompt, file_contents=imgs or None))
        content = parse_json(resp if isinstance(resp, str) else str(resp))
    except Exception as e:
        logger.exception("AI error")
        raise HTTPException(502, f"Analiza me AI dështoi. Provoni përsëri. ({str(e)[:120]})")

    ditar = {
        "id": str(uuid.uuid4()), "kodi": lic["kodi"],
        "mesuesi": f"{lic['emri']} {lic['mbiemri']}", "lenda": body.lenda, "lendaEmri": emri_lendes,
        "fusha": FUSHA.get(body.lenda, "Shkencat e natyrës"), "shkalla": shkalla(body.klasa),
        "klasa": body.klasa, "data": body.data, "vitiShkollor": body.vitiShkollor,
        "kaAk": body.kaAk, "akInitials": body.akInitials,
        "tema": body.tema.strip() or content.get("tema", ""), "permbajtja": content,
        "html": None, "krijuar": now_iso(),
    }
    await db.ditare.insert_one({**ditar})
    return ditar


class SaveHtml(BaseModel):
    html: str


@api.put("/ditar/{did}")
async def save_html(did: str, body: SaveHtml, lic: dict = Depends(require_license)):
    await db.ditare.update_one({"id": did, "kodi": lic["kodi"]}, {"$set": {"html": body.html}})
    return {"ok": True}


class DocxReq(BaseModel):
    html: str
    fontSize: int = 12


@api.post("/ditar/{did}/docx")
async def ditar_docx(did: str, body: DocxReq, lic: dict = Depends(require_license)):
    d = await db.ditare.find_one({"id": did, "kodi": lic["kodi"]}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Ditari nuk u gjet")
    header = f"Mësuesi/ja: {d['mesuesi']} | Viti Shkollor: {d.get('vitiShkollor') or viti_aktual()}"
    data = build_docx(body.html, 11 if body.fontSize <= 11 else 12, header)
    return Response(content=data, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")


@api.post("/ditar/{did}/share")
async def ditar_share(did: str, body: DocxReq, lic: dict = Depends(require_license)):
    d = await db.ditare.find_one({"id": did, "kodi": lic["kodi"]}, {"_id": 0, "share_token": 1})
    if d is None:
        raise HTTPException(404, "Ditari nuk u gjet")
    token = d.get("share_token") or uuid.uuid4().hex
    await db.ditare.update_one({"id": did}, {"$set": {"share_token": token, "share_html": body.html, "share_font": body.fontSize}})
    return {"token": token}


@api.get("/share/{token}")
async def shared_docx(token: str):
    d = await db.ditare.find_one({"share_token": token}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Dokumenti nuk u gjet")
    header = f"Mësuesi/ja: {d['mesuesi']} | Viti Shkollor: {d.get('vitiShkollor') or viti_aktual()}"
    data = build_docx(d["share_html"], 11 if d.get("share_font", 12) <= 11 else 12, header)
    name = re.sub(r"[^\w.-]+", "_", f"Ditari_{d['lenda']}_{d['klasa']}_{d['data']}", flags=re.ASCII)
    return Response(content=data, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    headers={"Content-Disposition": f'attachment; filename="{name}.docx"'})


@api.get("/ditar")
async def list_ditare(lic: dict = Depends(require_license)):
    return await db.ditare.find({"kodi": lic["kodi"]}, {"_id": 0}).sort("krijuar", -1).to_list(200)


@api.delete("/ditar/{did}")
async def delete_ditar(did: str, lic: dict = Depends(require_license)):
    await db.ditare.delete_one({"id": did, "kodi": lic["kodi"]})
    return {"ok": True}


app.include_router(api)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("startup")
async def backfill_expiry():
    viti = viti_aktual()
    await db.licenses.update_many({"$or": [{"skadon": {"$exists": False}}, {"skadon": ""}]},
                                  {"$set": {"vitiShkollor": viti, "skadon": skadon_per(viti)}})


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
