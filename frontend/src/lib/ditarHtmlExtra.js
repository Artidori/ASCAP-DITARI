import { esc, td, b, center, smartRow, list, TABLE, figRow } from "./htmlUtil";

const R = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const romake = (k) => R[parseInt(String(k).replace(/\D/g, ""), 10)] || k;
const FAZAT = [["faza1", "Lidhja e temës me njohuritë e mëparshme të nxënësve", 10], ["faza2", "Ndërtimi i njohurive të reja", 25], ["faza3", "Prezantimi dhe demonstrimi i rezultateve të arritura", 10]];

export function buildKolektiveHtml(d) {
  const p = d.permbajtja || {};
  const kl = d.klasatDitar || [];
  const pk = p.klasat || [];
  const w = 6 / kl.length;
  const perKlase = (fn) => `<tr>${kl.map((k, i) => td(fn(k, pk[i] || {}, i), w)).join("")}</tr>`;
  const faza = ([key, titull, min]) => {
    const f = p[key] || {};
    return `<tr>${td(`${b(`${titull} (${min} minuta)`)} — ${b("Teknika:")} ${esc(f.teknika)}`, 6)}</tr>
<tr>${td(`${b("a) Veprimtari të përbashkëta me të gjitha klasat:")} ${esc(f.perbashket)}`, 6)}</tr>
${perKlase((k, _, i) => `${b(`b) Klasa ${romake(k.klasa)}:`)} ${esc((f.sipas_klasave || [])[i])}`)}`;
  };
  return `${TABLE}
<tr>${td(`${b("Fusha:")} ${esc(d.fusha)}`, 2)}${td(`${b("Lënda/ët:")} ${esc(d.lendaEmri)}`)}${td(`${b("Shkalla/ët:")} ${esc(d.shkalla)}`)}${td(`${b("Klasat:")} ${kl.map((k) => romake(k.klasa)).join(" dhe ")}`)}${td(`${b("Data:")} ${esc(d.data)}`)}</tr>
${d.smartlab ? smartRow(6) : ""}
${perKlase((k, c) => `${b(`Klasa ${romake(k.klasa)} – ${esc(k.emri)}`)}<br>${b("Tema mësimore:")} ${esc(k.tema || c.tema)}`)}
<tr>${td(`${b("Situata e të nxënit:")} ${esc(p.situata)}`, 6)}</tr>
<tr>${td(b("Rezultatet e të nxënit të temës mësimore:"), 6)}</tr>
${perKlase((k, c) => `${b("Nxënësi:")}<br>${list(c.rezultatet)}`)}
${perKlase((k, c) => `${b("Fjalët kyçe:")} ${esc(c.fjalet_kyce)}`)}
<tr>${td(`${b("Burimet:")} ${esc(p.burimet)}`, 3)}${td(`${b("Lidhja me fushat e tjera ose me temat ndërkurrikulare:")} ${esc(p.lidhja_fushat)}`, 3)}</tr>
<tr>${td("Metodologjia dhe veprimtaritë e nxënësve", 6, center + "background-color:#f2f2f2;")}</tr>
${FAZAT.map(faza).join("\n")}
<tr>${td(`${b("Vlerësimi:")} ${esc(p.vleresimi)}${p.feedback ? `<br>${b("Feedback-u:")} ${esc(p.feedback)}` : ""}`, 6)}</tr>
${perKlase((k, c) => `${b(`Detyrat dhe puna e pavarur – Klasa ${romake(k.klasa)}:`)} ${esc(c.detyrat)}`)}
<tr>${td(`${b("Refleksioni i mësuesit: (Të plotësohet pas mësimit)")}<br>______________________________<br>______________________________`, 6)}</tr>
</table>`;
}

