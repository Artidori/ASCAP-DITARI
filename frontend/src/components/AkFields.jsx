import { LLOJET_AK } from "../lib/api";

const DOK = [["ditor", "Plan ditor 1"], ["ditor2", "Plan ditor 2"], ["javor", "Përmbledhje javore"], ["mujor", "Përmbledhje mujore"]];

export const AkFields = ({ f, set, setF }) => (
  <div className="grid sm:grid-cols-3 gap-4 p-5 rounded-xl bg-accent/[0.07] border border-accent/20" data-testid="ak-fields">
    <div className="sm:col-span-3 flex flex-wrap gap-2">
      {DOK.map(([k, t]) => (
        <button key={k} type="button" onClick={() => setF({ ...f, dokumenti: k, periudha: "" })} className={`btn-ghost text-xs border ${f.dokumenti === k ? "border-accent bg-white text-accent-dark" : "border-ink/15"}`} data-testid={`ak-doc-${k}-btn`}>{t}</button>
      ))}
    </div>
    <label><span className="lbl">Inicialet e nxënësit</span>
      <input className="inp" placeholder="P.sh. A. B." value={f.akInitials} onChange={set("akInitials")} data-testid="ak-child-initials-input" />
    </label>
    <label><span className="lbl">{["javor", "mujor"].includes(f.dokumenti) ? "Diagnoza" : "Lloji i AK"}</span>
      <select className="inp" value={f.llojiAk} onChange={set("llojiAk")} data-testid="ak-type-select">{LLOJET_AK.map((l) => <option key={l}>{l}</option>)}</select>
    </label>
    {["javor", "mujor"].includes(f.dokumenti) ? (
      <>
        <label><span className="lbl">Shkolla</span>
          <input className="inp" placeholder="Emri i shkollës" value={f.shkolla} onChange={set("shkolla")} data-testid="ak-school-input" />
        </label>
        <label><span className="lbl">{f.dokumenti === "mujor" ? "Muaji / Data" : "Java / Data"}</span>
          <input className="inp" placeholder="P.sh. 13.10 – 17.10.2026" value={f.periudha} onChange={set("periudha")} data-testid="ak-period-input" />
        </label>
        <label className="sm:col-span-3"><span className="lbl">Shënimet e periudhës (opsionale)</span>
          <textarea className="inp min-h-[80px]" placeholder="Si i realizoi objektivat (me ndihmë / i pavarur), vështirësi, problematika..." value={f.shenime} onChange={set("shenime")} data-testid="ak-notes-input" />
        </label>
      </>
    ) : (
      <label><span className="lbl">Kohëzgjatja</span>
        <input className="inp" value={f.koha} onChange={set("koha")} data-testid="ak-duration-input" />
      </label>
    )}
  </div>
);
