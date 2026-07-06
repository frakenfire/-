import { Mascot } from './Mascot';

// 쪽지 요정의 손편지 — 여러 문단, 종이 질감의 카드. 결과의 감성 중심.
export function LetterCard({ letter, score }: { letter: string[]; score: number }) {
  // 마지막 요소는 서명
  const body = letter.slice(0, -1);
  const sign = letter[letter.length - 1];

  return (
    <div className="letter fade-in">
      <div className="letter__head">
        <Mascot size={44} score={score} />
        <span className="letter__from">쪽지 요정이 당신에게</span>
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