export function buildAkHtml(d) {
  const p = d.permbajtja || {};
  const hapat = (p.nderhyrja || []).map((h, i) => `${i + 1}. ${esc(h)}`).join("<br>");
  return `${TABLE}
<tr>${td(`${b("Emri i fëmijës:")} ${esc(d.akInitials)}`)}${td(`${b("Klasa:")} ${esc(romake(d.klasa))}`)}${td(`${b("Data:")} ${esc(d.data)}`)}${td(`${b("Koha:")} ${esc(d.koha || "45 min")}`)}</tr>
<tr>${td(`${b("Lloji i AK:")} ${esc(d.llojiAk)}`, 2)}${td(`${b("Lënda:")} ${esc(d.lendaEmri || d.lenda)}`, 2)}</tr>
${d.smartlab ? smartRow(4) : ""}
<tr>${td(`${b("Tema / Fusha e aftësive:")} ${esc(d.tema)}`, 4)}</tr>
<tr>${td(`${b("Objektivat (sipas PEI):")}<br>${b("Nxënësi/ja:")}<br>${list(p.objektivat)}`, 4)}</tr>
<tr>${td(`${b("Aktiviteti:")} ${esc(p.aktiviteti)}`, 4)}</tr>
<tr>${td(`${b("Materialet dhe mjetet didaktike:")} ${esc(p.materialet)}`, 4)}</tr>
<tr>${td(`${b("Ndërhyrja:")}<br>${hapat}${p.strategjite_sjelljes ? `<br>${b("Menaxhimi i vëmendjes dhe sjelljes:")} ${esc(p.strategjite_sjelljes)}` : ""}`, 4)}</tr>
<tr>${td(`${b("Vlerësimi:")} ${esc(p.vleresimi)}`, 4)}</tr>
<tr>${td(`${b("Reagimi ndaj aktivitetit: (Plotësohet pas aktivitetit)")}<br>______________________________________<br>______________________________________<br>______________________________________`, 4)}</tr>
<tr>${td(`${b("Këshilla për prindërit (puna në shtëpi):")} ${esc(p.prinderit)}`, 4)}</tr>
</table>`;
}

export function buildAkJavorHtml(d) {
  const p = d.permbajtja || {};
  const vija = "______________________________________<br>______________________________________";
  const num = (arr) => (arr || []).map((x, i) => `${i + 1}. ${esc(x)}`).join("<br>");
  return `${TABLE}
<tr>${td("PLANI I AKTIVITETEVE (javore)", 4, center + "background-color:#f2f2f2;")}</tr>
<tr>${td(`${b("Emri:")} ${esc(d.akInitials)}`)}${td(`${b("Periudha:")} ${esc(d.periudha)}`)}${td(`${b("Mësuesja:")} ${esc(d.mesuesi)}`)}${td(`${b("Klasa:")} ${esc(romake(d.klasa))}`)}</tr>
<tr>${td(`${b("Lloji i AK:")} ${esc(d.llojiAk)}`, 2)}${td(`${b("Lënda / fusha:")} ${esc(d.lendaEmri || d.lenda)}`, 2)}</tr>
<tr>${td(`${b("Objektivat që do të synohen:")}<br>${num(p.objektivat)}`, 4)}</tr>
<tr>${td(`${b("Data:")} ${esc(d.data)} &nbsp; ${b("Koha që do të punohet me fëmijën:")} 20’–25’ minuta për çdo aktivitet.<br>${b("Përzgjedhja e njërit prej objektivave:")} ${esc(p.objektivi_perzgjedhur)}`, 4)}</tr>
<tr>${td(`${b("Zhvillimi i aktiviteteve për secilin objektiv:")}<br>${num(p.aktivitetet)}`, 4)}</tr>
<tr>${td(`${b("Komente për çdo aktivitet të përzgjedhur për t'u punuar nga prindi:")}<br>${esc(p.komente_prindi) || vija}`, 4)}</tr>
<tr>${td(`${b("Vështirësitë e hasura për çdo aktivitet:")}<br>${esc(p.veshtiresite) || vija}`, 4)}</tr>
<tr>${td(`${b("Progresi i arritur në çdo aktivitet:")}<br>${esc(p.progresi) || vija}`, 4)}</tr>
</table>`;
}

export function buildAkTremujorHtml(d) {
  const p = d.permbajtja || {};
  return `${TABLE}
<tr>${td("RAPORTI TREMUJOR", 2, center + "background-color:#f2f2f2;")}</tr>
<tr>${td(`${b("Emri i fëmijës:")} ${esc(d.akInitials)}`)}${td(`${b("Ditëlindja:")} ${esc(d.ditelindja) || "____/____/______"}`)}</tr>
<tr>${td(`${b("Pozicioni i punës së personit që plotëson raportin:")} ${esc(d.pozicioni)} – ${esc(d.mesuesi)}`)}${td(`${b("Disiplina që do të përfshihet në raport:")} ${esc(d.lendaEmri || d.lenda)}`)}</tr>
<tr>${td(`${b("Data:")} ${esc(d.data)} &nbsp; ${b("Klasa:")} ${esc(romake(d.klasa))} &nbsp; ${b("Lloji i AK:")} ${esc(d.llojiAk)}`)}${td(`${b("Raport:")} ${esc(d.periudha)}`)}</tr>
<tr>${td(`${b("Progresi i objektivave të PEI (objektivat që janë arritur tremujorin, pikat e forta dhe të dobëta):")}<br>${esc(p.progresi)}<br>${b("Pikat e forta:")}<br>${list(p.pika_forta)}<br>${b("Pikat e dobëta:")}<br>${list(p.pika_dobeta)}`, 2)}</tr>
<tr>${td(`${b("Rekomandimet (objektiva specifike për t'u pasur parasysh në tremujorin pasardhës, ndryshime në frekuencën ose zgjatjen nëse është e aplikueshme):")}<br>${list(p.rekomandimet)}`, 2)}</tr>
<tr>${td(`${b("Aktivitete të sugjerueshme/materiale për prindërit për të arritur objektivat:")}<br>${list(p.aktivitete_prinderit)}`, 2)}</tr>
</table>`;
}

