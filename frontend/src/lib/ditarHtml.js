import { esc, td, b, smartRow, figRow, list, TABLE } from "./htmlUtil";
import { buildKolektiveHtml, buildAkHtml, buildAkJavorHtml, buildAkTremujorHtml, buildAk2Html, buildFleteHtml, buildAkEcuriaHtml, buildPara2Html } from "./ditarHtmlExtra";

const LABELS = {
  sq: { fusha: "Fusha", lenda: "Lënda", shkalla: "Shkalla", klasa: "Klasa", data: "Data", tema: "Tema mësimore", situata: "Situata e të nxënit", rez: "Rezultatet e të nxënit të kompetencave të fushës sipas temës mësimore", kom: "Komunikimi", men: "Të menduarit", per: "Personale", fjalet: "Fjalët kyçe", burimet: "Burimet dhe Teknologjia", tek: "Teknologjia", lidhja: "Lidhja me fushat e tjera", metTitle: "Metodologjia dhe veprimtaritë e nxënësve", met: "METODOLOGJIA", pershk: "PËRSHKRIMI I VEPRIMTARIVE", f1: "Lidhja e temës me njohuritë e mëparshme të nxënësve", f2: "Ndërtimi i njohurive të reja", f3: "Prezantimi dhe demonstrimi i rezultateve", min: "minuta", teknika: "Teknika", hapi: "Hapi", vler: "Vlerësimi dhe feedback-u", niveli: "Niveli", feedback: "Feedback-u", dif: "Diferencimi (Nxënësit e avancuar dhe me AK)", avan: "Nxënësit e avancuar", ak: "Nxënësi me AK", mbes: "Mbështetja", det: "Detyrat dhe puna e pavarur", detyra: "Detyra", lvl: ["Bazë", "Mesatare", "E avancuar"], ref: "Refleksioni i mësuesit: (Të plotësohet pas mësimit)" },
  en: { fusha: "Field", lenda: "Subject", shkalla: "Level", klasa: "Grade", data: "Date", tema: "Lesson topic", situata: "Learning situation", rez: "Learning outcomes of the field competences according to the lesson topic", kom: "Communication", men: "Thinking", per: "Personal", fjalet: "Key words", burimet: "Resources and Technology", tek: "Technology", lidhja: "Links with other fields", metTitle: "Methodology and students' activities", met: "METHODOLOGY", pershk: "DESCRIPTION OF ACTIVITIES", f1: "Connecting the topic with students' prior knowledge", f2: "Building new knowledge", f3: "Presenting and demonstrating results", min: "minutes", teknika: "Technique", hapi: "Step", vler: "Assessment and feedback", niveli: "Level", feedback: "Feedback", dif: "Differentiation (Advanced students and students with SEN)", avan: "Advanced students", ak: "Student with SEN", mbes: "Support", det: "Homework and independent work", detyra: "Task", lvl: ["Basic", "Intermediate", "Advanced"], ref: "Teacher's reflection: (To be completed after the lesson)" },
  it: { fusha: "Area", lenda: "Materia", shkalla: "Livello", klasa: "Classe", data: "Data", tema: "Argomento della lezione", situata: "Situazione di apprendimento", rez: "Risultati di apprendimento delle competenze dell'area secondo l'argomento", kom: "Comunicazione", men: "Pensiero", per: "Personale", fjalet: "Parole chiave", burimet: "Risorse e Tecnologia", tek: "Tecnologia", lidhja: "Collegamenti con altre aree", metTitle: "Metodologia e attività degli studenti", met: "METODOLOGIA", pershk: "DESCRIZIONE DELLE ATTIVITÀ", f1: "Collegamento dell'argomento con le conoscenze pregresse degli studenti", f2: "Costruzione delle nuove conoscenze", f3: "Presentazione e dimostrazione dei risultati", min: "minuti", teknika: "Tecnica", hapi: "Fase", vler: "Valutazione e feedback", niveli: "Livello", feedback: "Feedback", dif: "Differenziazione (Studenti avanzati e con BES)", avan: "Studenti avanzati", ak: "Studente con BES", mbes: "Supporto", det: "Compiti e lavoro autonomo", detyra: "Compito", lvl: ["Base", "Intermedio", "Avanzato"], ref: "Riflessione dell'insegnante: (Da completare dopo la lezione)" },
  fr: { fusha: "Domaine", lenda: "Matière", shkalla: "Niveau", klasa: "Classe", data: "Date", tema: "Thème de la leçon", situata: "Situation d'apprentissage", rez: "Résultats d'apprentissage des compétences du domaine selon le thème", kom: "Communication", men: "Réflexion", per: "Personnel", fjalet: "Mots-clés", burimet: "Ressources et Technologie", tek: "Technologie", lidhja: "Liens avec d'autres domaines", metTitle: "Méthodologie et activités des élèves", met: "MÉTHODOLOGIE", pershk: "DESCRIPTION DES ACTIVITÉS", f1: "Lien du thème avec les connaissances antérieures des élèves", f2: "Construction des nouvelles connaissances", f3: "Présentation et démonstration des résultats", min: "minutes", teknika: "Technique", hapi: "Étape", vler: "Évaluation et feedback", niveli: "Niveau", feedback: "Feedback", dif: "Différenciation (Élèves avancés et à besoins particuliers)", avan: "Élèves avancés", ak: "Élève à besoins particuliers", mbes: "Soutien", det: "Devoirs et travail autonome", detyra: "Devoir", lvl: ["Base", "Intermédiaire", "Avancé"], ref: "Réflexion de l'enseignant : (À compléter après la leçon)" },
};
const LENDA_SHFAQ = { en: { Anglisht: "English", "Gjuhë Angleze": "English" }, it: { Italisht: "Lingua italiana" }, fr: { Frengjisht: "Langue française" } };
const FUSHA_SHFAQ = { en: "Languages and Communication", it: "Lingue e comunicazione", fr: "Langues et communication" };
const PARASHKOLLOR = { shkalla: "Grupmosha", metTitle: "Metodologjia dhe veprimtaritë e fëmijëve", f1: "Lidhja e temës me njohuritë e mëparshme të fëmijëve", dif: "Diferencimi (Fëmijët e avancuar dhe me AK)", avan: "Fëmijët e avancuar", ak: "Fëmija me AK", det: "Veprimtari në shtëpi me prindërit", ref: "Refleksioni i mësuesit/edukatores: (Të plotësohet pas veprimtarisë)" };
export const gjuhaPer = (lenda) => (["Anglisht", "Gjuhë Angleze"].includes(lenda) ? "en" : lenda === "Italisht" ? "it" : lenda === "Frengjisht" ? "fr" : "sq");

