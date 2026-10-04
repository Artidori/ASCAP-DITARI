from fastapi import FastAPI, APIRouter, Header, HTTPException
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


def require_admin(pw: Optional[str]):
    if pw != ADMIN_PASSWORD:
        raise HTTPException(401, "Fjalëkalimi i adminit është i pasaktë!")


async def require_license(code: Optional[str]):
    lic = await db.licenses.find_one({"kodi": code or ""}, {"_id": 0})
    if not lic or not lic.get("aktivizuar"):
        raise HTTPException(401, "Licenca nuk është aktive. Hyni përsëri.")
    if not lic.get("aktiv"):
        raise HTTPException(403, "Kjo licencë është e caktivizuar nga administratori!")
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
    krijuar: str = Field(default_factory=now_iso)


class AdminLogin(BaseModel):
    password: str


class NewLicense(BaseModel):
    numriLendeve: int


class Activate(BaseModel):
    kodi: str
    emri: str
    mbiemri: str
    email: str
    numriLendeve: int
    lendet: List[str]


class GenerateReq(BaseModel):
    lenda: str
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
    return await db.licenses.find({}, {"_id": 0}).sort("krijuar", -1).to_list(2000)


@api.post("/admin/licenses")
async def admin_create(body: NewLicense, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    if body.numriLendeve not in (1, 2, 3):
        raise HTTPException(400, "Paketa duhet të jetë 1, 2 ose 3 lëndë")
    rnd = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    lic = License(kodi=f"ASCAP-{rnd}-{random.randint(1000, 9999)}", numriLendeve=body.numriLendeve)
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


@api.patch("/admin/licenses/{kodi}/reset")
async def admin_reset(kodi: str, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    await db.licenses.update_one({"kodi": kodi}, {"$set": {"aktivizuar": False}})
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
    if lic["numriLendeve"] != body.numriLendeve:
        raise HTTPException(400, f"Ky kod i përket paketës për {lic['numriLendeve']} lëndë, por keni zgjedhur {body.numriLendeve}!")
    if lic.get("aktivizuar") and lic.get("email", "").lower() != body.email.strip().lower():
        raise HTTPException(403, "Ky kod është aktivizuar tashmë nga një mësues tjetër!")
    lendet = list(dict.fromkeys(body.lendet))[:body.numriLendeve]
    if len(lendet) != body.numriLendeve:
        raise HTTPException(400, "Zgjidhni lëndë të ndryshme!")
    upd = {"emri": body.emri.strip(), "mbiemri": body.mbiemri.strip(), "email": body.email.strip(),
           "lendet": lendet, "aktivizuar": True}
    await db.licenses.update_one({"kodi": kodi}, {"$set": upd})
    return {**lic, **upd}


@api.get("/license/me")
async def me(x_license: Optional[str] = Header(None)):
    return await require_license(x_license)


# ---------- Ditar ----------
FUSHA = {
    "Matematikë": "Matematikë", "Gjuhë Shqipe": "Gjuhët dhe komunikimi", "Anglisht": "Gjuhët dhe komunikimi",
    "Italisht": "Gjuhët dhe komunikimi", "Muzikë": "Arte", "Art Pamor": "Arte",
    "Edukim Fizik": "Edukim fizik, sporte dhe shëndet", "Histori": "Shoqëria dhe mjedisi",
    "Gjeografi": "Shoqëria dhe mjedisi", "Qytetari": "Shoqëria dhe mjedisi", "TIK": "TIK dhe Teknologji",
}


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
 "vleresimi": ["Niveli 1 ...", "Niveli 2 ...", "Niveli 3 ...", "Niveli 4 ..."],
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
async def generate(body: GenerateReq, x_license: Optional[str] = Header(None)):
    lic = await require_license(x_license)
    if body.lenda not in lic["lendet"]:
        raise HTTPException(403, "Kjo lëndë nuk përfshihet në licencën tuaj.")
    if not body.images and not body.tema.strip():
        raise HTTPException(400, "Ngarkoni foto të librit ose shkruani temën mësimore.")
    if len(body.images) > 6:
        raise HTTPException(400, "Maksimumi 6 foto për një ditar.")

    ak = f"Ka nxënës me AK (inicialet: {body.akInitials or 'pa inicialë'}) – përfshi masa konkrete mbështetëse." if body.kaAk else "Nuk ka nxënës me AK."
    prompt = f"""Harto ditarin për: Lënda: {body.lenda}; {body.klasa}; Shkalla {shkalla(body.klasa)}.
Tema e dhënë nga mësuesi: "{body.tema or '(nxirre nga fotot e librit)'}".
{ak}
{"Analizo me kujdes " + str(len(body.images)) + " fotot e faqeve të librit sipas radhës dhe shpërndaj informacionin e tyre (koncepte, shembuj, ushtrime, fjalë kyçe, faqe) në pjesët përkatëse të ditarit." if body.images else "Nuk ka foto; bazohu te tema."}
Ora zgjat 45 min (10 + 25 + 10). Ji specifik për përmbajtjen, jo i përgjithshëm.
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
        "mesuesi": f"{lic['emri']} {lic['mbiemri']}", "lenda": body.lenda,
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
async def save_html(did: str, body: SaveHtml, x_license: Optional[str] = Header(None)):
    lic = await require_license(x_license)
    await db.ditare.update_one({"id": did, "kodi": lic["kodi"]}, {"$set": {"html": body.html}})
    return {"ok": True}


@api.get("/ditar")
async def list_ditare(x_license: Optional[str] = Header(None)):
    lic = await require_license(x_license)
    return await db.ditare.find({"kodi": lic["kodi"]}, {"_id": 0}).sort("krijuar", -1).to_list(200)


@api.delete("/ditar/{did}")
async def delete_ditar(did: str, x_license: Optional[str] = Header(None)):
    lic = await require_license(x_license)
    await db.ditare.delete_one({"id": did, "kodi": lic["kodi"]})
    return {"ok": True}


app.include_router(api)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
