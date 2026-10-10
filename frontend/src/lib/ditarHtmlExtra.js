import { esc, td, b, center, smartRow, list, TABLE } from "./htmlUtil";

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
