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
from ditar_ai import (FUSHA, PAKETA, KURRIKULAT, ROMAKE, SYSTEM, shkalla, klasa_nr, parse_json,
                      prompt_standard, prompt_kolektive, prompt_ak, prompt_ak_javor, prompt_ak_tremujor)

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


def pajisje_msg(n: int) -> str:
    sa = "një pajisje" if n == 1 else f"{n} pajisje"
    return f"Kjo licencë është e lidhur me një pajisje tjetër. Licenca juaj lejon vetëm {sa}. Kontaktoni administratorin."


async def bind_device(lic: dict, pajisja: Optional[str], emri: str = ""):
    if not pajisja:
        raise HTTPException(400, "Pajisja nuk u identifikua. Rifreskoni faqen.")
    ids = [p["id"] for p in lic.get("pajisjet", [])]
    if pajisja in ids:
        return
    limit = lic.get("maxPajisje", 1)
    if limit and len(ids) >= limit:
        raise HTTPException(403, pajisje_msg(limit))
    await db.licenses.update_one({"kodi": lic["kodi"]}, {"$push": {"pajisjet": {"id": pajisja, "emri": emri[:80] or "Pajisje"}}})


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
    maxPajisje: int = 1
    pajisjet: list = []
    krijuar: str = Field(default_factory=now_iso)


class AdminLogin(BaseModel):
    password: str


class NewLicense(BaseModel):
    numriLendeve: int
    maxPajisje: int = 1
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


class KlasaItem(BaseModel):
    klasa: str
    lenda: str
    lendaKurrikules: str = ""
    tema: str = ""


class GenerateReq(BaseModel):
    lenda: str = ""
    lendaKurrikules: str = ""
    klasa: str = ""
    klasat: List[KlasaItem] = []
    smartlab: bool = False
    llojiAk: str = ""
    koha: str = ""
    dokumenti: str = "ditor"
    periudha: str = ""
    shenime: str = ""
    ditelindja: str = ""
    pozicioni: str = ""
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
    lics = await db.licenses.find({}, {"_id": 0}).sort("krijuar", -1).to_list(2000)
    counts = {c["_id"]: c["n"] async for c in db.ditare.aggregate([{"$group": {"_id": "$kodi", "n": {"$sum": 1}}}])}
    for lic in lics:
        lic["ditare"] = counts.get(lic["kodi"], 0)
        lic["pajisjet"] = [p["emri"] for p in lic.get("pajisjet", [])]
        lic.setdefault("maxPajisje", 1)
    return lics


