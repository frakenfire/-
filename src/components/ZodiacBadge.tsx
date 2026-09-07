import type { Zodiac } from '../data/zodiac.ts';

// 띠 배지 — 동물 이모지 대신 띠 이름 한 글자를 담은 원.
//
// 왜 그림이 아니라 글자인가: 쥐·소·범·토끼를 24 그리드 선 아이콘으로 그리면
// 열두 개가 다 비슷한 동물 실루엣이 되어 작은 크기에서 서로 구별이 안 된다.
// 글자는 열두 개가 확실히 갈린다. 토스가 사람·계좌를 표시할 때 쓰는 원형
// 배지와 같은 꼴이라 앱 안에서도 낯설지 않다.
//
// 이모지는 데이터에 그대로 남겨둔다 — 카카오톡으로 나가는 공유 문구에서는
// 그림이 오히려 맞다. 화면과 공유는 다른 매체다.

/** '원숭이띠' → '원' · '개띠' → '개' */
export function zodiacChar(label: string): string {
  return label.replace(/띠$/, '').charAt(0);
}

type Props = { zodiac: Zodiac; size?: number; tone?: 'plain' | 'brand' };

export function ZodiacBadge({ zodiac, size = 36, tone = 'plain' }: Props) {
  return (
    <span
      className={tone === 'brand' ? 'zbadge zbadge--brand' : 'zbadge'}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden
    >
      {zodiacChar(zodiac.label)}
    </span>
  );
}
