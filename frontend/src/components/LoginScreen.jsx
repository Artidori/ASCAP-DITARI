import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { API, LENDET, errMsg } from "../lib/api";
import { AdminModal } from "./AdminModal";

const Field = ({ label, children }) => (
  <label className="block">
    <span className="lbl">{label}</span>
    {children}
  </label>
);

export const LoginScreen = ({ onLogin }) => {
  const [mode, setMode] = useState("hyr");
  const [f, setF] = useState({ emri: "", mbiemri: "", email: localStorage.getItem("ascap_email") || "", kodi: localStorage.getItem("ascap_last_kodi") || "", n: 1, l: ["Gjuhë Shqipe", "Matematikë", "Anglisht"] });
  const [busy, setBusy] = useState(false);
  const [admin, setAdmin] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setL = (i) => (e) => { const l = [...f.l]; l[i] = e.target.value; setF({ ...f, l }); };

  const submit = async (e) => {
    e.preventDefault();
    const aktivizo = mode === "aktivizo";
    if (!f.email || !f.kodi || (aktivizo && (!f.emri || !f.mbiemri))) return toast.error("Plotësoni të gjitha fushat!");
    setBusy(true);
    try {
      const { data } = aktivizo
        ? await axios.post(`${API}/license/activate`, {
          kodi: f.kodi, emri: f.emri, mbiemri: f.mbiemri, email: f.email,
          numriLendeve: Number(f.n), lendet: f.l.slice(0, Number(f.n)),
        })
        : await axios.post(`${API}/license/login`, { kodi: f.kodi, email: f.email });
      localStorage.setItem("ascap_kodi", data.kodi);
      localStorage.setItem("ascap_last_kodi", data.kodi);
      localStorage.setItem("ascap_email", data.email);
      toast.success(aktivizo ? "Licenca u aktivizua me sukses!" : `Mirë se erdhët, ${data.emri}!`);
      onLogin(data);
    } catch (err) { toast.error(errMsg(err)); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden lg:flex flex-col justify-between p-14 bg-ink text-paper relative overflow-hidden">
        <div className="font-display text-2xl tracking-tight">ASCAP<span className="text-accent">.</span>Ditari</div>
        <div className="fade-up">
          <h1 className="font-display text-5xl xl:text-6xl leading-[1.05]">Fotografo faqen e librit.<br /><em className="text-accent not-italic">Ditari</em> shkruhet vetë.</h1>
          <p className="mt-8 max-w-md text-paper/70 text-base">AI lexon fotot e librit dhe plotëson çdo rubrikë të ditarit zyrtar sipas kurrikulës: situatën, rezultatet, fjalët kyçe, metodologjinë, vlerësimin dhe detyrat.</p>
        </div>
        <p className="text-xs text-paper/40">Gati për Word (.docx) — në 30 sekonda.</p>
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full border border-paper/10" />
        <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full border border-accent/30" />
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-lg space-y-5 fade-up" data-testid="login-form">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-display text-3xl">{mode === "hyr" ? "Hyni në llogari" : "Aktivizimi i Licencës"}</h2>
              <p className="text-sm text-muted mt-1">{mode === "hyr" ? "Fusni email-in dhe kodin e licencës suaj aktive." : "Fusni të dhënat dhe kodin e marrë nga administratori."}</p>
            </div>
            <button type="button" onClick={() => setAdmin(true)} className="btn-ghost text-xs" data-testid="open-admin-btn">Panel Admin</button>
          </div>
          <div className="grid grid-cols-2 p-1 rounded-full bg-ink/[0.06] text-sm font-semibold">
            {[["hyr", "Kam licencë aktive"], ["aktivizo", "Aktivizo licencë të re"]].map(([k, t]) => (
              <button type="button" key={k} onClick={() => setMode(k)} className={`py-2 rounded-full transition-colors ${mode === k ? "bg-white shadow-sm" : "text-muted"}`} data-testid={`mode-${k}-btn`}>{t}</button>
            ))}
          </div>
          {mode === "aktivizo" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emri"><input className="inp" value={f.emri} onChange={set("emri")} data-testid="reg-emri" /></Field>
            <Field label="Mbiemri"><input className="inp" value={f.mbiemri} onChange={set("mbiemri")} data-testid="reg-mbiemri" /></Field>
          </div>
          )}
          <Field label="Email"><input type="email" className="inp" value={f.email} onChange={set("email")} data-testid="reg-email" /></Field>
          {mode === "aktivizo" && <>
          <Field label="Paketa e licencës">
            <select className="inp" value={f.n} onChange={set("n")} data-testid="reg-paketa">
              {[1, 2, 3].map((n) => <option key={n} value={n}>Licencë për {n} lëndë</option>)}
            </select>
          </Field>
          <div className={`grid gap-3 grid-cols-${f.n}`} style={{ gridTemplateColumns: `repeat(${f.n},1fr)` }}>
            {Array.from({ length: Number(f.n) }).map((_, i) => (
              <Field key={i} label={`Lënda ${i + 1}`}>
                <select className="inp" value={f.l[i]} onChange={setL(i)} data-testid={`reg-lenda-${i + 1}`}>
                  {LENDET.map((l) => <option key={l}>{l}</option>)}
                </select>
              </Field>
            ))}
          </div>
          </>}
          <Field label="Kodi i licencës"><input className="inp font-mono uppercase" placeholder="ASCAP-XXXXXX-0000" value={f.kodi} onChange={set("kodi")} data-testid="reg-kodi" /></Field>
          <button disabled={busy} className="btn-primary w-full" data-testid="activate-btn">{busy ? "Duke verifikuar..." : mode === "hyr" ? "Hyr" : "Aktivizo dhe Hyr"}</button>
        </form>
      </main>
      {admin && <AdminModal onClose={() => setAdmin(false)} />}
    </div>
  );
};
