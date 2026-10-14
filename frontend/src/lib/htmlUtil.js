import { API } from "./api";
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const td = (content, colspan = 1, extra = "") =>
  `<td colspan="${colspan}" style="border:1px solid black;padding:8px;vertical-align:top;${extra}">${content}</td>`;
export const b = (t) => `<span style="font-weight:bold;">${t}</span>`;
export const center = "vertical-align:middle;text-align:center;font-weight:bold;";
export const smartRow = (cols) => `<tr>${td("ORA SMARTLAB", cols, center + "background-color:#f2f2f2;")}</tr>`;
export const list = (arr) => (arr || []).map((x) => `- ${esc(x)}`).join("<br>");
export const TABLE = `<table style="border-collapse:collapse;width:100%;font-size:10pt;font-family:'Times New Roman',Times,serif;">`;
export const figRow = (d, cols) => (d.figura?.id
  ? `<tr>${td(`<img src="${API}/figura/${d.figura.id}" width="210" style="width:210px;height:auto;display:block;margin:6px auto;" alt="figurë" />`, cols, "text-align:center;")}</tr>`
  : "");