export function buildAk2Html(d) {
  const p = d.permbajtja || {};
  const rez = "Rezultatet e të nxënit të kompetencave të fushës sipas temës mësimore:";
  return `${TABLE}
<tr>${td(`${b("Model ditari")} &nbsp;&nbsp;&nbsp; ${b("Data:")} ${esc(d.data)}`, 6, "text-align:right;")}</tr>
<tr>${td(`${b("Fusha:")} ${esc(d.fusha)}`)}${td(`${b("Lënda:")} ${esc(d.lendaEmri || d.lenda)}`)}${td(`${b("Nxënësi:")} ${esc(d.akInitials)}${d.llojiAk ? ` (${esc(d.llojiAk)})` : ""}`, 2)}${td(`${b("Ora:")} _____`)}${td(`${b("Klasa:")} ${esc(romake(d.klasa))}`)}</tr>
${d.smartlab ? smartRow(6) : ""}
<tr>${td(`${b("Tema mësimore:")} ${esc(d.tema)}`, 3)}${td(`${b("Situata e të nxënit:")} ${esc(p.situata)}`, 3)}</tr>
<tr>${td(`${b(rez)} ${esc(p.rezultatet)}`, 3)}${td(`${b("Fjalë kyçe:")} ${esc(p.fjalet_kyce)}`, 3)}</tr>
<tr>${td(`${b(rez)} ${esc(p.rezultatet_pei)}`, 3)}${td(`${b("Metodologjia:")} ${esc(p.metodologjia)}`, 3)}</tr>
<tr>${td(`${b("Burimet e informacionit dhe mjete:")} ${esc(p.burimet)}`, 3)}${td(`${b("Lidhja me lëndë/ fusha të tjera:")} ${esc(p.lidhja)}`, 3)}</tr>
<tr>${td(`${b("Organizimi i orës së mësimit:")}<br>${b("Veprimtari paraprake:")} ${esc(p.veprimtari_paraprake)}<br>${(p.hapat || []).map((h, i) => `${b(`Hapi ${i + 1}:`)} ${esc(String(h).replace(/^Hapi\s*\d+\s*[:.-]?\s*/i, ""))}`).join("<br>")}`, 6)}</tr>
<tr>${td(`${b("Vlerësimi i nxënësit:")} ${esc(p.vleresimi)}`, 6)}</tr>
<tr>${td(`${b("Detyrë shtëpie:")} ${esc(p.detyre_shtepie)}`, 6)}</tr>
</table>`;
}

const VIJA = "____________________________________________";

export function buildFleteHtml(d) {
  const p = d.permbajtja || {};
  const seks = (p.seksionet || []).map((sk) => `<tr>${td(b(esc(sk.klasa)), 1, "background-color:#f2f2f2;")}</tr>
${(sk.ushtrimet || []).map((u, i) => `<tr>${td(`${b(`${i + 1}. (${esc(u.niveli)})`)} ${esc(u.kerkesa).replace(/\n/g, "<br>")}${"<br>" + Array.from({ length: Math.min(Number(u.rreshta) || 0, 6) }, () => VIJA).join("<br>")}`)}</tr>`).join("")}`).join("");
  return `${TABLE}
<tr>${td(`${b("FLETË PUNE")} — ${esc(p.titulli || d.tema)}<br>${b("Lënda:")} ${esc(d.lendaEmri || d.lenda)} &nbsp; ${b("Klasa:")} ${esc(d.klasa)} &nbsp; ${b("Data:")} ${esc(d.data)}<br>${b("Emri dhe mbiemri i nxënësit:")} ${VIJA}`, 1, "text-align:center;")}</tr>
<tr>${td(`${b("Udhëzime:")} ${esc(p.udhezime)}`)}</tr>
${seks}
</table>`;
}

const MENYRAT = [["fizike_plote", "Me ndihmë fizike të plotë"], ["fizike_pjesshme", "Me ndihmë fizike të pjesshme"], ["verbale", "Me ndihmë verbale"], ["nxitje", "Me nxitje"], ["pavarur", "I/E pavarur"]];