export function buildDitarHtml(d) {
  if (d.lloji === "kolektive") return buildKolektiveHtml(d);
  if (d.lloji === "ak") return buildAkHtml(d);
  if (d.lloji === "ak_javor") return buildAkJavorHtml(d);
  if (d.lloji === "ak_tremujor") return buildAkTremujorHtml(d);
  if (d.lloji === "ak2") return buildAk2Html(d);
  if (d.lloji === "flete") return buildFleteHtml(d);
  if (d.lloji === "ak_javor2" || d.lloji === "ak_mujor2") return buildAkEcuriaHtml(d);
  if (d.lloji === "parashkollor2") return buildPara2Html(d);
  if (d.lloji === "standard90") return build90Html(d);
  const g = gjuhaPer(d.lenda);
  const para = d.lloji === "parashkollor";
  const L = para ? { ...LABELS.sq, ...PARASHKOLLOR } : LABELS[g];
  const [m1, m2, m3] = para ? [5, 20, 5] : [10, 25, 10];
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
<tr>${td(`${b(L.fusha + ":")} ${esc(fusha)}`)}${td(`${b(L.lenda + ":")} ${esc(lenda)}`)}${td(`${b(L.shkalla + ":")} ${esc(para ? "5-6 vjeç" : d.shkalla)}`)}${td(`${b(L.klasa + ":")} ${esc(para ? "Viti përgatitor" : d.klasa.replace("Klasa ", ""))}`)}${td(`${b(L.data + ":")} ${esc(d.data)}`)}</tr>
${d.smartlab ? smartRow(5) : ""}
<tr>${td(`${b(L.tema + ":")} ${esc(d.tema)}`, 2)}${td(`${b(L.situata + ":")} ${esc(p.situata)}`, 3)}</tr>
<tr>${td(`${b(L.rez + ":")}<br><br>${b(L.kom + ":")} ${esc(r.komunikimi)}<br>${b(L.men + ":")} ${esc(r.te_menduarit)}<br>${b(L.per + ":")} ${esc(r.personale)}`, 3)}${td(`${b(L.fjalet + ":")} ${esc(p.fjalet_kyce)}`, 2)}</tr>
<tr>${td(`${b(L.burimet + ":")} ${esc(p.burimet)} ${b(L.tek + ":")} ${esc(p.teknologjia)}`, 3)}${td(`${b(L.lidhja + ":")} ${esc(p.lidhja_fushat)}`, 2)}</tr>
<tr>${td(L.metTitle, 5, center + "background-color:#f2f2f2;")}</tr>
<tr>${td(L.met, 2, center)}${td(L.pershk, 3, center)}</tr>
<tr>${td(`${b(L.f1)}<br><br>${m1} ${L.min}`, 2)}${td(`${b(L.teknika + ": " + esc(f1.teknika))}<br>${esc(f1.pershkrimi)}`, 3)}</tr>
<tr>${td(`${b(L.f2)}<br><br>${m2} ${L.min}`, 2)}${td(`${b(L.teknika + ": " + esc(f2.teknika))}<br>${b(L.hapi + " 1:")} ${esc(f2.hapi1)}<br>${b(L.hapi + " 2:")} ${esc(f2.hapi2)}`, 3)}</tr>
<tr>${td(`${b(L.f3)}<br><br>${m3} ${L.min}`, 2)}${td(`${b(L.teknika + ": " + esc(f3.teknika))}<br>${esc(f3.pershkrimi)}`, 3)}</tr>
${figRow(d, 5)}
<tr>${td(`${b(L.vler + ":")}<br>${v.map((x, i) => `&nbsp;&nbsp;&nbsp;&nbsp;${b(`${L.niveli} ${i + 1}:`)} ${strip(x)}`).join("<br>")}${p.feedback ? `<br>${b(L.feedback + ":")} ${esc(p.feedback)}` : ""}`, 5)}</tr>
<tr>${td(`${b(L.dif + ":")}<br>${b(L.avan + ":")} ${esc(dif.avancuar)}<br>${b(akLabel)} ${esc(dif.ak)}`, 5)}</tr>
<tr>${td(`${b(L.det + ":")}<br>${det.map((x, i) => `${b(`${L.detyra} ${i + 1} (${L.lvl[i] || ""}):`)} ${strip(x)}`).join("<br>")}`, 5)}</tr>
<tr>${td(`${b(L.ref + ":")}<br>${ref.map((x) => `${esc(x)} ______________________________`).join("<br>")}`, 5)}</tr>
</table>`;
}

const KOHA = { sq: ["Ora", "Tema"], en: ["Lesson", "Topic"], it: ["Ora", "Argomento"], fr: ["Heure", "Thème"] };

function build90Html(d) {
  const g = gjuhaPer(d.lenda);
  const L = LABELS[g];
  const [ORA, TEMA] = KOHA[g];
  const p = d.permbajtja || {};
  const fz = p.fazat || [];
  const dif = p.diferencimi || {};
  const strip = (x) => esc(String(x).replace(/^(Niveli|Level|Livello|Niveau|Detyr[ëe]|Task|Compito|Devoir)[^:]{0,25}:\s*/i, ""));
  const twoTemas = (a, c) => `• ${b(`${TEMA} 1 (${ORA} I):`)} ${esc(a)}<br>• ${b(`${TEMA} 2 (${ORA} II):`)} ${esc(c)}`;
  const nivelet = (arr) => (arr || []).slice(0, 3).map((x, i) => `&nbsp;&nbsp;&nbsp;&nbsp;${b(`${L.niveli} ${i + 1}:`)} ${strip(x)}`).join("<br>");
  const titujt = [[L.f1, 10], [L.f2, 25], [L.f3, 10]];
  const fazaRow = (i) => {
    const [t, m] = titujt[i % 3];
    const f = fz[i] || {};
    return `<tr>${td(`${b(t)}<br><br>(${TEMA} ${i < 3 ? 1 : 2} / ${ORA} ${i < 3 ? "I" : "II"} – ${m} ${L.min})`, 2)}${td(`${b(L.teknika + ": " + esc(f.teknika))}<br>${esc(f.pershkrimi).replace(/(Hapi \d:|Step \d:|Fase \d:|Étape \d:)/g, "<br>$1")}`, 3)}</tr>`;
  };
  return `${TABLE}
<tr>${td(`${b(L.fusha + ":")} ${esc(FUSHA_SHFAQ[g] || d.fusha)}`)}${td(`${b(L.lenda + ":")} ${esc(LENDA_SHFAQ[g]?.[d.lenda] || d.lendaEmri || d.lenda)}`)}${td(`${b(L.shkalla + ":")} ${esc(d.shkalla)}`)}${td(`${b(L.klasa + ":")} ${esc(d.klasa.replace("Klasa ", ""))}`)}${td(`${b(L.data + ":")} ${esc(d.data)}`)}</tr>
${d.smartlab ? smartRow(5) : ""}
<tr>${td(`${b(L.tema + ":")}<br>${twoTemas(p.tema1, p.tema2)}`, 2)}${td(`${b(L.situata + ":")}<br>${twoTemas(p.situata1, p.situata2)}`, 3)}</tr>
<tr>${td(`${b(L.rez + ":")}<br>• ${b(`${TEMA} 1 (${ORA} I):`)}<br>${list(p.rezultatet1)}<br>• ${b(`${TEMA} 2 (${ORA} II):`)}<br>${list(p.rezultatet2)}`, 3)}${td(`${b(L.fjalet + ":")}<br>${esc(p.fjalet_kyce)}`, 2)}</tr>
<tr>${td(`${b(L.burimet + ":")} ${esc(p.burimet)}<br>${b(L.tek + ":")} ${esc(p.teknologjia)}`, 3)}${td(`${b(L.lidhja + ":")}<br>${esc(p.lidhja_fushat)}`, 2)}</tr>
<tr>${td(L.metTitle, 5, "vertical-align:middle;text-align:center;font-weight:bold;background-color:#f2f2f2;")}</tr>
<tr>${td(L.met, 2, "text-align:center;font-weight:bold;")}${td(L.pershk, 3, "text-align:center;font-weight:bold;")}</tr>
${[0, 1, 2, 3, 4, 5].map(fazaRow).join("\n")}
${figRow(d, 5)}
<tr>${td(`${b(L.vler + ":")}<br>• ${b(`${TEMA} 1 (${ORA} I):`)}<br>${nivelet(p.vleresimi1)}<br>• ${b(`${TEMA} 2 (${ORA} II):`)}<br>${nivelet(p.vleresimi2)}${p.feedback ? `<br>${b(L.feedback + ":")} ${esc(p.feedback)}` : ""}`, 5)}</tr>
<tr>${td(`${b(L.dif + ":")}<br>• ${b(L.avan + ":")} ${esc(dif.avancuar)}<br>• ${b((d.kaAk ? L.ak : L.mbes) + ":")} ${esc(dif.ak)}`, 5)}</tr>
<tr>${td(`${b(L.det + ":")}<br>${(p.detyrat || []).map((x, i) => `• ${b(`${L.detyra} ${i + 1} (${L.lvl[i] || ""}):`)} ${strip(x)}`).join("<br>")}`, 5)}</tr>
<tr>${td(`${b(L.ref + ":")}<br>${(p.refleksioni || []).map((x) => `• ${esc(x)} ______________________________`).join("<br>")}`, 5)}</tr>
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
