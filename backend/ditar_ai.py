import re
import json

FUSHA = {
    "Matematikë": "Matematikë", "Gjuhë Shqipe": "Gjuhët dhe komunikimi", "Anglisht": "Gjuhët dhe komunikimi",
    "Italisht": "Gjuhët dhe komunikimi", "Frengjisht": "Gjuhët dhe komunikimi", "Muzikë": "Arte", "Art Pamor": "Arte",
    "Edukim Fizik": "Edukim fizik, sporte dhe shëndet", "Histori": "Shoqëria dhe mjedisi",
    "Gjeografi": "Shoqëria dhe mjedisi", "Qytetari": "Shoqëria dhe mjedisi", "TIK": "TIK dhe Teknologji",
    "Kërcim": "Arte", "Teatër": "Arte", "Aftësim Teknologjik": "Teknologji dhe TIK",
    "Dituri Natyre": "Shkencat e natyrës", "Kurrikula në Bazë Shkolle": "Kurrikula në bazë shkolle",
    "Kurrikula me Zgjedhje": "Kurrikula me zgjedhje", "Letërsi": "Gjuhët dhe komunikimi", "Ekonomi": "Shoqëria dhe mjedisi",
    "Gjuhë Angleze": "Gjuhët dhe komunikimi", "Edukim Fizik, Sporte dhe Shëndet": "Edukim fizik, sporte dhe shëndet",
    "Edukim për Shoqërinë": "Shoqëria dhe mjedisi", "Aftësim Teknologjik Praktik": "Teknologji dhe TIK",
}

LENDET_STANDARD = ["Gjuhë Shqipe", "Matematikë", "Anglisht", "Italisht", "Frengjisht", "TIK", "Fizikë", "Kimi", "Biologji",
                   "Gjeografi", "Qytetari", "Edukim Fizik", "Histori", "Muzikë", "Art Pamor", "Dituri Natyre", "Kërcim",
                   "Teatër", "Aftësim Teknologjik", "Letërsi", "Ekonomi", "Kurrikula me Zgjedhje", "Kurrikula në Bazë Shkolle"]
FILLORE = ["Gjuhë Shqipe", "Gjuhë Angleze", "Matematikë", "Dituri Natyre", "TIK", "Art Pamor", "Muzikë",
           "Edukim Fizik, Sporte dhe Shëndet", "Edukim për Shoqërinë", "Aftësim Teknologjik Praktik", "Kërcim",
           "Kurrikula me Zgjedhje"]
KOLEKTIVE = FILLORE + ["Teatër", "Letërsi", "Frengjisht", "Italisht", "Fizikë", "Kimi", "Biologji", "Histori",
                       "Gjeografi", "Qytetari", "Kurrikula në Bazë Shkolle"]
PARASHKOLLOR = ["Gjuhë Shqipe", "Matematikë", "Dituri Natyre", "Edukim për Shoqërinë", "Edukim Fizik, Sporte dhe Shëndet",
                "Muzikë", "Art Pamor", "Teatër", "Kërcim"]
AK_LENDET = list(dict.fromkeys(FILLORE + LENDET_STANDARD))

KLASA = lambda a, b: [f"Klasa {i}" for i in range(a, b + 1)]
# numriLendeve: 1-5 standard, 0 Fillore, 14 Kolektive, 15 Parashkollor, 16 AK
PAKETA = {
    0: {"emri": "Fillore", "lendet": FILLORE, "klasat": KLASA(1, 5)},
    14: {"emri": "Klasa Kolektive", "lendet": KOLEKTIVE, "klasat": KLASA(1, 9)},
    15: {"emri": "Parashkollor", "lendet": PARASHKOLLOR, "klasat": ["Parashkollor (5-6 vjeç)"]},
    16: {"emri": "Nxënës me AK", "lendet": AK_LENDET, "klasat": KLASA(1, 12)},
}
KURRIKULAT = ("Kurrikula me Zgjedhje", "Kurrikula në Bazë Shkolle")
GJUHA = {"Anglisht": "ANGLISHT (English)", "Gjuhë Angleze": "ANGLISHT (English)",
         "Italisht": "ITALISHT (Italiano)", "Frengjisht": "FRËNGJISHT (Français)"}

ROMAKE = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]


def klasa_nr(klasa: str) -> int:
    m = re.search(r"\d+", klasa)
    return int(m.group()) if m else 0


def shkalla(klasa: str) -> str:
    if "Parashkollor" in klasa or "Parafillor" in klasa:
        return "I"
    return {1: "I", 2: "I", 3: "II", 4: "II", 5: "III", 6: "III", 7: "IV", 8: "IV", 9: "IV", 10: "V", 11: "V", 12: "VI"}.get(klasa_nr(klasa), "III")