export function buildAkEcuriaHtml(d) {
  const p = d.permbajtja || {};
  const mujor = d.lloji === "ak_mujor2";
  const m = p.menyra || {};
  const firma = (rol) => `${b(rol)} Emër ____________ Mbiemër ____________ Firmë ____________`;
  return `${TABLE}
<tr>${td(`${b("SHKOLLA:")} ${esc(d.shkolla) || VIJA}`, 2)}</tr>
<tr>${td(`Format ${mujor ? "mujor" : "javor"} vlerësimi për ecurinë e PEI`, 2, center + "background-color:#f2f2f2;")}</tr>
<tr>${td(`${b("Data:")} ${esc(d.periudha || d.data)}`)}${td(`${b("Diagnoza:")} ${esc(d.llojiAk)}`)}</tr>
<tr>${td(`${b("Nxënësi:")} ${esc(d.akInitials)}`)}${td(`${b("Klasa:")} ${esc(romake(d.klasa))}`)}</tr>
<tr>${td(`${b("Ecuria mësimore sipas objektivave mësimore:")}<br>${esc(p.ecuria)}`, 2)}</tr>
<tr>${td(`${b("Mënyra e realizimit të objektivave:")}<br>${MENYRAT.map(([k, t], i) => `${i + 1}. ${b(t + ":")} ${esc(m[k] || "-")}`).join("<br>")}`, 2)}</tr>
<tr>${td(`${b("Nëse objektivat nuk janë arritur cilat janë disa nga arsyet e mundshme:")}<br>${(p.arsyet || []).map((x, i) => `${i + 1}. ${esc(x)}`).join("<br>")}`, 2)}</tr>
<tr>${td(`${b(`Problematikat e shfaqura gjatë ${mujor ? "muajit" : "javës"}:`)} ${esc(p.problematikat)}`, 2)}</tr>
<tr>${td(`${firma(mujor ? "Mësuese ndihmëse:" : "Punoi Mësuese ndihmëse:")}${mujor ? "" : `<br>${firma("Mora informacionin Prindi:")}`}`, 2)}</tr>
</table>`;
}

export function buildPara2Html(d) {
  const p = d.permbajtja || {};
  const lendet = p.lendet || [];
  const v = p.veprimtarite || [];
  return `${TABLE}
<tr>${td("AKTIVITET DITOR", 3, center + "background-color:#f2f2f2;")}</tr>
<tr>${td(`${b("Data:")} ${esc(d.data)} &nbsp; ${b("Grupi:")} ${esc(d.klasa)}<br>${b("Metodat:")} ${esc((p.metodat || []).join(", "))}`, 3)}</tr>
${d.smartlab ? smartRow(3) : ""}
<tr>${td("Planifikimi i aktivitetit ditor", 3, center)}</tr>
<tr>${td(b("Tema ditore"))}${td(esc(d.tema), 2)}</tr>
<tr>${td(b("Lëndët"))}${td(b("Temat sipas lëndëve"))}${td(b("Rezultatet e të nxënit"))}</tr>
${lendet.map((l) => `<tr>${td(b(esc(l.lenda)))}${td(esc(l.tema))}${td(list(l.rezultatet))}</tr>`).join("")}
<tr>${td(b("Fjalët kyçe"))}${td(esc(p.fjalet_kyce), 2)}</tr>
<tr>${td(b("Burimet, materialet dhe mjetet didaktike"))}${td(esc(p.burimet), 2)}</tr>
<tr>${td(`${b("Fillimi i veprimtarisë mësimore-edukative – Takimi i mëngjesit:")}<br>${esc(p.takimi_mengjesit)}`, 3)}</tr>
<tr>${td("Ecuria ditore – Metodologjia dhe veprimtaritë mësuese – fëmijë", 3, center + "background-color:#f2f2f2;")}</tr>
<tr>${td(b("Veprimtaritë"))}${td(b("Mësuesja"))}${td(b("Fëmijët"))}</tr>
${v.map((x, i) => `<tr>${td(b(`Veprimtaria ${i + 1}:${lendet[i] ? `<br>(${esc(lendet[i].lenda)})` : ""}`))}${td(esc(x.mesuesja))}${td(esc(x.femijet))}</tr>`).join("")}
${figRow(d, 3)}
<tr>${td(`${b("Vlerësimi i punës së fëmijëve:")}<br>${esc(p.vleresimi)}`, 3)}</tr>
<tr>${td(esc(p.aktivitet_lire), 3)}</tr>
</table>`;
}
