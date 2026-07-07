import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Mascot } from '../components/Mascot';
import type { FortuneType } from '../types/fortune';

// 몽글몽글 로딩 연출 — 쪽지 요정이 결과를 "준비하는" 과정을 보여준다.
// 단계별 멘트가 기대감(두근두근)을 만들고, 결과 타율을 높여 보이게 한다.

const COMMON_STEPS = [
  '쪽지들을 살살 뒤섞고 있어요…',
  '오늘의 기운을 조심조심 읽는 중…',
];

const TYPE_STEP: Record<FortuneType, string> = {
  tomorrow: '내일의 나를 미리 엿보는 중… 👀',
  month: '이번 달을 쭉 펼쳐보는 중… 🗓️',
  love: '마음의 온도를 재보는 중… 💗',
  money: '돈의 기운을 살짝 따라가는 중… 🪙',
  work: '일 기운을 차곡차곡 살피는 중… 💼',
  caution: '조심할 순간을 콕 짚어보는 중… 🔍',
  luck: '행운 세트를 예쁘게 담는 중… 🎁',
};

const LAST_STEP = '거의 다 됐어요, 두근두근…!';
const SPECIAL_STEP = '어라…? 이건 좀 특별한 쪽지인데…?! ✨';

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
      setIdx((i) => Math.min(i + 1, steps.length - 1));
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
