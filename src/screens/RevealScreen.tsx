import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout.tsx';
import { Mascot } from '../components/Mascot.tsx';
import type { FortuneType } from '../types/fortune.ts';

// 몽글몽글 로딩 연출 — 쪽지 요정이 결과를 "준비하는" 과정을 보여준다.
// 단계별 멘트가 기대감(두근두근)을 만들고, 결과 타율을 높여 보이게 한다.

const COMMON_STEPS = [
  '쪽지를 섞고 있어요',
  '오늘 풀이를 정리하는 중',
];

const TYPE_STEP: Record<FortuneType, string> = {
  tomorrow: '오늘의 나를 살펴보는 중',
  month: '이번 달 풀이를 정리하는 중',
  love: '사랑운을 살펴보는 중',
  money: '돈운을 살펴보는 중',
  work: '일운을 살펴보는 중',
  caution: '조심할 점을 살펴보는 중',
  luck: '행운 정보를 정리하는 중',
};

const LAST_STEP = '거의 다 됐어요';
const SPECIAL_STEP = '오늘은 자주 안 나오는 쪽지예요';

type Props = {
  fortuneType: FortuneType;
  special?: boolean;
  /** 이 로딩 뒤에 광고가 나오는지. 단계 문구는 광고 전에 끝까지 못 가므로 따로 처음부터 띄운다 */
  adNext?: boolean;
};

export function RevealScreen({ fortuneType, special, adNext = false }: Props) {
  // 광고가 이어지면 마지막 멘트가 그 예고다. App 은 이 멘트가 보일 만큼 기다렸다 광고를 띄운다.
  const steps = [
    ...COMMON_STEPS,
    TYPE_STEP[fortuneType],
    adNext ? '광고 뒤에 결과가 열려요' : special ? SPECIAL_STEP : LAST_STEP,
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
        {adNext ? <p className="note-fan__hint">결과 전에 짧은 광고가 하나 나와요</p> : null}
      </div>
    </AppLayout>
  );
}
