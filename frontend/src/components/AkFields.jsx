import { LLOJET_AK } from "../lib/api";

const DOK = [["ditor", "Plan ditor"], ["javor", "Raport javor"]];

export const AkFields = ({ f, set, setF }) => (
  <div className="grid sm:grid-cols-3 gap-4 p-5 rounded-xl bg-accent/[0.07] border border-accent/20" data-testid="ak-fields">
    <div className="sm:col-span-3 flex gap-2">
      {DOK.map(([k, t]) => (
        <button key={k} type="button" onClick={() => setF({ ...f, dokumenti: k })} className={`btn-ghost text-xs border ${f.dokumenti === k ? "border-accent bg-white text-accent-dark" : "border-ink/15"}`} data-testid={`ak-doc-${k}-btn`}>{t}</button>
      ))}
    </div>
    <label><span className="lbl">Inicialet e nxënësit</span>
      <input className="inp" placeholder="P.sh. A. B." value={f.akInitials} onChange={set("akInitials")} data-testid="ak-child-initials-input" />
    </label>
    <label><span className="lbl">Lloji i AK</span>
      <select className="inp" value={f.llojiAk} onChange={set("llojiAk")} data-testid="ak-type-select">{LLOJET_AK.map((l) => <option key={l}>{l}</option>)}</select>
    </label>
    {f.dokumenti === "javor" ? (
      <>
        <label><span className="lbl">Periudha</span>
          <input className="inp" placeholder="P.sh. 13.10 – 17.10.2026" value={f.periudha} onChange={set("periudha")} data-testid="ak-period-input" />
        </label>
        <label className="sm:col-span-3"><span className="lbl">Shënimet e javës (opsionale)</span>
          <textarea className="inp min-h-[80px]" placeholder="Çfarë ndodhi gjatë javës: vështirësi, përparime, reagime..." value={f.shenime} onChange={set("shenime")} data-testid="ak-notes-input" />
        </label>
      </>
    ) : (
      <label><span className="lbl">Kohëzgjatja</span>
        <input className="inp" value={f.koha} onChange={set("koha")} data-testid="ak-duration-input" />
      </label>
    )}
  </div>
);