SYSTEM = """Ti je ekspert i kurrikulës shqiptare (ASCAP) dhe harton ditarë mësimorë zyrtarë për mësuesit.
Përgjigju VETËM me një objekt JSON të vlefshëm, pa tekst tjetër, pa markdown. Shkruaj në gjuhën shqipe standarde."""

VETA = """RREGULLA GJUHËSORE:
- Rezultatet e të nxënit/objektivat shkruhen në VETËN E TRETË NJËJËS për {kush} në mënyrën dëftore (p.sh. "{Kush} identifikon...", "përshkruan...", "zbaton..."), JO "Të identifikojë...".
- Përshkrimi i veprimtarive të orës shkruhet në VETËN E PARË nga mësuesi/ja (p.sh. "Prezantoj...", "U kërkoj {kujt} të...", "Ndaj klasën në grupe...", "Shpjegoj...")."""

SMARTLAB = """KJO ËSHTË ORË SMARTLAB: përdor mjetet e laboratorit SMART (tabelë interaktive, tableta, kompjuterë, projektor,
aplikacione dhe simulime digjitale, kuize online, video edukative) në burime, teknologji dhe konkretisht në çdo fazë të veprimtarive."""

SCHEMA = """{
 "tema": "tema mësimore (nga libri nëse jepet foto)",
 "situata": "situatë konkrete e të nxënit, e lidhur me jetën e nxënësve (3-4 fjali)",
 "rezultatet": {"komunikimi": "...", "te_menduarit": "...", "personale": "..."},
 "fjalet_kyce": "5-7 fjalë kyçe nga përmbajtja, të ndara me presje",
 "burimet": "libri, faqet, mjete konkrete",
 "teknologjia": "...",
 "lidhja_fushat": "lëndë të tjera dhe si lidhen",
 "faza1": {"teknika": "...", "pershkrimi": "veprimtari konkrete për lidhjen me njohuritë e mëparshme"},
 "faza2": {"teknika": "...", "hapi1": "shpjegim konkret i koncepteve nga libri", "hapi2": "ushtrime/punë konkrete nga libri"},
 "faza3": {"teknika": "...", "pershkrimi": "..."},
 "vleresimi": ["Niveli 1 ...", "Niveli 2 ...", "Niveli 3 ..."],
 "feedback": "1-2 fjali konkrete feedback-u që mësuesi u jep nxënësve për këtë temë",
 "diferencimi": {"avancuar": "...", "ak": "..."},
 "detyrat": ["Detyrë bazë ...", "Detyrë mesatare ...", "Detyrë e avancuar ..."],
 "refleksioni": ["pyetje refleksioni 1", "pyetje refleksioni 2"]
}"""

SCHEMA_KOLEKTIVE = """{
 "situata": "një situatë e përbashkët për të gjitha klasat (2-3 fjali)",
 "burimet": "...",
 "lidhja_fushat": "lidhja me fushat e tjera ose temat ndërkurrikulare",
 "klasat": [{"tema": "...", "rezultatet": ["3 rezultate për këtë klasë"], "fjalet_kyce": "...", "detyrat": "detyra e shtëpisë për këtë klasë"}],
 "faza1": {"teknika": "...", "perbashket": "veprimtari e përbashkët me të gjitha klasat", "sipas_klasave": ["veprimtari për çdo klasë, sipas radhës"]},
 "faza2": {"teknika": "...", "perbashket": "...", "sipas_klasave": ["..."]},
 "faza3": {"teknika": "...", "perbashket": "...", "sipas_klasave": ["..."]},
 "vleresimi": "teknikat e vlerësimit dhe nxënësit që do të vëzhgohen, sipas niveleve të arritjes",
 "feedback": "1-2 fjali feedback-u"
}"""

SCHEMA_AK = """{
 "tema": "...",
 "objektivat": ["3 objektiva afatshkurtër të matshëm sipas nivelit të fëmijës (PEI)"],
 "aktiviteti": "përshkrimi i aktivitetit kryesor",
 "materialet": "materiale dhe mjete didaktike konkrete, të përshtatura për llojin e AK",
 "nderhyrja": ["hapa konkretë të ndërhyrjes: nxitje, modelim, përforcim, përshtatje (4-5 hapa)"],
 "strategjite_sjelljes": "si menaxhoj vëmendjen dhe sjelljen gjatë aktivitetit",
 "vleresimi": "si e vlerësoj arritjen e objektivave (me/pa ndihmë, me nxitje)",
 "prinderit": "aktivitet i sugjeruar për prindërit në shtëpi për të përforcuar objektivat"
}"""


