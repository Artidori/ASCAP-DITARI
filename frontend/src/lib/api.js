import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const LENDET = ["Gjuhë Shqipe", "Matematikë", "Anglisht", "Italisht", "TIK", "Fizikë", "Kimi", "Biologji", "Gjeografi", "Qytetari", "Edukim Fizik", "Histori", "Muzikë", "Art Pamor", "Dituri Natyre", "Kërcim", "Teatër", "Aftësim Teknologjik", "Letërsi", "Ekonomi", "Kurrikula me Zgjedhje", "Kurrikula në Bazë Shkolle"];
export const KURRIKULAT = ["Kurrikula me Zgjedhje", "Kurrikula në Bazë Shkolle"];
export const KLASAT = ["Parafillor", ...Array.from({ length: 12 }, (_, i) => `Klasa ${i + 1}`)];

export const licApi = () => axios.create({ baseURL: API, headers: { "X-License": localStorage.getItem("ascap_kodi") || "" } });
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
