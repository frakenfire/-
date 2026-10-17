import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout.tsx';
import { Mascot } from '../components/Mascot.tsx';
import type { FortuneType } from '../types/fortune.ts';

// 몽글몽글 로딩 연출 — 쪽지 요정이 결과를 "준비하는" 과정을 보여준다.
// 단계별 멘트가 기대감(두근두근)을 만들고, 결과 타율을 높여 보이게 한다.

const COMMON_STEPS = [
  '오늘의 쪽지를 준비하고 있어요',
  '오늘의 운세를 살펴보고 있어요',
];

const TYPE_STEP: Record<FortuneType, string> = {
  tomorrow: '오늘 내 사주를 살펴보고 있어요',
  month: '이번 달의 흐름을 살펴보고 있어요',
  love: '연애운을 살펴보고 있어요',
  money: '금전운을 살펴보고 있어요',
  work: '직장운을 살펴보고 있어요',
  caution: '오늘 조심해야 할 순간을 살펴보고 있어요',
  luck: '행운의 색과 숫자를 살펴보고 있어요',
};

const LAST_STEP = '거의 다 됐어요';
const SPECIAL_STEP = '오늘은 조금 특별한 쪽지가 나왔어요';

type Props = {
  fortuneType: FortuneType;
  special?: boolean;
};

export function RevealScreen({ fortuneType, special }: Props) {
  const steps = [
    ...COMMON_STEPS,
    TYPE_STEP[fortuneType],
    special ? SPECIAL_STEP : LAST_STEP,
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setIdx((i) => {
        const next = Math.min(i + 1, steps.length - 1);
        if (next === steps.length - 1) window.clearInterval(t);
        return next;
      });
    }, 620);
    return () => window.clearInterval(t);
  }, [steps.length]);

  return (
    <AppLayout>
      <div className="center-hero">
        <div className="reveal-mascot">
          <Mascot size={132} mood="happy" />
        </div>
        <p className="reveal-msg" key={idx}>
          {steps[idx]}
        </p>
        <div className="reveal-dots" aria-hidden>
          {steps.map((_, i) => (
            <span
              key={i}
              className={i <= idx ? 'reveal-dot reveal-dot--on' : 'reveal-dot'}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
