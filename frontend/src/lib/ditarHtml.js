const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const td = (content, colspan = 1, extra = "") =>
  `<td colspan="${colspan}" style="border:1px solid black;padding:8px;vertical-align:top;${extra}">${content}</td>`;
const b = (t) => `<span style="font-weight:bold;">${t}</span>`;

const LABELS = {
  sq: { fusha: "Fusha", lenda: "Lënda", shkalla: "Shkalla", klasa: "Klasa", data: "Data", tema: "Tema mësimore", situata: "Situata e të nxënit", rez: "Rezultatet e të nxënit të kompetencave të fushës sipas temës mësimore", kom: "Komunikimi", men: "Të menduarit", per: "Personale", fjalet: "Fjalët kyçe", burimet: "Burimet dhe Teknologjia", tek: "Teknologjia", lidhja: "Lidhja me fushat e tjera", metTitle: "Metodologjia dhe veprimtaritë e nxënësve", met: "METODOLOGJIA", pershk: "PËRSHKRIMI I VEPRIMTARIVE", f1: "Lidhja e temës me njohuritë e mëparshme të nxënësve", f2: "Ndërtimi i njohurive të reja", f3: "Prezantimi dhe demonstrimi i rezultateve", min: "minuta", teknika: "Teknika", hapi: "Hapi", vler: "Vlerësimi dhe feedback-u", niveli: "Niveli", feedback: "Feedback-u", dif: "Diferencimi (Nxënësit e avancuar dhe me AK)", avan: "Nxënësit e avancuar", ak: "Nxënësi me AK", mbes: "Mbështetja", det: "Detyrat dhe puna e pavarur", detyra: "Detyra", lvl: ["Bazë", "Mesatare", "E avancuar"], ref: "Refleksioni i mësuesit: (Të plotësohet pas mësimit)" },
  en: { fusha: "Field", lenda: "Subject", shkalla: "Level", klasa: "Grade", data: "Date", tema: "Lesson topic", situata: "Learning situation", rez: "Learning outcomes of the field competences according to the lesson topic", kom: "Communication", men: "Thinking", per: "Personal", fjalet: "Key words", burimet: "Resources and Technology", tek: "Technology", lidhja: "Links with other fields", metTitle: "Methodology and students' activities", met: "METHODOLOGY", pershk: "DESCRIPTION OF ACTIVITIES", f1: "Connecting the topic with students' prior knowledge", f2: "Building new knowledge", f3: "Presenting and demonstrating results", min: "minutes", teknika: "Technique", hapi: "Step", vler: "Assessment and feedback", niveli: "Level", feedback: "Feedback", dif: "Differentiation (Advanced students and students with SEN)", avan: "Advanced students", ak: "Student with SEN", mbes: "Support", det: "Homework and independent work", detyra: "Task", lvl: ["Basic", "Intermediate", "Advanced"], ref: "Teacher's reflection: (To be completed after the lesson)" },
  it: { fusha: "Area", lenda: "Materia", shkalla: "Livello", klasa: "Classe", data: "Data", tema: "Argomento della lezione", situata: "Situazione di apprendimento", rez: "Risultati di apprendimento delle competenze dell'area secondo l'argomento", kom: "Comunicazione", men: "Pensiero", per: "Personale", fjalet: "Parole chiave", burimet: "Risorse e Tecnologia", tek: "Tecnologia", lidhja: "Collegamenti con altre aree", metTitle: "Metodologia e attività degli studenti", met: "METODOLOGIA", pershk: "DESCRIZIONE DELLE ATTIVITÀ", f1: "Collegamento dell'argomento con le conoscenze pregresse degli studenti", f2: "Costruzione delle nuove conoscenze", f3: "Presentazione e dimostrazione dei risultati", min: "minuti", teknika: "Tecnica", hapi: "Fase", vler: "Valutazione e feedback", niveli: "Livello", feedback: "Feedback", dif: "Differenziazione (Studenti avanzati e con BES)", avan: "Studenti avanzati", ak: "Studente con BES", mbes: "Supporto", det: "Compiti e lavoro autonomo", detyra: "Compito", lvl: ["Base", "Intermedio", "Avanzato"], ref: "Riflessione dell'insegnante: (Da completare dopo la lezione)" },
};
const LENDA_SHFAQ = { en: { Anglisht: "English" }, it: { Italisht: "Lingua italiana" } };
const FUSHA_SHFAQ = { en: "Languages and Communication", it: "Lingue e comunicazione" };
export const gjuhaPer = (lenda) => (lenda === "Anglisht" ? "en" : lenda === "Italisht" ? "it" : "sq");