@api.post("/admin/licenses")
async def admin_create(body: NewLicense, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    if body.numriLendeve not in (1, 2, 3, 4, 5, *PAKETA):
        raise HTTPException(400, "Paketë e pavlefshme")
    if body.maxPajisje not in (0, 1, 2):
        raise HTTPException(400, "Pajisjet duhet të jenë 1, 2 ose pa limit")
    rnd = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    viti = body.vitiShkollor or viti_aktual()
    if not re.fullmatch(r"(\d{4})-(\d{4})", viti) or int(viti[5:]) != int(viti[:4]) + 1:
        raise HTTPException(400, "Viti shkollor duhet në formatin 2026-2027")
    lic = License(kodi=f"ASCAP-{rnd}-{random.randint(1000, 9999)}", numriLendeve=body.numriLendeve,
                  vitiShkollor=viti, skadon=skadon_per(viti), maxPajisje=body.maxPajisje)
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
    await db.licenses.update_one({"kodi": kodi}, {"$set": {"pajisjet": []}})
    return {"ok": True}


class MaxDevices(BaseModel):
    maxPajisje: int


@api.patch("/admin/licenses/{kodi}/max-devices")
async def admin_max_devices(kodi: str, body: MaxDevices, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    if body.maxPajisje not in (0, 1, 2):
        raise HTTPException(400, "Pajisjet duhet të jenë 1, 2 ose pa limit")
    lic = await db.licenses.find_one({"kodi": kodi}, {"pajisjet": 1})
    if not lic:
        raise HTTPException(404, "Nuk u gjet")
    upd = {"maxPajisje": body.maxPajisje}
    if body.maxPajisje and len(lic.get("pajisjet", [])) > body.maxPajisje:
        upd["pajisjet"] = lic["pajisjet"][:body.maxPajisje]
    await db.licenses.update_one({"kodi": kodi}, {"$set": upd})
    return {"ok": True}


@api.patch("/admin/licenses/{kodi}/reset")
async def admin_reset(kodi: str, x_admin_password: Optional[str] = Header(None)):
    require_admin(x_admin_password)
    await db.licenses.update_one({"kodi": kodi}, {"$set": {"aktivizuar": False, "pajisjet": []}})
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
        emer = lambda n: PAKETA[n]["emri"] if n in PAKETA else f"për {n} lëndë"
        raise HTTPException(400, f"Ky kod i përket paketës {emer(lic['numriLendeve'])}, por keni zgjedhur paketën {emer(body.numriLendeve)}!")
    if lic.get("aktivizuar") and lic.get("email", "").lower() != body.email.strip().lower():
        raise HTTPException(403, "Ky kod është aktivizuar tashmë nga një mësues tjetër!")
    fikse = body.numriLendeve in PAKETA
    lendet = PAKETA[body.numriLendeve]["lendet"] if fikse else list(dict.fromkeys(body.lendet))[:body.numriLendeve]
    if not fikse and len(lendet) != body.numriLendeve:
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
def emri_lende(lenda: str, kurr: str) -> str:
    if lenda in KURRIKULAT:
        if not kurr.strip():
            raise HTTPException(400, "Shkruani emrin e lëndës për kurrikulën.")
        return f"{lenda}: {kurr.strip()}"
    return lenda


async def run_ai(prompt: str, images: List[str]) -> dict:
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()), system_message=SYSTEM) \
        .with_model("gemini", "gemini-3-flash-preview")
    imgs = [ImageContent(image_base64=i.split(",", 1)[-1]) for i in images]
    try:
        resp = await chat.send_message(UserMessage(text=prompt, file_contents=imgs or None))
        return parse_json(resp if isinstance(resp, str) else str(resp))
    except Exception as e:
        logger.exception("AI error")
        raise HTTPException(502, f"Analiza me AI dështoi. Provoni përsëri. ({str(e)[:120]})")


