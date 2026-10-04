import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { licApi, errMsg } from "../lib/api";

export const ArchiveModal = ({ onClose, onOpen }) => {
  const [list, setList] = useState(null);
  const load = () => licApi().get("/ditar").then((r) => setList(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);
  const del = async (id) => {
    if (!window.confirm("Fshi këtë ditar nga arkiva?")) return;
    await licApi().delete(`/ditar/${id}`); load();
  };
  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4" data-testid="archive-modal">
      <div className="bg-paper rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-auto p-8 relative">
        <button onClick={onClose} className="absolute top-5 right-5 btn-ghost" data-testid="archive-close-btn"><X size={18} /></button>
        <h3 className="font-display text-2xl mb-6">Arkiva e ditarëve</h3>
        {list === null && <p className="text-muted text-sm">Duke ngarkuar...</p>}
        {list?.length === 0 && <p className="text-muted text-sm py-6 text-center">Nuk ka ditarë të ruajtur.</p>}
        <div className="space-y-2">
          {list?.map((d) => (
            <div key={d.id} className="flex justify-between items-center gap-3 p-4 rounded-xl bg-white border border-ink/10" data-testid={`archive-item-${d.id}`}>
              <div className="text-sm min-w-0">
                <b>{d.lenda}</b> — <span className="truncate">{d.tema}</span>
                <div className="text-xs text-muted">{d.klasa} · {d.data}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onOpen(d)} className="btn-primary text-xs !py-1.5" data-testid={`archive-open-${d.id}`}>Shiko</button>
                <button onClick={() => del(d.id)} className="btn-ghost text-xs text-rose-700" data-testid={`archive-delete-${d.id}`}>Fshi</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