export function buildDitarHtml(d) {
  const g = gjuhaPer(d.lenda);
  const L = LABELS[g];
  const p = d.permbajtja || {};
  const r = p.rezultatet || {};
  const f1 = p.faza1 || {}, f2 = p.faza2 || {}, f3 = p.faza3 || {};
  const dif = p.diferencimi || {};
  const v = (p.vleresimi || []).slice(0, 3);
  const det = p.detyrat || [];
  const ref = p.refleksioni || [];
  const fusha = FUSHA_SHFAQ[g] || d.fusha;
  const lenda = LENDA_SHFAQ[g]?.[d.lenda] || d.lendaEmri || d.lenda;
  const akLabel = d.kaAk ? (d.akInitials ? `${L.ak} (${esc(d.akInitials)}):` : `${L.ak}:`) : `${L.mbes}:`;
  const strip = (x) => esc(String(x).replace(/^(Niveli|Level|Livello|Detyr[ëe]|Task|Compito)[^:]{0,25}:\s*/i, ""));
  const center = "vertical-align:middle;text-align:center;font-weight:bold;";
  return `<table style="border-collapse:collapse;width:100%;font-size:10pt;font-family:'Times New Roman',Times,serif;">
<tr>${td(`${b(L.fusha + ":")} ${esc(fusha)}`)}${td(`${b(L.lenda + ":")} ${esc(lenda)}`)}${td(`${b(L.shkalla + ":")} ${esc(d.shkalla)}`)}${td(`${b(L.klasa + ":")} ${esc(d.klasa.replace("Klasa ", ""))}`)}${td(`${b(L.data + ":")} ${esc(d.data)}`)}</tr>
<tr>${td(`${b(L.tema + ":")} ${esc(d.tema)}`, 2)}${td(`${b(L.situata + ":")} ${esc(p.situata)}`, 3)}</tr>
<tr>${td(`${b(L.rez + ":")}<br><br>${b(L.kom + ":")} ${esc(r.komunikimi)}<br>${b(L.men + ":")} ${esc(r.te_menduarit)}<br>${b(L.per + ":")} ${esc(r.personale)}`, 3)}${td(`${b(L.fjalet + ":")} ${esc(p.fjalet_kyce)}`, 2)}</tr>
<tr>${td(`${b(L.burimet + ":")} ${esc(p.burimet)} ${b(L.tek + ":")} ${esc(p.teknologjia)}`, 3)}${td(`${b(L.lidhja + ":")} ${esc(p.lidhja_fushat)}`, 2)}</tr>
<tr>${td(L.metTitle, 5, center + "background-color:#f2f2f2;")}</tr>
<tr>${td(L.met, 2, center)}${td(L.pershk, 3, center)}</tr>
<tr>${td(`${b(L.f1)}<br><br>10 ${L.min}`, 2)}${td(`${b(L.teknika + ": " + esc(f1.teknika))}<br>${esc(f1.pershkrimi)}`, 3)}</tr>
<tr>${td(`${b(L.f2)}<br><br>25 ${L.min}`, 2)}${td(`${b(L.teknika + ": " + esc(f2.teknika))}<br>${b(L.hapi + " 1:")} ${esc(f2.hapi1)}<br>${b(L.hapi + " 2:")} ${esc(f2.hapi2)}`, 3)}</tr>
<tr>${td(`${b(L.f3)}<br><br>10 ${L.min}`, 2)}${td(`${b(L.teknika + ": " + esc(f3.teknika))}<br>${esc(f3.pershkrimi)}`, 3)}</tr>
<tr>${td(`${b(L.vler + ":")}<br>${v.map((x, i) => `&nbsp;&nbsp;&nbsp;&nbsp;${b(`${L.niveli} ${i + 1}:`)} ${strip(x)}`).join("<br>")}${p.feedback ? `<br>${b(L.feedback + ":")} ${esc(p.feedback)}` : ""}`, 5)}</tr>
<tr>${td(`${b(L.dif + ":")}<br>${b(L.avan + ":")} ${esc(dif.avancuar)}<br>${b(akLabel)} ${esc(dif.ak)}`, 5)}</tr>
<tr>${td(`${b(L.det + ":")}<br>${det.map((x, i) => `${b(`${L.detyra} ${i + 1} (${L.lvl[i] || ""}):`)} ${strip(x)}`).join("<br>")}`, 5)}</tr>
<tr>${td(`${b(L.ref + ":")}<br>${ref.map((x) => `${esc(x)} ______________________________`).join("<br>")}`, 5)}</tr>
</table>`;
}

export const headerText = (d) => `Mësuesi/ja: ${d.mesuesi} | Viti Shkollor: ${d.vitiShkollor || ""}`;

export function fitFontSize(html) {
  const box = document.createElement("div");
  box.style.cssText = "position:absolute;left:-9999px;top:0;width:180mm;font-family:'Times New Roman',serif;font-size:12pt;";
  box.innerHTML = html;
  box.querySelectorAll("table").forEach((t) => { t.style.fontSize = "12pt"; });
  document.body.appendChild(box);
  const mm = box.offsetWidth / 180;
  const fits = box.offsetHeight <= 255 * mm;
  box.remove();
  return fits ? 12 : 11;
}