def lang_rule(lenda: str) -> str:
    g = GJUHA.get(lenda)
    if not g:
        return ""
    return (f"\nE RËNDËSISHME: Shkruaj TË GJITHË përmbajtjen e JSON-it (vlerat) VETËM në {g}, jo në shqip, "
            "duke ruajtur të njëjtat rregulla të vetës (veta e tretë për nxënësin, veta e parë për mësuesin). Çelësat mbeten siç janë.")


def foto_rule(n: int) -> str:
    if not n:
        return "Nuk ka foto; bazohu te tema."
    return (f"Analizo me kujdes {n} fotot e faqeve të librit sipas radhës dhe shpërndaj informacionin e tyre "
            "(koncepte, shembuj, ushtrime, fjalë kyçe, faqe) në pjesët përkatëse të ditarit.")


def prompt_standard(emri_lendes, lenda, klasa, tema, ak, n_img, smartlab, parashkollor):
    kush, kujt = ("Fëmija", "fëmijëve") if parashkollor else ("Nxënësi/ja", "nxënësve")
    koha = ("Veprimtaria zgjat 30 min (5 + 20 + 5), me mësimdhënie të integruar përmes lojës, këngës, tregimit dhe manipulimit "
            "me objekte, sipas programit të arsimit parashkollor (ASCAP 2019) për moshën 5-6 vjeç. Përdor 'fëmijë' në vend të 'nxënës'. "
            "Vlerësimi bëhet me vëzhgim; detyrat janë veprimtari të thjeshta me prindërit."
            if parashkollor else "Ora zgjat 45 min (10 + 25 + 10).")
    return f"""Harto ditarin për: Lënda: {emri_lendes}; {klasa}; Shkalla {shkalla(klasa)}.
Tema e dhënë nga mësuesi: "{tema or '(nxirre nga fotot e librit)'}".
{ak}
{foto_rule(n_img)}
{koha} Ji specifik për përmbajtjen, jo i përgjithshëm.
{VETA.format(kush=kush, Kush=kush, kujt=kujt)}
{SMARTLAB if smartlab else ''}
Mos shkruaj parashtesa si "Niveli 1:" ose "Detyra 1:" në vlera.{lang_rule(lenda)}
Kthe JSON me këtë strukturë saktësisht:
{SCHEMA}"""


def prompt_kolektive(klasat, ak, n_img, smartlab):
    lista = "\n".join(f"{i + 1}. Klasa {ROMAKE[klasa_nr(k['klasa'])]} – Lënda: {k['emri']} – Tema: {k['tema'] or '(nga fotot)'}"
                      for i, k in enumerate(klasat))
    return f"""Harto ditarin për një KLASË KOLEKTIVE (një mësues punon njëkohësisht me {len(klasat)} klasa në një orë 45 min),
sipas udhëzuesit të ASCAP për klasat kolektive. Klasat sipas radhës (nis me klasën më të ulët):
{lista}
{ak}
{foto_rule(n_img)}
Në çdo fazë planifiko veprimtari të përbashkëta me të gjitha klasat dhe veprimtari sipas klasave (njëra klasë punon e pavarur ndërsa
mësuesi punon me tjetrën). Lista "klasat" dhe çdo "sipas_klasave" duhet të kenë saktësisht {len(klasat)} elemente, në të njëjtën radhë.
Fazat: lidhja me njohuritë e mëparshme (10 min), ndërtimi i njohurive të reja (25 min), prezantimi i rezultateve (10 min).
{VETA.format(kush="Nxënësi/ja", Kush="Nxënësi/ja", kujt="nxënësve")}
{SMARTLAB if smartlab else ''}
Kthe JSON me këtë strukturë saktësisht:
{SCHEMA_KOLEKTIVE}"""


def prompt_ak(emri_lendes, klasa, tema, lloji, koha, n_img, smartlab):
    return f"""Harto PLANIN DITOR të mësuesit ndihmës për një nxënës me aftësi të kufizuara, sipas manualit të ASCAP për mësuesit ndihmës
(modeli: Objektivat, Aktiviteti, Ndërhyrja, Reagimi ndaj aktivitetit). Objektivat lidhen me PEI dhe përshtaten me nivelin e fëmijës, jo të klasës.
Lënda: {emri_lendes}; {klasa}; Lloji i AK: {lloji or 'i papërcaktuar'}; Kohëzgjatja: {koha or '45 min'}.
Tema/objektivi nga mësuesi: "{tema or '(nxirre nga fotot e librit)'}".
{foto_rule(n_img)}
Përdor strategji të përshtatshme për llojin e AK (p.sh. udhëzime të qarta e të shkurtra, mbështetje vizuale, PECS, copëzim i detyrës,
përforcim pozitiv, përsëritje). Ji konkret dhe praktik.
{VETA.format(kush="Nxënësi/ja", Kush="Nxënësi/ja", kujt="nxënësit")}
{SMARTLAB if smartlab else ''}
Kthe JSON me këtë strukturë saktësisht:
{SCHEMA_AK}"""


