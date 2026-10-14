import { toast } from "sonner";

const GRUPET = [["I", "Grupi I"], ["II", "Grupi II"], ["III", "Grupi III"], ["perzier", "Grup i përzier"]];

export const ParaFields = ({ f, setF, lendet }) => {
  const toggle = (l) => {
    const on = f.lendetPara.includes(l);
    if (!on && f.lendetPara.length >= 6) return toast.error("Mund të zgjidhni deri në 6 lëndë.");
    setF({ ...f, lendetPara: on ? f.lendetPara.filter((x) => x !== l) : [...f.lendetPara, l] });
  };
  const chip = (on) => `btn-ghost text-xs border ${on ? "border-accent bg-accent/5 text-accent-dark" : "border-ink/15"}`;
  return (
    <div className="space-y-4" data-testid="para-fields">
      <div>
        <span className="lbl">Grupi</span>
        <div className="flex flex-wrap gap-2">
          {GRUPET.map(([k, t]) => <button key={k} type="button" onClick={() => setF({ ...f, grupi: k })} className={chip(f.grupi === k)} data-testid={`para-grupi-${k}`}>{t}</button>)}
        </div>
      </div>
      <div>
        <span className="lbl">Lëndët e ditës ({f.lendetPara.length}/6)</span>
        <div className="flex flex-wrap gap-2">
          {lendet.map((l) => <button key={l} type="button" onClick={() => toggle(l)} className={chip(f.lendetPara.includes(l))} data-testid={`para-lenda-${l}`}>{l}: {f.lendetPara.includes(l) ? "PO" : "JO"}</button>)}
        </div>
      </div>
    </div>
  );
};