@api.post("/ditar/generate")
async def generate(body: GenerateReq, lic: dict = Depends(require_license)):
    paketa = lic["numriLendeve"]
    lejuara = PAKETA.get(paketa, {}).get("klasat")
    if len(body.images) > 6:
        raise HTTPException(400, "Maksimumi 6 foto për një ditar.")
    ak = f"Ka nxënës me AK (inicialet: {body.akInitials or 'pa inicialë'}) – përfshi masa konkrete mbështetëse." if body.kaAk else "Nuk ka nxënës me AK."
    base = {"id": str(uuid.uuid4()), "kodi": lic["kodi"], "mesuesi": f"{lic['emri']} {lic['mbiemri']}",
            "data": body.data, "vitiShkollor": body.vitiShkollor, "kaAk": body.kaAk, "akInitials": body.akInitials,
            "smartlab": body.smartlab, "html": None, "krijuar": now_iso()}

    if paketa == 14:
        if not 2 <= len(body.klasat) <= 3:
            raise HTTPException(400, "Zgjidhni 2 ose 3 klasa.")
        kl = sorted(body.klasat, key=lambda k: klasa_nr(k.klasa))
        if len({k.klasa for k in kl}) != len(kl):
            raise HTTPException(400, "Zgjidhni klasa të ndryshme.")
        items = []
        for k in kl:
            if k.lenda not in lic["lendet"] or k.klasa not in lejuara:
                raise HTTPException(403, "Lënda ose klasa nuk përfshihet në paketën Klasa Kolektive.")
            if not body.images and not k.tema.strip():
                raise HTTPException(400, f"Shkruani temën për {k.klasa} ose ngarkoni foto.")
            items.append({"klasa": k.klasa, "lenda": k.lenda, "emri": emri_lende(k.lenda, k.lendaKurrikules), "tema": k.tema.strip()})
        content = await run_ai(prompt_kolektive(items, ak, len(body.images), body.smartlab), body.images)
        for i, k in enumerate(items):
            k["tema"] = k["tema"] or ((content.get("klasat") or [{}] * 3)[i] or {}).get("tema", "")
        ditar = {**base, "lloji": "kolektive", "klasatDitar": items,
                 "lenda": " / ".join(dict.fromkeys(k["lenda"] for k in items)),
                 "lendaEmri": " / ".join(dict.fromkeys(k["emri"] for k in items)),
                 "fusha": " / ".join(dict.fromkeys(FUSHA.get(k["lenda"], "Shkencat e natyrës") for k in items)),
                 "shkalla": " dhe ".join(dict.fromkeys(shkalla(k["klasa"]) for k in items)),
                 "klasa": "Klasa " + "-".join(ROMAKE[klasa_nr(k["klasa"])] for k in items),
                 "tema": " | ".join(k["tema"] for k in items), "permbajtja": content}
    else:
        if body.lenda not in lic["lendet"]:
            raise HTTPException(403, "Kjo lëndë nuk përfshihet në licencën tuaj.")
        if lejuara and body.klasa not in lejuara:
            raise HTTPException(403, f"Paketa {PAKETA[paketa]['emri']} nuk vlen për {body.klasa}.")
        raport = body.dokumenti if paketa == 16 and body.dokumenti in ("javor", "tremujor") else ""
        javor = bool(raport)
        if not javor and not body.images and not body.tema.strip():
            raise HTTPException(400, "Ngarkoni foto të librit ose shkruani temën mësimore.")
        emri = emri_lende(body.lenda, body.lendaKurrikules)
        if paketa == 16 and body.dokumenti == "tremujor":
            prompt = prompt_ak_tremujor(emri, body.klasa, body.llojiAk, body.periudha, body.tema, body.shenime)
        elif paketa == 16 and body.dokumenti == "javor":
            prompt = prompt_ak_javor(emri, body.klasa, body.llojiAk, body.periudha, body.tema, body.shenime, len(body.images))
        elif paketa == 16:
            prompt = prompt_ak(emri, body.klasa, body.tema, body.llojiAk, body.koha, len(body.images), body.smartlab)
        else:
            prompt = prompt_standard(emri, body.lenda, body.klasa, body.tema, ak, len(body.images), body.smartlab, paketa == 15)
        content = await run_ai(prompt, body.images)
        ditar = {**base, "lloji": f"ak_{raport}" if javor else {16: "ak", 15: "parashkollor"}.get(paketa, "standard"),
                 "periudha": body.periudha,
                 "lenda": body.lenda, "lendaEmri": emri, "fusha": FUSHA.get(body.lenda, "Shkencat e natyrës"),
                 "shkalla": shkalla(body.klasa), "klasa": body.klasa, "llojiAk": body.llojiAk, "koha": body.koha,
                 "ditelindja": body.ditelindja, "pozicioni": body.pozicioni,
                 "tema": f"Raport {raport} {body.periudha}".strip() if javor else (body.tema.strip() or content.get("tema", "")), "permbajtja": content}
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


@app.on_event("startup")
async def sync_paketa_lendet():
    if not await db.migrations.find_one({"_id": "paketa_v2"}):
        for old, new in ((6, 16), (5, 15), (4, 14)):
            await db.licenses.update_many({"numriLendeve": old}, {"$set": {"numriLendeve": new}})
        await db.migrations.insert_one({"_id": "paketa_v2"})
    for n, p in PAKETA.items():
        await db.licenses.update_many({"numriLendeve": n, "aktivizuar": True}, {"$set": {"lendet": p["lendet"]}})


@app.on_event("startup")
async def migrate_devices():
    async for lic in db.licenses.find({"pajisja": {"$exists": True}}):
        pj = [{"id": lic["pajisja"], "emri": lic.get("pajisjaEmri") or "Pajisje"}] if lic.get("pajisja") else []
        await db.licenses.update_one({"_id": lic["_id"]}, {"$set": {"pajisjet": pj}, "$unset": {"pajisja": "", "pajisjaEmri": ""}})


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