SCHEMA_AK_JAVOR = """{
 "objektivat": ["3 objektiva që do të synohen gjatë javës (sipas PEI)"],
 "objektivi_perzgjedhur": "objektivi kryesor i përzgjedhur për këtë javë",
 "aktivitetet": ["7 aktivitete konkrete 20-25 min secili për përmbushjen e objektivave, me ditën përkatëse (p.sh. 'E hënë: ...')"],
 "komente_prindi": "aktivitete dhe komente për punën që do të bëjë prindi në shtëpi",
 "veshtiresite": "vështirësitë e hasura (bazuar te shënimet e mësuesit; bosh nëse s'ka shënime)",
 "progresi": "progresi i arritur (bazuar te shënimet e mësuesit; bosh nëse s'ka shënime)"
}"""


def prompt_ak_javor(emri_lendes, klasa, lloji, periudha, objektivat, shenime, n_img):
    return f"""Harto RAPORTIN JAVOR / PLANIN E AKTIVITETEVE (javore) të mësuesit ndihmës për një nxënës me aftësi të kufizuara,
sipas modelit të manualit të ASCAP për mësuesit ndihmës (Objektivat që do të synohen, Objektivi i përzgjedhur, Zhvillimi i aktiviteteve
për secilin objektiv – 20-25 min për çdo aktivitet, Komente për aktivitetet e prindit, Vështirësitë e hasura, Progresi i arritur).
Lënda/fusha: {emri_lendes or 'e përgjithshme'}; {klasa}; Lloji i AK: {lloji or 'i papërcaktuar'}; Periudha: {periudha or 'java aktuale'}.
Objektivat nga mësuesi (PEI): "{objektivat or '(propozo sipas llojit të AK dhe klasës)'}".
Shënimet e mësuesit për javën: "{shenime or '(nuk ka; lëri bosh vështirësitë dhe progresin)'}".
{foto_rule(n_img)}
Objektivat në vetën e tretë njëjës, mënyra dëftore (p.sh. "Nxënësi/ja lexon...", jo "Të lexojë..."); aktivitetet në vetën e parë nga mësuesi/ja ndihmës.
Kthe JSON me këtë strukturë saktësisht:
{SCHEMA_AK_JAVOR}"""


SCHEMA_AK_TREMUJOR = """{
 "progresi": "progresi i objektivave të PEI: cilat objektiva janë arritur këtë tremujor (4-6 fjali)",
 "pika_forta": ["2-3 pika të forta"],
 "pika_dobeta": ["2-3 pika të dobëta / për t'u përmirësuar"],
 "rekomandimet": ["3-4 objektiva specifike për tremujorin pasardhës, ndryshime në frekuencë ose zgjatje nëse aplikohet"],
 "aktivitete_prinderit": ["3-4 aktivitete/materiale të sugjeruara për prindërit për të arritur objektivat"]
}"""


def prompt_ak_tremujor(emri_lendes, klasa, lloji, tremujori, objektivat, shenime):
    return f"""Harto RAPORTIN TREMUJOR të mësuesit ndihmës për një nxënës me aftësi të kufizuara, sipas modelit të manualit të ASCAP
(Progresi i objektivave të PEI – objektivat e arritura, pikat e forta dhe të dobëta; Rekomandimet për tremujorin pasardhës;
Aktivitete/materiale të sugjerueshme për prindërit).
Disiplina: {emri_lendes or 'e përgjithshme'}; {klasa}; Lloji i AK: {lloji or 'i papërcaktuar'}; Tremujori: {tremujori}.
Objektivat e PEI nga mësuesi: "{objektivat or '(propozo sipas llojit të AK dhe klasës)'}".
Shënimet e mësuesit për tremujorin: "{shenime or '(nuk ka; shkruaj në mënyrë të përgjithshme dhe të kujdesshme)'}".
Shkruaj në vetën e tretë njëjës për nxënësin, mënyra dëftore (p.sh. "Nxënësi/ja lexon...", jo "Të lexojë..."). Ji profesional dhe konkret.
Kthe JSON me këtë strukturë saktësisht:
{SCHEMA_AK_TREMUJOR}"""


def parse_json(text: str) -> dict:
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
    s, e = t.find("{"), t.rfind("}")
    return json.loads(t[s:e + 1])
