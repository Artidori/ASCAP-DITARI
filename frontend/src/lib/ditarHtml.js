const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const td = (content, colspan = 1, extra = "") =>
  `<td colspan="${colspan}" style="border:1px solid black;padding:8px;vertical-align:top;${extra}">${content}</td>`;
const b = (t) => `<span style="font-weight:bold;">${t}</span>`;

export function buildDitarHtml(d) {
  const p = d.permbajtja || {};
  const r = p.rezultatet || {};
  const f1 = p.faza1 || {}, f2 = p.faza2 || {}, f3 = p.faza3 || {};
  const dif = p.diferencimi || {};
  const v = (p.vleresimi || []).slice(0, 3);
  const det = p.detyrat || [];
  const ref = p.refleksioni || [];
  const akLabel = d.kaAk ? (d.akInitials ? `Nxënësi me AK (${esc(d.akInitials)}):` : "Nxënësi me AK:") : "Mbështetja:";
  const center = "vertical-align:middle;text-align:center;font-weight:bold;";
  return `<table style="border-collapse:collapse;width:100%;font-size:10pt;font-family:'Times New Roman',Times,serif;">
<tr>${td(`${b("Fusha:")} ${esc(d.fusha)}`)}${td(`${b("Lënda:")} ${esc(d.lenda)}`)}${td(`${b("Shkalla:")} ${esc(d.shkalla)}`)}${td(`${b("Klasa:")} ${esc(d.klasa.replace("Klasa ", ""))}`)}${td(`${b("Data:")} ${esc(d.data)}`)}</tr>
<tr>${td(`${b("Tema mësimore:")} ${esc(d.tema)}`, 2)}${td(`${b("Situata e të nxënit:")} ${esc(p.situata)}`, 3)}</tr>
<tr>${td(`${b("Rezultatet e të nxënit të kompetencave të fushës sipas temës mësimore:")}<br><br>${b("Komunikimi:")} ${esc(r.komunikimi)}<br>${b("Të menduarit:")} ${esc(r.te_menduarit)}<br>${b("Personale:")} ${esc(r.personale)}`, 3)}${td(`${b("Fjalët kyçe:")} ${esc(p.fjalet_kyce)}`, 2)}</tr>
<tr>${td(`${b("Burimet dhe Teknologjia:")} ${esc(p.burimet)} ${b("Teknologjia:")} ${esc(p.teknologjia)}`, 3)}${td(`${b("Lidhja me fushat e tjera:")} ${esc(p.lidhja_fushat)}`, 2)}</tr>
<tr>${td("Metodologjia dhe veprimtaritë e nxënësve", 5, center + "background-color:#f2f2f2;")}</tr>
<tr>${td("METODOLOGJIA", 2, center)}${td("PËRSHKRIMI I VEPRIMTARIVE", 3, center)}</tr>
<tr>${td(`${b("Lidhja e temës me njohuritë e mëparshme të nxënësve")}<br><br>10 minuta`, 2)}${td(`${b("Teknika: " + esc(f1.teknika))}<br>${esc(f1.pershkrimi)}`, 3)}</tr>
<tr>${td(`${b("Ndërtimi i njohurive të reja")}<br><br>25 minuta`, 2)}${td(`${b("Teknika: " + esc(f2.teknika))}<br>${b("Hapi 1:")} ${esc(f2.hapi1)}<br>${b("Hapi 2:")} ${esc(f2.hapi2)}`, 3)}</tr>
<tr>${td(`${b("Prezantimi dhe demonstrimi i rezultateve")}<br><br>10 minuta`, 2)}${td(`${b("Teknika: " + esc(f3.teknika))}<br>${esc(f3.pershkrimi)}`, 3)}</tr>
<tr>${td(`${b("Vlerësimi dhe feedback-u:")}<br>${v.map((x, i) => `&nbsp;&nbsp;&nbsp;&nbsp;${b(`Niveli ${i + 1}:`)} ${esc(String(x).replace(/^Niveli\s*\d+\s*[:.-]?\s*/i, ""))}`).join("<br>")}${p.feedback ? `<br>${b("Feedback-u:")} ${esc(p.feedback)}` : ""}`, 5)}</tr>
<tr>${td(`${b("Diferencimi (Nxënësit e avancuar dhe me AK):")}<br>${b("Nxënësit e avancuar:")} ${esc(dif.avancuar)}<br>${b(akLabel)} ${esc(dif.ak)}`, 5)}</tr>
<tr>${td(`${b("Detyrat dhe puna e pavarur:")}<br>${det.map((x, i) => `${b(`Detyra ${i + 1} (${["Bazë", "Mesatare", "E avancuar"][i] || ""}):`)} ${esc(String(x).replace(/^Detyr[ëe][^:]*:\s*/i, ""))}`).join("<br>")}`, 5)}</tr>
<tr>${td(`${b("Refleksioni i mësuesit: (Të plotësohet pas mësimit):")}<br>${ref.map((x) => `${esc(x)} ______________________________`).join("<br>")}`, 5)}</tr>
</table>`;
}

export function downloadWord(html, name) {
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Times New Roman',Times,serif;font-size:10pt;}</style></head><body>${html}</body></html>`;
  const blob = window.htmlDocx
    ? window.htmlDocx.asBlob(doc)
    : new Blob(["\ufeff", doc], { type: "application/msword" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.${window.htmlDocx ? "docx" : "doc"}`;
  a.click();
}
