import type { RankedCat } from '../lib/detail';
import { scoreColor, scoreTextColor } from '../lib/luck';

const RANK_BADGE = ['', '2위', '3위', '4위'];

// 항목별 운세 — 4장을 동일한 무게로 나열하지 않는다.
// 1위는 큼직한 인사이트 카드로 압도적으로 강조하고, 나머지는
// 1위 대비 상대적인 막대로 비교되는 콤팩트한 순위 리스트로 붙인다.
export function CategoryScores({ ranked }: { ranked: RankedCat[] }) {
  const [top, ...rest] = ranked;
  const topScore = top.score;

  return (
    <div className="cat-wrap">
      <div className="cat-top">
        <div className="cat-top__head">
          <span className="cat-top__crown" aria-hidden>👑</span>
          <span className="cat-top__label">오늘의 원픽</span>
        </div>
        <div className="cat-top__row">
          <span className="cat-top__emoji" aria-hidden>{top.emoji}</span>
          <span className="cat-top__name">{top.label}</span>
          <span className="cat-top__score num" style={{ color: scoreTextColor(top.score) }}>
            {top.score}
          </span>
        </div>
        <span className="cat-top__bar">
          <span className="cat-top__fill" style={{ width: `${top.score}%`, background: scoreColor(top.score) }} />
        </span>
        <p className="cat-top__interp">{top.interp}</p>
      </div>

      <div className="cat-rank">
        {rest.map((c, i) => (
          <div className="cat-rank__row" key={c.key}>
            <span className="cat-rank__no">{RANK_BADGE[i + 1]}</span>
            <span className="cat-rank__emoji" aria-hidden>{c.emoji}</span>
            <span className="cat-rank__name">{c.label}</span>
            <span className="cat-rank__bar">
              <span
                className="cat-rank__fill"
                style={{ width: `${(c.score / topScore) * 100}%`, background: scoreColor(c.score) }}
              />
            </span>
            <span className="cat-rank__score num" style={{ color: scoreTextColor(c.score) }}>
              {c.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
