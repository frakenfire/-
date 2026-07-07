// 쪽지 요정 마스코트 — 손으로 그린 인라인 SVG(무의존·CSP 안전·벡터).
// 점수대에 따라 표정이 바뀐다: grin(대길·길) / happy(순조·무난) / calm(차분).

type Mood = 'grin' | 'happy' | 'calm';

type Props = {
  size?: number;
  mood?: Mood;
  /** 지정 시 점수로 표정 자동 결정 (mood보다 우선) */
  score?: number;
};

export function moodFromScore(score: number): Mood {
  if (score >= 88) return 'grin';
  if (score >= 73) return 'happy';
  return 'calm';
}

export function Mascot({ size = 120, mood = 'happy', score }: Props) {
  const m: Mood = typeof score === 'number' ? moodFromScore(score) : mood;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      role="img"
      aria-label="내일쪽지 마스코트"
    >
      <circle cx="100" cy="100" r="92" fill="var(--brand-soft)" />
      <ellipse cx="100" cy="168" rx="52" ry="9" fill="#333d4b" opacity="0.08" />

      {/* 쪽지 몸통 */}
      <path
        d="M46 66 h84 a10 10 0 0 1 10 10 v70 a10 10 0 0 1 -10 10 H56 a10 10 0 0 1 -10 -10 V66 Z"
        fill="#ffffff"
        stroke="#333d4b"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M130 66 v14 a4 4 0 0 0 4 4 h18"
        fill="#e8f3ff"
        stroke="#333d4b"
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="60" y="80" width="44" height="6" rx="3" fill="#d1d6db" />
      <rect x="60" y="94" width="30" height="6" rx="3" fill="#e5e8eb" />

      {/* 볼 */}
      <circle cx="76" cy="126" r="7" fill="#ffc7b0" opacity="0.9" />
      <circle cx="124" cy="126" r="7" fill="#ffc7b0" opacity="0.9" />

      {/* 눈 */}
      {m === 'grin' ? (
        <>
          {/* 반달 웃는 눈 */}
          <path d="M69 120 q7 -9 14 0" stroke="#333d4b" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M117 120 q7 -9 14 0" stroke="#333d4b" strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      ) : m === 'calm' ? (
        <>
          {/* 잔잔한 점 눈 */}
          <circle cx="76" cy="119" r="4.5" fill="#333d4b" />
          <circle cx="124" cy="119" r="4.5" fill="#333d4b" />
        </>
      ) : (
        <>
          {/* 또렷한 눈 + 하이라이트 */}
          <circle cx="76" cy="118" r="5.5" fill="#333d4b" />
          <circle cx="124" cy="118" r="5.5" fill="#333d4b" />
          <circle cx="78" cy="116" r="1.6" fill="#fff" />
          <circle cx="126" cy="116" r="1.6" fill="#fff" />
        </>
      )}

      {/* 입 */}
      {m === 'grin' ? (
        <path
          d="M85 130 q15 20 30 0 a15 8 0 0 1 -30 0 Z"
          fill="#333d4b"
        />
      ) : m === 'calm' ? (
        <path d="M92 132 q8 6 16 0" stroke="#333d4b" strokeWidth="5" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M88 130 q12 12 24 0" stroke="#333d4b" strokeWidth="5" strokeLinecap="round" fill="none" />
      )}

      {/* 반짝임 (grin일 때 더 화려하게) */}
      <path d="M158 58 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" fill="var(--orange)" />
      <path d="M40 44 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z" fill="#f7c948" />
      {m === 'grin' ? (
        <>
          <circle cx="164" cy="120" r="4" fill="#f7c948" />
          <path d="M34 118 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="var(--orange)" />
        </>
      ) : (
        <circle cx="164" cy="120" r="4" fill="#f7c948" />
      )}
    </svg>
  );
}
