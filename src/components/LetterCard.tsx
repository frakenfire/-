import { Mascot } from './Mascot';
import type { Rarity } from '../lib/rarity';

// 쪽지 요정의 손편지 — 여러 문단, 종이 질감의 카드. 결과의 감성 중심.
// 등급(가챠)에 따라 편지지 색·뱃지가 바뀌어 '전설 쪽지' 캡처 욕구를 자극한다.
export function LetterCard({
  letter,
  score,
  rarity,
}: {
  letter: string[];
  score: number;
  rarity: Rarity;
}) {
  const body = letter.slice(0, -1);
  const sign = letter[letter.length - 1];

  return (
    <div className={`letter letter--${rarity.tier} fade-in`}>
      <div className="letter__head">
        <Mascot size={44} score={score} />
        <span className="letter__from">쪽지 요정이 당신에게</span>
        <span className={`rarity-badge rarity-badge--${rarity.tier}`}>
          {rarity.emoji} {rarity.label}
          {rarity.pct ? <b> · {rarity.pct}</b> : null}
        </span>
      </div>
      <div className="letter__body">
        {body.map((p, i) => (
          <p className="letter__p" key={i}>
            {p}
          </p>
        ))}
      </div>
      <p className="letter__sign">{sign}</p>
    </div>
  );
}
