import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { API, adminApi, errMsg, paketaEmri } from "../lib/api";
import { X, Copy } from "lucide-react";

const PAJISJE = [[1, "1 pajisje"], [2, "2 pajisje"], [0, "Pa limit pajisjesh"]];
const fmt = (iso) => iso ? iso.slice(0, 10).split("-").reverse().join(".") : "-";
const expired = (m) => m.skadon && new Date(m.skadon) < new Date();

export const AdminModal = ({ onClose }) => {
  const [pw, setPw] = useState("");
  const [ok, setOk] = useState(false);
  const [list, setList] = useState([]);
  const [pak, setPak] = useState(1);
  const [last, setLast] = useState("");
  const [vitet, setVitet] = useState([]);
  const [viti, setViti] = useState("");
  const [maxP, setMaxP] = useState(1);
  useEffect(() => { axios.get(`${API}/admin/school-years`).then((r) => { setVitet(r.data); setViti(r.data[0]); }); }, []);

  const load = async (p = pw) => setList((await adminApi(p).get("/admin/licenses")).data);
  const login = async (e) => {
    e.preventDefault();
    try { await axios.post(`${API}/admin/login`, { password: pw }); setOk(true); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };
  const act = (fn) => async (...a) => { try { await fn(...a); await load(); } catch (err) { toast.error(errMsg(err)); } };
  const create = act(async () => { const { data } = await adminApi(pw).post("/admin/licenses", { numriLendeve: Number(pak), vitiShkollor: viti, maxPajisje: Number(maxP) }); setLast(data.kodi); });
  const toggle = act((k) => adminApi(pw).patch(`/admin/licenses/${k}/toggle`));
  const renew = act((k) => adminApi(pw).patch(`/admin/licenses/${k}/renew`));
  const setMax = act((k, n) => adminApi(pw).patch(`/admin/licenses/${k}/max-devices`, { maxPajisje: Number(n) }));
  const devReset = act((k) => adminApi(pw).patch(`/admin/licenses/${k}/device-reset`));
  const reset = act((k) => adminApi(pw).patch(`/admin/licenses/${k}/reset`));
  const del = act(async (k) => { if (window.confirm("Fshi këtë licencë?")) await adminApi(pw).delete(`/admin/licenses/${k}`); });
  const copy = (k) => { navigator.clipboard.writeText(k); toast.success("Kodi u kopjua"); };

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4" data-testid="admin-modal">
      <div className="bg-paper rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-auto p-8 relative">
        <button onClick={onClose} className="absolute top-5 right-5 btn-ghost" data-testid="admin-close-btn"><X size={18} /></button>
        <h3 className="font-display text-2xl mb-6">Paneli i Administratorit</h3>
        {!ok ? (
          <form onSubmit={login} className="flex gap-3 max-w-sm">
            <input type="password" autoFocus className="inp" placeholder="Fjalëkalimi" value={pw} onChange={(e) => setPw(e.target.value)} data-testid="admin-password-input" />
            <button className="btn-primary" data-testid="admin-login-btn">Hyr</button>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 items-end p-5 rounded-xl bg-ink/[0.04] mb-6">
              <label><span className="lbl">Paketa</span>
                <select className="inp" value={pak} onChange={(e) => setPak(e.target.value)} data-testid="admin-paketa-select">
                  {[1, 2, 3, 0].map((n) => <option key={n} value={n}>{paketaEmri(n)}</option>)}
                </select>
              </label>
              <label><span className="lbl">Viti shkollor</span>
                <select className="inp" value={viti} onChange={(e) => setViti(e.target.value)} data-testid="admin-viti-select">
                  {vitet.map((v) => <option key={v} value={v}>{v} (1 Shtator – 15 Qershor)</option>)}
                </select>
              </label>
              <label><span className="lbl">Pajisje</span>
                <select className="inp" value={maxP} onChange={(e) => setMaxP(e.target.value)} data-testid="admin-max-devices-select">
                  {PAJISJE.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
              </label>
              <button onClick={create} className="btn-primary" data-testid="admin-create-license-btn">Gjenero Kod Licence</button>
              {last && <button onClick={() => copy(last)} className="font-mono font-bold text-accent-dark flex items-center gap-2" data-testid="admin-last-code">{last} <Copy size={14} /></button>}
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm" data-testid="admin-license-table">
              <thead><tr className="text-left text-xs uppercase text-muted border-b"><th className="p-2">Mësuesi</th><th>Paketa</th><th className="px-3">Skadon</th><th className="px-3">Ditarë</th><th>Kodi</th><th>Statusi</th><th></th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted">Nuk ka kode.</td></tr>}
                {list.map((m) => (
                  <tr key={m.kodi} className="border-b" data-testid={`license-row-${m.kodi}`}>
                    <td className="p-2">{m.aktivizuar ? <><b>{m.emri} {m.mbiemri}</b><br /><span className="text-xs text-muted">{m.email}{m.numriLendeve !== 0 && ` · ${m.lendet.join(", ")}`}</span></> : <span className="text-muted">E pa përdorur</span>}
                      <div className="mt-1 text-[11px] text-muted">
                        <select className="border rounded px-1 py-0.5 bg-white" value={m.maxPajisje} onChange={(e) => setMax(m.kodi, e.target.value)} data-testid={`max-devices-${m.kodi}`}>
                          {PAJISJE.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                        </select>
                        <div>{m.pajisjet.length ? m.pajisjet.join(", ") : "Pa pajisje ende"}</div>
                      </div></td>
                    <td className="whitespace-nowrap">{paketaEmri(m.numriLendeve)}</td>
                    <td className="text-xs px-3 whitespace-nowrap">{m.vitiShkollor}<br /><span className={expired(m) ? "text-rose-700 font-bold" : "text-muted"}>{fmt(m.skadon)}{expired(m) && " · skaduar"}</span></td>
                    <td className="px-3 font-bold" data-testid={`ditare-count-${m.kodi}`}>{m.ditare}</td>
                    <td><button onClick={() => copy(m.kodi)} className="font-mono text-accent-dark font-semibold whitespace-nowrap">{m.kodi}</button></td>
                    <td><span className={`pill ${m.aktiv ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{m.aktiv ? "Aktive" : "E caktivizuar"}</span></td>
                    <td className="text-right">
                      <button onClick={() => toggle(m.kodi)} className="btn-ghost text-xs" data-testid={`toggle-${m.kodi}`}>{m.aktiv ? "Caktivizo" : "Riaktivizo"}</button>
                      <button onClick={() => renew(m.kodi)} className="btn-ghost text-xs" data-testid={`renew-${m.kodi}`}>Rinovo</button>
                      {m.pajisjet.length > 0 && <button onClick={() => devReset(m.kodi)} className="btn-ghost text-xs" title="Fshi pajisjet e lidhura që mësuesi të hyjë nga pajisje të reja" data-testid={`device-reset-${m.kodi}`}>Pajisje e re</button>}
                      {m.aktivizuar && <button onClick={() => reset(m.kodi)} className="btn-ghost text-xs" title="Lejo aktivizim në pajisje/email tjetër">Rivendos</button>}
                      <button onClick={() => del(m.kodi)} className="btn-ghost text-xs text-rose-700" data-testid={`delete-${m.kodi}`}>Fshi</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </>
        )}
      </div>
    </div>
  );
};
