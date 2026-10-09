import { LLOJET_AK } from "../lib/api";

export const AkFields = ({ f, set }) => (
  <div className="grid sm:grid-cols-3 gap-4 p-5 rounded-xl bg-accent/[0.07] border border-accent/20" data-testid="ak-fields">
    <label><span className="lbl">Inicialet e nxënësit</span>
      <input className="inp" placeholder="P.sh. A. B." value={f.akInitials} onChange={set("akInitials")} data-testid="ak-child-initials-input" />
    </label>
    <label><span className="lbl">Lloji i AK</span>
      <select className="inp" value={f.llojiAk} onChange={set("llojiAk")} data-testid="ak-type-select">{LLOJET_AK.map((l) => <option key={l}>{l}</option>)}</select>
    </label>
    <label><span className="lbl">Kohëzgjatja</span>
      <input className="inp" value={f.koha} onChange={set("koha")} data-testid="ak-duration-input" />
    </label>
  </div>
);
