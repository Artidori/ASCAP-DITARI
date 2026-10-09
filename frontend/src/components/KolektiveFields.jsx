import { KLASAT, KURRIKULAT } from "../lib/api";

const KL_KOLEKTIVE = KLASAT.slice(1, 10);
export const blankKlasat = (lenda) => [{ klasa: "Klasa 1", lenda, lendaKurrikules: "", tema: "" }, { klasa: "Klasa 3", lenda, lendaKurrikules: "", tema: "" }];

export const KolektiveFields = ({ klasat, setKlasat, lendet }) => {
  const upd = (i, k) => (e) => setKlasat(klasat.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)));
  const setN = (n) => setKlasat(n === 3 ? [...klasat, { klasa: "Klasa 5", lenda: lendet[0], lendaKurrikules: "", tema: "" }] : klasat.slice(0, 2));
  return (
    <div className="space-y-4" data-testid="kolektive-fields">
      <div className="flex items-center gap-3">
        <span className="lbl !mb-0">Numri i klasave</span>
        {[2, 3].map((n) => (
          <button key={n} type="button" onClick={() => setN(n)} className={`btn-ghost text-xs border ${klasat.length === n ? "border-accent text-accent-dark" : "border-ink/15"}`} data-testid={`kolektive-n-${n}`}>{n} klasa</button>
        ))}
      </div>
      {klasat.map((k, i) => (
        <div key={i} className="grid sm:grid-cols-[140px_1fr_1fr] gap-3 p-4 rounded-xl border border-ink/10 bg-white/60" data-testid={`kolektive-klasa-${i}`}>
          <label><span className="lbl">Klasa {i + 1}</span>
            <select className="inp" value={k.klasa} onChange={upd(i, "klasa")} data-testid={`kolektive-klasa-select-${i}`}>{KL_KOLEKTIVE.map((x) => <option key={x}>{x}</option>)}</select>
          </label>
          <label><span className="lbl">Lënda</span>
            <select className="inp" value={k.lenda} onChange={upd(i, "lenda")} data-testid={`kolektive-lenda-select-${i}`}>{lendet.map((x) => <option key={x}>{x}</option>)}</select>
          </label>
          <label><span className="lbl">Tema mësimore</span>
            <input className="inp" value={k.tema} onChange={upd(i, "tema")} placeholder="Opsionale nëse ka foto" data-testid={`kolektive-tema-input-${i}`} />
          </label>
          {KURRIKULAT.includes(k.lenda) && (
            <label className="sm:col-span-3"><span className="lbl">Emri i lëndës ({k.lenda.toLowerCase()})</span>
              <input className="inp" value={k.lendaKurrikules} onChange={upd(i, "lendaKurrikules")} placeholder="P.sh. Edukim mjedisor" data-testid={`kolektive-kurrikula-input-${i}`} />
            </label>
          )}
        </div>
      ))}
    </div>
  );
};
