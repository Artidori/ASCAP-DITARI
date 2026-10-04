import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X, Download, Save, Printer, Share2 } from "lucide-react";
import { buildDitarHtml, fitFontSize, headerText } from "../lib/ditarHtml";
import { licApi, errMsg, API } from "../lib/api";

export const DitarModal = ({ ditar, onClose }) => {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const html = ditar.html || buildDitarHtml(ditar);
  const name = `Ditari_${ditar.lenda}_${ditar.klasa}_${ditar.data}`.replace(/[^\wëçËÇ.-]+/g, "_");
  const header = headerText(ditar);
  const [ready, setReady] = useState(null);
  const timer = useRef();

  const prepare = () => {
    setReady(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const content = ref.current.innerHTML;
        const pt = fitFontSize(content);
        const [file, { data }] = await Promise.all([getFile(), licApi().post(`/ditar/${ditar.id}/share`, { html: content, fontSize: pt })]);
        setReady({ file, url: `${API}/share/${data.token}` });
      } catch { /* retried on next edit */ }
    }, 800);
  };
  useEffect(() => { prepare(); return () => clearTimeout(timer.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    try { await licApi().put(`/ditar/${ditar.id}`, { html: ref.current.innerHTML }); ditar.html = ref.current.innerHTML; toast.success("Ndryshimet u ruajtën"); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const getFile = async () => {
    const content = ref.current.innerHTML;
    const { data } = await licApi().post(`/ditar/${ditar.id}/docx`, { html: content, fontSize: fitFontSize(content) }, { responseType: "blob" });
    return new File([data], `${name}.docx`, { type: data.type });
  };
  const run = (fn) => async () => { setBusy(true); try { await fn(); } catch (e) { if (e.name !== "AbortError") toast.error(errMsg(e)); } setBusy(false); };

  const download = run(async () => {
    const f = await getFile();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f); a.download = f.name; a.click();
  });
  const share = async () => {
    if (!ready) return toast.info("Dokumenti po përgatitet, provoni pas pak sekondash.");
    const text = `Ditari: ${ditar.lenda}, ${ditar.klasa}, ${ditar.data}`;
    const withFile = navigator.canShare?.({ files: [ready.file] });
    try {
      if (withFile) await navigator.share({ files: [ready.file], title: ready.file.name });
      else if (navigator.share) await navigator.share({ title: text, text: `${text}\nShkarko Word: `, url: ready.url });
      else window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\nShkarko Word: ${ready.url}`)}`, "_blank");
    } catch (e) {
      if (e.name === "AbortError") return;
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\nShkarko Word: ${ready.url}`)}`, "_blank");
    }
  };
  const print = () => {
    const content = ref.current.innerHTML;
    const pt = fitFontSize(content);
    const w = window.open("", "_blank");
    w.document.write(`<html><head><meta charset="utf-8"><title>${name}</title><style>@page{size:A4;margin:15mm}body{font-family:'Times New Roman',serif;font-size:${pt}pt;margin:0}table{font-size:${pt}pt!important}</style></head><body><p style="font-weight:bold;margin:0 0 6px">${header}</p>${content}</body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" data-testid="ditar-modal">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col">
        <div className="flex flex-wrap gap-2 items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-display text-xl">Ditari i gjeneruar</h3>
            <p className="text-xs text-muted">Klikoni mbi tekst për ta ndryshuar. Word: A4, Times New Roman 12 (11 nëse nuk nxë).</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <button onClick={save} className="btn-ghost" data-testid="ditar-save-btn"><Save size={16} /> Ruaj</button>
            <button onClick={print} className="btn-ghost" data-testid="ditar-print-btn"><Printer size={16} /> Printo</button>
            <button onClick={share} className="btn-ghost" data-testid="ditar-share-btn"><Share2 size={16} /> {ready ? "Ndaj" : "Ndaj..."}</button>
            <button onClick={download} disabled={busy} className="btn-primary" data-testid="ditar-download-word-btn"><Download size={16} /> {busy ? "..." : "Shkarko Word"}</button>
            <button onClick={onClose} className="btn-ghost" data-testid="ditar-close-btn"><X size={18} /></button>
          </div>
        </div>
        <div className="overflow-auto p-3 sm:p-6">
          <p className="text-black font-bold mb-2" style={{ fontFamily: "'Times New Roman', serif" }} data-testid="ditar-header">{header}</p>
          <div ref={ref} contentEditable suppressContentEditableWarning className="outline-none text-black" data-testid="ditar-content" onInput={prepare} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
};
