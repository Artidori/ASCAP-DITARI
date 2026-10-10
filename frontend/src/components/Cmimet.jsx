import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CMIMET, PAKETAT_TE_GJITHA, paketaEmri } from "../lib/api";

const emri = (n) => (n >= 1 && n <= 5 ? `${n} lëndë` : paketaEmri(n));

export const Cmimet = () => {
  const [hap, setHap] = useState(false);
  return (
  <div className="pt-6 mt-2 border-t border-ink/10" data-testid="prices-section">
    <button type="button" onClick={() => setHap(!hap)} className="btn-ghost text-sm border border-ink/15 w-full justify-center" data-testid="show-prices-btn">
      {hap ? "Fshih çmimet" : "Trego çmimet"} <ChevronDown size={16} className={`transition-transform ${hap ? "rotate-180" : ""}`} />
    </button>
    {hap && <>
    <p className="lbl mt-4">Çmimet e paketave · për 9 muajt e vitit shkollor</p>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {PAKETAT_TE_GJITHA.map((n) => (
        <div key={n} className="rounded-lg border border-ink/10 bg-white px-3 py-2" data-testid={`price-${n}`}>
          <div className="text-[11px] text-muted leading-tight">{emri(n)}</div>
          <div className="font-display text-lg">{CMIMET[n].toLocaleString("sq-AL")} <span className="text-xs font-sans font-semibold">ALL</span></div>
        </div>
      ))}
    </div>
    </>}
  </div>
  );
};
