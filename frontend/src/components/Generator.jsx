import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Archive, LogOut, RotateCcw } from "lucide-react";
import { KLASAT, licApi, errMsg } from "../lib/api";
import { PhotoUpload } from "./PhotoUpload";
import { DitarModal } from "./DitarModal";
import { ArchiveModal } from "./ArchiveModal";
import { InstallButton } from "./InstallButton";

const today = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`; };
const blank = (lenda) => ({ lenda, klasa: "Klasa 5", data: today(), tema: "", vitiShkollor: "2026-2027", kaAk: false, akInitials: "" });

export const Generator = ({ user, onLogout }) => {
  const [f, setF] = useState(blank(user.lendet[0]));
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [ditar, setDitar] = useState(null);
  const [archive, setArchive] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const generate = async () => {
    if (!images.length && !f.tema.trim()) return toast.error("Ngarkoni foto të librit ose shkruani temën.");
    setBusy(true);
    try {
      const { data } = await licApi().post("/ditar/generate", { ...f, images });
      setDitar(data);
      setF((x) => ({ ...x, tema: data.tema }));
      toast.success("Ditari u gjenerua!");
    } catch (e) { toast.error(errMsg(e)); }
    setBusy(false);
  };
  const reset = () => { setF(blank(f.lenda)); setImages([]); };

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap gap-3 justify-between items-center px-6 sm:px-12 py-5 border-b border-ink/10">
        <div className="font-display text-xl">ASCAP<span className="text-accent">.</span>Ditari</div>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline text-muted mr-2" data-testid="user-info"><b className="text-ink">{user.emri} {user.mbiemri}</b> · {user.lendet.join(" & ")} · <span data-testid="license-expiry">Skadon: {user.skadon?.slice(0, 10).split("-").reverse().join(".")}</span></span>
          <InstallButton />
          <button onClick={() => setArchive(true)} className="btn-ghost" data-testid="open-archive-btn"><Archive size={16} /> Arkiva</button>
          <button onClick={onLogout} className="btn-ghost" data-testid="logout-btn"><LogOut size={16} /> Dil</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-12 py-12 grid lg:grid-cols-[1fr_300px] gap-12">
        <section className="space-y-8 fade-up">
          <div className="flex justify-between items-end">
            <div>
              <p className="lbl !mb-2">Ora e re mësimore</p>
              <h1 className="font-display text-4xl sm:text-5xl">Konfiguro ditarin</h1>
            </div>
            <button onClick={reset} className="btn-ghost text-xs" data-testid="reset-form-btn"><RotateCcw size={14} /> Ditar i ri</button>
          </div>

          <PhotoUpload images={images} setImages={setImages} />

          <div className="grid sm:grid-cols-2 gap-4">
            <label><span className="lbl">Lënda</span>
              <select className="inp" value={f.lenda} onChange={set("lenda")} data-testid="lenda-select">{user.lendet.map((l) => <option key={l}>{l}</option>)}</select>
            </label>
            <label><span className="lbl">Klasa</span>
              <select className="inp" value={f.klasa} onChange={set("klasa")} data-testid="klasa-select">{KLASAT.map((k) => <option key={k}>{k}</option>)}</select>
            </label>
            <label><span className="lbl">Data</span><input className="inp" value={f.data} onChange={set("data")} data-testid="data-input" /></label>
            <label><span className="lbl">Viti shkollor</span><input className="inp" value={f.vitiShkollor} onChange={set("vitiShkollor")} data-testid="viti-input" /></label>
          </div>
          <label className="block"><span className="lbl">Tema mësimore <span className="normal-case font-normal">(opsionale nëse ngarkoni foto)</span></span>
            <input className="inp" placeholder="AI e nxjerr nga fotot nëse e lini bosh" value={f.tema} onChange={set("tema")} data-testid="tema-input" />
          </label>

          <div className="p-5 rounded-xl bg-accent/[0.07] border border-accent/20">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={f.kaAk} onChange={set("kaAk")} className="w-4 h-4 accent-[var(--accent)]" data-testid="ak-checkbox" />
              <span className="text-sm font-semibold">Ka nxënës me Aftësi të Kufizuara (AK) në klasë?</span>
            </label>
            {f.kaAk && <input className="inp mt-3" placeholder="Inicialet, p.sh. A. B." value={f.akInitials} onChange={set("akInitials")} data-testid="ak-initials-input" />}
          </div>

          <button onClick={generate} disabled={busy} className="btn-primary w-full !py-4 text-base" data-testid="generate-btn">
            {busy ? <><span className="spinner" /> AI po lexon librin dhe harton ditarin...</> : <><Sparkles size={18} /> Gjenero Ditarin</>}
          </button>
        </section>

        <aside className="space-y-6 text-sm text-muted lg:pt-24">
          <h4 className="font-display text-lg text-ink">Si funksionon</h4>
          {["Fotografoni faqet e mësimit nga libri (deri në 6).", "Zgjidhni lëndën, klasën dhe datën.", "AI shpërndan përmbajtjen e librit në çdo rubrikë të ditarit.", "Rregulloni tekstin nëse doni dhe shkarkoni në Word."].map((t, i) => (
            <div key={i} className="flex gap-3"><span className="font-display text-accent text-xl leading-none">{i + 1}</span><p>{t}</p></div>
          ))}
        </aside>
      </main>

      {ditar && <DitarModal ditar={ditar} onClose={() => setDitar(null)} />}
      {archive && <ArchiveModal onClose={() => setArchive(false)} onOpen={(d) => { setArchive(false); setDitar(d); }} />}
    </div>
  );
};
