import type { Element } from '../lib/saju.ts';

// 오늘 잘 맞는 MBTI - 재미 칸.
//
// 사주에는 MBTI 가 없다. 그래서 지어내지 않고 오늘 나한테 힘이 되는 요소(나무, 불, 흙, 쇠, 물)의
// 성질과 닮은 성향을 고른다. 내 MBTI 를 묻지 않는다 - 오늘 하루 어울리기 편한 성향이 무엇인지만 말한다.
// 요소마다 두 벌을 두고 날짜로 고른다. 같은 요소가 이어지는 날에도 같은 답만 나오지 않게.

type Pick = { type: string; nick: string; hint: string };

type ElementMbti = {
  /** 이 요소가 어떤 성질인지 */
  what: string;
  /** 잘 맞는 성향을 꾸미는 말. '~ 사람인' 앞에 온다 */
  goodTrait: string;
  /** 속도가 다를 수 있는 성향을 꾸미는 말 */
  cautionTrait: string;
  good: [Pick, Pick];
  caution: [Pick, Pick];
};

const MBTI_TODAY: Record<Element, ElementMbti> = {
  wood: {
    what: '나무는 새로 시작하고 뻗어 나가는 요소예요.',
    goodTrait: '새로운 생각을 반기는',
    cautionTrait: '정해진 순서를 중요하게 여기는',
    good: [
      { type: 'ENFP', nick: '아이디어 부자', hint: '내 생각을 신나게 같이 키워 줘요.' },
      { type: 'ENTP', nick: '새로운 시도 담당', hint: '해보자는 말에 먼저 손을 들어 줘요.' },
    ],
    caution: [
      { type: 'ISTJ', nick: '원칙 지킴이', hint: '갑자기 바꾸자는 말에는 시간이 필요해요.' },
      { type: 'ESTJ', nick: '계획 관리자', hint: '즉흥적인 제안보다 정리된 계획을 좋아해요.' },
    ],
  },
  fire: {
    what: '불은 마음을 드러내고 표현하는 요소예요.',
    goodTrait: '반응이 크고 따뜻한',
    cautionTrait: '감정 표현이 조용한',
    good: [
      { type: 'ESFP', nick: '분위기 메이커', hint: '같이 있으면 웃을 일이 많아져요.' },
      { type: 'ENFJ', nick: '다정한 리더', hint: '내 얘기를 반갑게 받아 줘요.' },
    ],
    caution: [
      { type: 'INTP', nick: '조용한 분석가', hint: '반응이 작아도 서운해하지 않는 게 좋아요.' },
      { type: 'ISTP', nick: '말보다 행동파', hint: '긴 이야기보다 짧은 말이 편한 사람이에요.' },
    ],
  },
  earth: {
    what: '흙은 믿음을 쌓고 자리를 지키는 요소예요.',
    goodTrait: '꾸준하고 약속을 잘 지키는',
    cautionTrait: '계획을 자주 바꾸는',
    good: [
      { type: 'ISFJ', nick: '든든한 수호자', hint: '말한 건 꼭 챙겨 주는 사람이에요.' },
      { type: 'ESFJ', nick: '다정한 살림꾼', hint: '내가 말하기 전에 먼저 챙겨 줘요.' },
    ],
    caution: [
      { type: 'ENTP', nick: '즉흥 토론가', hint: '정해 둔 약속도 다시 바꾸자고 할 수 있어요.' },
      { type: 'ENFP', nick: '자유로운 영혼', hint: '오늘은 약속 시간을 한 번 더 확인하면 좋아요.' },
    ],
  },
  metal: {
    what: '쇠는 정리하고 결단하는 요소예요.',
    goodTrait: '핵심을 짚고 깔끔하게 정하는',
    cautionTrait: '그때그때 마음 가는 대로 움직이는',
    good: [
      { type: 'ESTJ', nick: '결단의 아이콘', hint: '미루던 결정을 깔끔하게 도와줘요.' },
      { type: 'INTJ', nick: '전략가', hint: '군더더기 없이 핵심만 짚어 줘요.' },
    ],
    caution: [
      { type: 'ESFP', nick: '자유로운 즉흥파', hint: '갑자기 놀자는 말에 계획이 흔들릴 수 있어요.' },
      { type: 'INFP', nick: '감성 몽상가', hint: '딱 잘라 말하면 상처받기 쉬운 사람이에요.' },
    ],
  },
  water: {
    what: '물은 깊이 생각하고 살피는 요소예요.',
    goodTrait: '이야기를 깊게 나누는',
    cautionTrait: '속도가 빠르고 바로 정하는',
    good: [
      { type: 'INFJ', nick: '속 깊은 상담가', hint: '마음속 얘기를 편하게 꺼낼 수 있어요.' },
      { type: 'INTP', nick: '생각 정리왕', hint: '엉킨 생각을 같이 차근히 풀어 줘요.' },
    ],
    caution: [
      { type: 'ESTP', nick: '행동 대장', hint: '생각이 정리되기 전에 답을 재촉할 수 있어요.' },
      { type: 'ESFJ', nick: '바쁜 분위기 담당', hint: '혼자 있고 싶은 날엔 약속을 줄여도 괜찮아요.' },
    ],
  },
};

export type MbtiToday = { good: Pick; caution: Pick; why: string };

/** 오늘 힘이 되는 요소와 날짜로 고른다. 같은 날에는 몇 번을 봐도 같다 */
export function mbtiTodayOf(el: Element, elKo: string, dayIndex: number): MbtiToday {
  const m = MBTI_TODAY[el];
  const good = m.good[dayIndex % 2];
  const caution = m.caution[(dayIndex + 1) % 2];
  return {
    good,
    caution,
    why: `오늘 나한테 힘이 되는 요소는 ${elKo}예요. ${m.what} 그래서 오늘은 ${m.goodTrait} ${good.type}와 잘 맞고, ${m.cautionTrait} ${caution.type}와는 속도가 조금 다를 수 있어요. 내 MBTI와 상관없이 오늘 하루 어울리기 편한 성향을 골라 봤어요.`,
  };
}
