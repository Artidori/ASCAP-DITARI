import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle, RefreshCw } from "lucide-react";
import { adminApi, errMsg } from "../lib/api";

const mesazhi = (link) => `Përshëndetje! Provoni falas ASCAP Ditari – ditari mësimor gati për 30 sekonda me AI, nga fotoja e librit. Keni 5 ditarë falas: ${link}`;

export const TrialLink = ({ pw }) => {
  const [info, setInfo] = useState(null);
  const link = info && `${window.location.origin}/?prove=${info.token}`;
  useEffect(() => { adminApi(pw).get("/admin/trial-link").then((r) => setInfo(r.data)).catch((e) => toast.error(errMsg(e))); }, [pw]);
  const regen = async () => {
    if (!window.confirm("Linku i vjetër nuk do të punojë më. Vazhdo?")) return;
    const { data } = await adminApi(pw).post("/admin/trial-link/regenerate");
    setInfo({ ...info, token: data.token });
    toast.success("U krijua link i ri");
  };
  if (!info) return null;
  return (
    <div className="p-5 rounded-xl border border-accent/20 bg-accent/[0.07] mb-6" data-testid="trial-link-box">
      <p className="lbl">Linku i provës · 5 ditarë falas · 1 pajisje · {info.prova} mësues e kanë provuar</p>
      <div className="flex flex-wrap gap-2 items-center">
        <input readOnly className="inp flex-1 min-w-[260px] font-mono text-xs" value={link} data-testid="trial-link-input" />
        <button onClick={() => { navigator.clipboard.writeText(link); toast.success("Linku u kopjua"); }} className="btn-ghost text-xs border border-ink/15" data-testid="trial-link-copy-btn"><Copy size={14} /> Kopjo</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(mesazhi(link))}`} target="_blank" rel="noreferrer" className="btn-primary !bg-[#25D366] text-xs" data-testid="trial-link-whatsapp-btn"><MessageCircle size={14} /> Dërgo në WhatsApp</a>
        <button onClick={regen} className="btn-ghost text-xs" title="Çaktivizo linkun e vjetër" data-testid="trial-link-regen-btn"><RefreshCw size={14} /> Link i ri</button>
      </div>
    </div>
  );
};
