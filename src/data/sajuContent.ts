// 사주 해석 문장 — 규칙(tenGods.ts)이 낸 값을 사람 말로 옮긴다.
// 계산과 문장을 갈라둔 이유: 문장을 고쳐도 계산 결과가 흔들리지 않게 하기 위해서다.
import type { GodGroup } from '../lib/tenGods.ts';
import type { Element } from '../lib/saju.ts';

/** 십신 무리 — 이 사람이 세상에 쓰는 주된 힘 */
export const GROUP_READING: Record<GodGroup, { title: string; icon: string; body: string; keyword: string }> = {
  self: {
    title: '내 힘으로 서는 쪽',
    icon: '🧍',
    keyword: '주체성',
    body: '남이 정해준 길보다 내가 정한 길이 편해요. 혼자서도 굴러가는 사람이라 기대는 걸 잘 못 하고, 그래서 가끔 혼자 다 짊어져요.',
  },
  output: {
    title: '만들어서 내보내는 쪽',
    icon: '🎨',
    keyword: '표현',
    body: '머릿속에 있는 걸 밖으로 꺼내야 풀리는 사람이에요. 말이든 글이든 결과물이든, 내놓을 통로가 있을 때 제일 살아나요.',
  },
  wealth: {
    title: '손에 쥐는 쪽',
    icon: '🎯',
    keyword: '성과',
    body: '눈에 보이는 결과로 확인해야 마음이 놓여요. 현실감각이 좋아서 헛돈·헛시간을 잘 안 쓰고, 기회를 알아보는 눈이 빨라요.',
  },
  authority: {
    title: '책임을 지는 쪽',
    icon: '🛡️',
    keyword: '책임',
    body: '맡은 건 끝까지 하는 사람이에요. 규칙과 약속을 무겁게 여겨서 신뢰를 얻지만, 그만큼 자기를 몰아붙이기도 해요.',
  },
  support: {
    title: '채워서 쓰는 쪽',
    icon: '📚',
    keyword: '배움',
    body: '바로 뛰어들기보다 알아보고 움직여요. 배우고 정리하는 힘이 좋아서, 시간이 지날수록 깊어지는 유형이에요.',
  },
};

/** 신강 / 신약 — 좋고 나쁨이 아니라 '어떻게 써야 하는가'로 쓴다 */
export const STRENGTH_READING: Record<'strong' | 'weak', { label: string; short: string; body: string; tip: string }> = {
  strong: {
    label: '신강',
    short: '에너지가 안에 꽉 찬 편',
    body: '스스로 밀고 나가는 힘이 넉넉해요. 남에게 기대지 않아도 굴러가는 대신, 힘이 안에서 돌기만 하면 답답해져요.',
    tip: '쌓인 걸 밖으로 쓰는 통로를 만드는 게 좋아요 — 만들거나, 나누거나, 움직이거나.',
  },
  weak: {
    label: '신약',
    short: '주변에서 받아 쓰는 편',
    body: '혼자보다 함께일 때 힘이 나요. 좋은 사람·좋은 자리에 있으면 실력이 몇 배로 나오는 유형이에요.',
    tip: '혼자 다 하려 하지 말고, 기댈 곳과 배울 곳을 곁에 두는 게 훨씬 빨라요.',
  },
};

/** 오행이 하나도 없을 때 — 결핍이 아니라 '빌려 쓰면 되는 것'으로 말한다 */
export const MISSING_READING: Record<Element, string> = {
  wood: '뻗어나가는 기운이 옅어요. 새로 시작하는 자리에 일부러 몸을 두면 채워져요.',
  fire: '드러내는 기운이 옅어요. 표현할 자리를 만들면 훨씬 편해져요.',
  earth: '붙잡아두는 기운이 옅어요. 루틴이나 기록처럼 고정된 틀이 도움이 돼요.',
  metal: '끊어내는 기운이 옅어요. 정리하고 결정하는 연습이 힘이 돼요.',
  water: '흘려보내는 기운이 옅어요. 쉬고 비우는 시간을 일부러 잡아야 해요.',
};

/** 용신 — 이 사람에게 부족하거나 넘치는 걸 되돌리는 오행 */
export const USEFUL_READING: Record<Element, { what: string; how: string }> = {
  wood: { what: '자라는 기운', how: '식물 곁, 아침 산책, 새로 배우는 것' },
  fire: { what: '밝히는 기운', how: '햇빛, 사람 많은 자리, 붉은 계열' },
  earth: { what: '받쳐주는 기운', how: '규칙적인 식사, 흙·도자기, 노란 계열' },
  metal: { what: '정리하는 기운', how: '비우기, 금속 소품, 흰 계열' },
  water: { what: '풀어주는 기운', how: '물가, 충분한 잠, 검·파랑 계열' },
};

export const ELEMENT_SHORT: Record<Element, string> = {
  wood: '목', fire: '화', earth: '토', metal: '금', water: '수',
};
