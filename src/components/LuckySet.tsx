import type { LuckSet } from '../lib/luck';

// 행운 세트: 색·숫자·방향·시간·아이템. 매 뽑기마다 조합이 달라져 공유 욕구를 자극.
export function LuckySetGrid({ luck }: { luck: LuckSet }) {
  return (
    <div className="lucky-grid">
      <div className="lucky-cell">
        <span className="lucky-cell__k">행운의 색</span>
        <span className="lucky-cell__v">
          <span className="lucky-dot" style={{ background: luck.color.hex }} aria-hidden />
          {luck.color.name}
        </span>
      </div>
      <div className="lucky-cell">
        <span className="lucky-cell__k">행운의 숫자</span>
        <span className="lucky-cell__v">{luck.number}</span>
      </div>
      <div className="lucky-cell">
        <span className="lucky-cell__k">행운의 방향</span>
        <span className="lucky-cell__v">{luck.direction}</span>
      </div>
      <div className="lucky-cell">
        <span className="lucky-cell__k">행운의 시간</span>
        <span className="lucky-cell__v">{luck.time}</span>
      </div>
      <div className="lucky-cell lucky-cell--wide">
        <span className="lucky-cell__k">행운의 아이템</span>
        <span className="lucky-cell__v">{luck.item}</span>
      </div>
      {luck.numbers6?.length ? (
        <div className="lucky-cell lucky-cell--wide">
          <span className="lucky-cell__k">행운 번호 · 재미로만 봐요</span>
          <span className="lucky-cell__v lucky-cell__v--balls">
            {luck.numbers6.map((n) => (
              <span className="lucky-ball" key={n}>
                {n}
              </span>
            ))}
          </span>
        </div>
      ) : null}
    </div>
  );
}
