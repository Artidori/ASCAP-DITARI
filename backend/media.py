import os
import io
import base64
import uuid
import requests
from PIL import Image

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except Exception:  # pragma: no cover
    LlmChat = None
    UserMessage = None

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "ascap-ditari"
_storage_key = None


def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise RuntimeError("EMERGENT_LLM_KEY is not set. Set it or disable Emergent-backed storage.")
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": key}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(), "Content-Type": content_type},
                        data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> bytes:
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage()}, timeout=60)
    resp.raise_for_status()
    return resp.content


async def generate_figure(prompt: str) -> bytes:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if genai and api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash-preview-image-generation")
            response = model.generate_content([
                f"Simple, clean educational illustration for a school lesson, white background, flat style, no text: {prompt}"
            ])
            image = None
            try:
                for part in response.parts:
                    if getattr(part, "inline_data", None):
                        image = part.inline_data.data
                        break
            except Exception:
                image = None
            if image is None and hasattr(response, "candidates"):
                for cand in response.candidates:
                    for part in getattr(cand, "content", []).parts if hasattr(getattr(cand, "content", []), "parts") else []:
                        if getattr(part, "inline_data", None):
                            image = part.inline_data.data
                            break
            if image:
                img = Image.open(io.BytesIO(base64.b64decode(image))).convert("RGB")
                img.thumbnail((512, 512))
                out = io.BytesIO()
                img.save(out, "JPEG", quality=80)
                return out.getvalue()
        except Exception:
            pass

    if LlmChat is None or UserMessage is None:
        raise ValueError("No image generation backend available. Configure GEMINI_API_KEY or EMERGENT_LLM_KEY.")

    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=str(uuid.uuid4()), system_message="You create simple educational illustrations.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    _, images = await chat.send_message_multimodal_response(UserMessage(
        text=f"Simple, clean educational illustration for a school lesson, white background, flat style, no text: {prompt}"))
    if not images:
        raise ValueError("no image")
    img = Image.open(io.BytesIO(base64.b64decode(images[0]["data"]))).convert("RGB")
    img.thumbnail((512, 512))
    out = io.BytesIO()
    img.save(out, "JPEG", quality=80)
    return out.getvalue()
