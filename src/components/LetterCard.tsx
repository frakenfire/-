import { Mascot } from './Mascot';
import type { LetterParts } from '../types/fortune';
import type { Rarity } from '../lib/rarity';

// 쪽지 요정의 손편지 — 눈에 꽂히는 위계로 렌더링.
// 인사(작게) → 콕 집은 한마디(크게, 형광 강조) → 본문 → 오늘의 부적(박스) → 맺음 → 서명.
export function LetterCard({
  letter,
  score,
  rarity,
}: {
  letter: LetterParts;
  score: number;
  rarity: Rarity;
}) {
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

      <p className="letter__intro">{letter.intro}</p>

      <p className="letter__highlight">
        <mark>{letter.highlight}</mark>
      </p>

      <p className="letter__body-text">{letter.body}</p>

      <div className="letter__keep">
        <span className="letter__keep-label">🍀 {letter.keepIntro}</span>
        <p className="letter__keep-lucky">오늘의 부적은 {letter.lucky}. 곁에 두면 든든해요.</p>
        <p className="letter__keep-caution">조심할 건 딱 하나. {letter.caution}</p>
      </div>

      {letter.special ? <p className="letter__special">{letter.special}</p> : null}

      <p className="letter__closing">{letter.closing}</p>
      <p className="letter__sign">{letter.sign}</p>
    </div>
  );
}
