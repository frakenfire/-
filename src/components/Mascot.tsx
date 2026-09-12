// 쪽지 요정 마스코트 — 손으로 그린 인라인 SVG(무의존·CSP 안전·벡터).
//
// 한 캐릭터, 여러 표정. 화면마다 다른 그림을 그리면 '여러 앱' 처럼 보인다.
// 같은 쪽지가 표정과 색만 바꿔 가며 앱 전체를 돌아다니게 한다.
//   grin    대길·길, 기분 좋은 날
//   happy   기본
//   calm    잔잔한 날, 그냥 그래요
//   tired   좀 지쳤어요 (처진 눈, 납작한 입)
//   anxious 불안해요 (걱정 눈썹, 흔들리는 입)
//   lonely  외로워요 (눈물 한 방울)
// accent 를 주면 접힌 귀퉁이와 볼 색이 바뀐다 — 사주 열 가지가 저마다의 색을 갖는다.

export type MascotMood = 'grin' | 'happy' | 'calm' | 'tired' | 'anxious' | 'lonely';

type Props = {
  size?: number;
  mood?: MascotMood;
  /** 지정 시 점수로 표정 자동 결정 (mood보다 우선) */
  score?: number;
  /** 배경 원과 반짝임 없이 캐릭터만. 색 카드 위처럼 이미 바탕이 있는 자리용 */
  bare?: boolean;
  /** 접힌 귀퉁이 색. 사주 기운 등 '이 캐릭터의 색' 이 있을 때 */
  accent?: string;
};

export function moodFromScore(score: number): MascotMood {
  if (score >= 88) return 'grin';
  if (score >= 73) return 'happy';
  return 'calm';
}

const INK = '#333d4b';

export function Mascot({ size = 120, mood = 'happy', score, bare = false, accent }: Props) {
  const m: MascotMood = typeof score === 'number' ? moodFromScore(score) : mood;
  const fold = accent ?? '#e8f3ff';

  return (
    <svg
      width={size}
      height={size}
      viewBox={bare ? "40 56 120 114" : "0 0 200 200"}
      fill="none"
      role="img"
      aria-label="오늘쪽지 마스코트"
    >
      {bare ? null : <circle cx="100" cy="100" r="92" fill="var(--brand-soft)" />}
      <ellipse cx="100" cy="168" rx="52" ry="9" fill={INK} opacity="0.08" />

      {/* 쪽지 몸통 */}
      <path
        d="M46 66 h84 a10 10 0 0 1 10 10 v70 a10 10 0 0 1 -10 10 H56 a10 10 0 0 1 -10 -10 V66 Z"
        fill="#ffffff"
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M130 66 v14 a4 4 0 0 0 4 4 h18"
        fill={fold}
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="60" y="80" width="44" height="6" rx="3" fill="#d1d6db" />
      <rect x="60" y="94" width="30" height="6" rx="3" fill="#e5e8eb" />

      {/* 볼 — 지치거나 외로운 날엔 옅게 */}
      <circle cx="76" cy="126" r="7" fill="#ffc7b0" opacity={m === 'tired' || m === 'lonely' ? 0.45 : 0.9} />
      <circle cx="124" cy="126" r="7" fill="#ffc7b0" opacity={m === 'tired' || m === 'lonely' ? 0.45 : 0.9} />

      {/* 눈 */}
      {m === 'grin' ? (
        <>
          <path d="M69 120 q7 -9 14 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M117 120 q7 -9 14 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      ) : m === 'calm' ? (
        <>
          <circle cx="76" cy="119" r="4.5" fill={INK} />
          <circle cx="124" cy="119" r="4.5" fill={INK} />
        </>
      ) : m === 'tired' ? (
        <>
          {/* 처진 눈: 위쪽이 눌린 반달 */}
          <path d="M69 118 q7 6 14 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M117 118 q7 6 14 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      ) : m === 'anxious' ? (
        <>
          {/* 걱정 눈썹 + 또렷한 눈 */}
          <path d="M66 106 l16 5" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <path d="M134 106 l-16 5" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <circle cx="76" cy="120" r="5" fill={INK} />
          <circle cx="124" cy="120" r="5" fill={INK} />
        </>
      ) : m === 'lonely' ? (
        <>
          <circle cx="76" cy="119" r="5" fill={INK} />
          <circle cx="124" cy="119" r="5" fill={INK} />
          {/* 눈물 한 방울 */}
          <path d="M129 128 q6 8 0 12 q-6 -4 0 -12 Z" fill="var(--brand)" />
        </>
      ) : (
        <>
          <circle cx="76" cy="118" r="5.5" fill={INK} />
          <circle cx="124" cy="118" r="5.5" fill={INK} />
          <circle cx="78" cy="116" r="1.6" fill="#fff" />
          <circle cx="126" cy="116" r="1.6" fill="#fff" />
        </>
      )}

      {/* 입 */}
      {m === 'grin' ? (
        <path d="M85 130 q15 20 30 0 a15 8 0 0 1 -30 0 Z" fill={INK} />
      ) : m === 'calm' ? (
        <path d="M92 132 q8 6 16 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
      ) : m === 'tired' ? (
        <path d="M90 134 h20" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      ) : m === 'anxious' ? (
        <path d="M88 136 q6 -6 12 0 q6 6 12 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
      ) : m === 'lonely' ? (
        <path d="M92 136 q8 -6 16 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M88 130 q12 12 24 0" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
      )}

      {/* 반짝임은 'AI 기능' 표시로 굳어진 모양이라 바탕이 있는 자리(bare)에서는 뺀다. */}
      {bare ? null : (
        <>
          <path d="M158 58 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" fill="var(--orange)" />
          <path d="M40 44 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z" fill="#f7c948" />
        </>
      )}
      {!bare && m === 'grin' ? (
        <>
          <circle cx="164" cy="120" r="4" fill="#f7c948" />
          <path d="M34 118 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="var(--orange)" />
        </>
      ) : bare ? null : (
        <circle cx="164" cy="120" r="4" fill="#f7c948" />
      )}
    </svg>
  );
}
