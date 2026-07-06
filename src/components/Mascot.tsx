// 쪽지 요정 마스코트 — 손으로 그린 인라인 SVG(무의존·CSP 안전·벡터).
// 포스텔러식 '귀엽고 말랑한' 브랜드 캐릭터. 쪽지 자체가 얼굴을 가진 컨셉.

type Props = {
  size?: number;
  /** happy: 웃는 눈, wink: 윙크 */
  mood?: 'happy' | 'wink';
};

export function Mascot({ size = 120, mood = 'happy' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      role="img"
      aria-label="내일쪽지 마스코트"
    >
      {/* 배경 원 */}
      <circle cx="100" cy="100" r="92" fill="var(--brand-soft)" />

      {/* 그림자 */}
      <ellipse cx="100" cy="168" rx="52" ry="9" fill="#114e48" opacity="0.08" />

      {/* 쪽지 몸통 */}
      <g>
        <path
          d="M46 66 h84 a10 10 0 0 1 10 10 v70 a10 10 0 0 1 -10 10 H56 a10 10 0 0 1 -10 -10 V66 Z"
          fill="#ffffff"
          stroke="#114e48"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        {/* 접힌 우상단 코너 */}
        <path
          d="M130 66 l18 0 a10 10 0 0 1 8 4 Z"
          fill="#ffffff"
        />
        <path
          d="M130 66 v14 a4 4 0 0 0 4 4 h18"
          fill="#e7f1ef"
          stroke="#114e48"
          strokeWidth="5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 텍스트 줄 */}
        <rect x="60" y="80" width="44" height="6" rx="3" fill="#d1d6db" />
        <rect x="60" y="94" width="30" height="6" rx="3" fill="#e5e8eb" />
      </g>

      {/* 얼굴 */}
      {/* 볼 */}
      <circle cx="76" cy="126" r="7" fill="#ffc7b0" opacity="0.9" />
      <circle cx="124" cy="126" r="7" fill="#ffc7b0" opacity="0.9" />
      {/* 눈 */}
      {mood === 'wink' ? (
        <path
          d="M70 118 q6 -6 12 0"
          stroke="#114e48"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <circle cx="76" cy="118" r="5" fill="#114e48" />
      )}
      <circle cx="124" cy="118" r="5" fill="#114e48" />
      {/* 입 */}
      <path
        d="M88 130 q12 12 24 0"
        stroke="#114e48"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* 반짝임 */}
      <path
        d="M158 58 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z"
        fill="var(--orange)"
      />
      <path
        d="M40 44 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z"
        fill="#f7c948"
      />
      <circle cx="164" cy="120" r="4" fill="#f7c948" />
    </svg>
  );
}
