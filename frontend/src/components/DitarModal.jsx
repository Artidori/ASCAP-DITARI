import { useRef } from "react";
import { toast } from "sonner";
import { X, Download, Save, Printer } from "lucide-react";
import { buildDitarHtml, downloadWord } from "../lib/ditarHtml";
import { licApi, errMsg } from "../lib/api";

export const DitarModal = ({ ditar, onClose }) => {
  const ref = useRef();
  const html = ditar.html || buildDitarHtml(ditar);
  const name = `Ditari_${ditar.lenda}_${ditar.klasa}_${ditar.data}`.replace(/[^\wëçËÇ.-]+/g, "_");

  const save = async () => {
    try { await licApi().put(`/ditar/${ditar.id}`, { html: ref.current.innerHTML }); ditar.html = ref.current.innerHTML; toast.success("Ndryshimet u ruajtën"); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const print = () => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><meta charset="utf-8"><title>${name}</title></head><body>${ref.current.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4" data-testid="ditar-modal">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col">
        <div className="flex flex-wrap gap-2 items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-display text-xl">Ditari i gjeneruar</h3>
            <p className="text-xs text-muted">Klikoni mbi tekst për ta ndryshuar para shkarkimit.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-ghost" data-testid="ditar-save-btn"><Save size={16} /> Ruaj</button>
            <button onClick={print} className="btn-ghost" data-testid="ditar-print-btn"><Printer size={16} /> Printo</button>
            <button onClick={() => downloadWord(ref.current.innerHTML, name)} className="btn-primary" data-testid="ditar-download-word-btn"><Download size={16} /> Shkarko Word</button>
            <button onClick={onClose} className="btn-ghost" data-testid="ditar-close-btn"><X size={18} /></button>
          </div>
        </div>
        <div className="overflow-auto p-6">
          <div ref={ref} contentEditable suppressContentEditableWarning className="outline-none text-black" data-testid="ditar-content" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
};
