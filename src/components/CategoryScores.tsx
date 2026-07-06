import type { CategoryScore } from '../lib/luck';
import { scoreColor } from '../lib/luck';

// 카테고리별 점수 바 (애정/재물/직장/건강). '오늘의 운세' 앱 공통 요소.
export function CategoryScores({ categories }: { categories: CategoryScore[] }) {
  return (
    <div className="cat-scores">
      {categories.map((c) => (
        <div className="cat-row" key={c.key}>
          <span className="cat-row__label">
            <span aria-hidden>{c.emoji}</span> {c.label}
          </span>
          <span className="cat-row__bar">
            <span
              className="cat-row__fill"
              style={{ width: `${c.score}%`, background: scoreColor(c.score) }}
            />
          </span>
          <span className="cat-row__score" style={{ color: scoreColor(c.score) }}>
            {c.score}
          </span>
        </div>
      ))}
    </div>
  );
}
