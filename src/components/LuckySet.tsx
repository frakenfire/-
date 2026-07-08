import type { LuckSet } from '../lib/luck';

// 행운 세트 — 숫자 나열 대신 '오늘의 행운 미션' 하나로 묶어 실제로 하게 만든다.
// 색/시간/방향/음식은 코디·동선처럼 쓸 수 있는 것만, 숫자는 활용법과 함께.
export function LuckySetGrid({
  luck,
  mission,
  numberUse,
}: {
  luck: LuckSet;
  mission: string;
  numberUse: string;
}) {
  return (
    <div className="lucky">
      <div className="lucky__mission">
        <span className="lucky__mission-k">🎯 오늘의 행운 미션</span>
        <p className="lucky__mission-v">{mission}</p>
      </div>

      <div className="lucky-grid">
        <div className="lucky-cell">
          <span className="lucky-cell__k">행운 색</span>
          <span className="lucky-cell__v">
            <span className="lucky-dot" style={{ background: luck.color.hex }} aria-hidden />
            {luck.color.name}
          </span>
        </div>
        <div className="lucky-cell">
          <span className="lucky-cell__k">좋은 시간</span>
          <span className="lucky-cell__v">{luck.time}</span>
        </div>
        <div className="lucky-cell">
          <span className="lucky-cell__k">행운 방향</span>
          <span className="lucky-cell__v">{luck.direction}</span>
        </div>
        <div className="lucky-cell">
          <span className="lucky-cell__k">행운 음식</span>
          <span className="lucky-cell__v">
            {luck.food.emoji} {luck.food.name}
          </span>
        </div>
      </div>

      <div className="lucky__num">
        <span className="lucky__num-badge num">{luck.number}</span>
        <span className="lucky__num-text">{numberUse}</span>
      </div>
    </div>
  );
}
