import type { RankedCat } from '../lib/detail';
import { scoreColor, scoreTextColor } from '../lib/luck';

// 항목별 운세 — 그냥 숫자 나열이 아니라 '순위 + 해석'으로.
// 1위는 오늘의 원픽(밀어야 할 운), 꼴찌는 살살 갈 운으로 의미를 준다.
export function CategoryScores({ ranked }: { ranked: RankedCat[] }) {
  return (
    <div className="cat-list">
      {ranked.map((c, i) => (
        <div className={`cat-item${i === 0 ? ' cat-item--top' : ''}`} key={c.key}>
          <div className="cat-item__head">
            <span className="cat-item__name">
              <span aria-hidden>{c.emoji}</span> {c.label}
            </span>
            {i === 0 ? <span className="cat-item__pick">👑 오늘의 원픽</span> : null}
            <span className="cat-item__tag" style={{ color: scoreTextColor(c.score) }}>
              {c.bandTag}
            </span>
            <span className="cat-item__score num" style={{ color: scoreTextColor(c.score) }}>
              {c.score}
            </span>
          </div>
          <span className="cat-item__bar">
            <span
              className="cat-item__fill"
              style={{ width: `${c.score}%`, background: scoreColor(c.score) }}
            />
          </span>
          <p className="cat-item__interp">{c.interp}</p>
        </div>
      ))}
    </div>
  );
}
