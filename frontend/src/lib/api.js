import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const LENDET = ["Gjuhë Shqipe", "Matematikë", "Anglisht", "Italisht", "Frengjisht", "TIK", "Fizikë", "Kimi", "Biologji", "Gjeografi", "Qytetari", "Edukim Fizik", "Histori", "Muzikë", "Art Pamor", "Dituri Natyre", "Kërcim", "Teatër", "Aftësim Teknologjik", "Letërsi", "Ekonomi", "Kurrikula me Zgjedhje", "Kurrikula në Bazë Shkolle"];
export const PAKETA_FIKSE = { 0: "Fillore (kl. 1–5)", 4: "Klasa Kolektive", 5: "Parashkollor (5-6 vjeç)", 6: "Nxënës me AK" };
export const PAKETA_PERSHKRIM = {
  0: "Gjuhë shqipe, Gjuhë angleze, Matematikë, Dituri natyre, TIK, Art pamor, Muzikë, Edukim fizik, Edukim për shoqërinë, Aftësim teknologjik praktik, Kërcim, Kurrikula me zgjedhje.",
  4: "Ditar për 2 ose 3 klasa njëkohësisht (klasat 1–9), çdo klasë me lëndën dhe temën e vet.",
  5: "Gjuhë shqipe, Matematikë, Dituri natyre, Edukim për shoqërinë, Edukim fizik, Muzikë, Art pamor, Teatër, Kërcim (5-6 vjeç).",
  6: "Plan ditor i mësuesit ndihmës për nxënës me aftësi të kufizuara (sipas PEI), të gjitha lëndët.",
};
export const paketaEmri = (n) => PAKETA_FIKSE[Number(n)] || `${n} lëndë`;
export const eshteFikse = (n) => Number(n) in PAKETA_FIKSE;
export const KURRIKULAT = ["Kurrikula me Zgjedhje", "Kurrikula në Bazë Shkolle"];
export const KLASAT = ["Parafillor", ...Array.from({ length: 12 }, (_, i) => `Klasa ${i + 1}`)];
export const KLASAT_FILLORE = KLASAT.slice(1, 6);
export const klasatPer = (n) => ({ 0: KLASAT_FILLORE, 4: KLASAT.slice(1, 10), 5: ["Parashkollor (5-6 vjeç)"], 6: KLASAT.slice(1) }[n] || KLASAT);
export const LLOJET_AK = ["Autizëm (ÇSA)", "Aftësi e kufizuar intelektuale", "Sindroma Down", "ADHD / Vështirësi në vëmendje", "Vështirësi specifike në të nxënë (disleksi, diskalkuli)", "Dëmtim i dëgjimit", "Dëmtim i shikimit", "Vonesë në të folur / gjuhë", "Aftësi e kufizuar fizike", "Tjetër"];

export const deviceId = () => {
  let id = localStorage.getItem("ascap_device");
  if (!id) { id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; localStorage.setItem("ascap_device", id); }
  return id;
};
export const deviceInfo = () => ({ pajisja: deviceId(), pajisjaEmri: `${/Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Telefon" : "Kompjuter"} · ${navigator.platform || ""}` });
export const licApi = () => axios.create({ baseURL: API, headers: { "X-License": localStorage.getItem("ascap_kodi") || "", "X-Device": deviceId() } });
export const adminApi = (pw) => axios.create({ baseURL: API, headers: { "X-Admin-Password": pw } });
export const errMsg = (e) => e?.response?.data?.detail || e.message || "Gabim";

export const resizeImage = (file, max = 1600) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    resolve(c.toDataURL("image/jpeg", 0.85));
  };
  img.onerror = () => reject(new Error(`Nuk u lexua fotografia: ${file.name}`));
  img.src = URL.createObjectURL(file);
});
