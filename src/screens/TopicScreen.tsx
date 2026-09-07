import { AppLayout } from '../components/AppLayout.tsx';
import { FORTUNE_TYPES } from '../data/fortuneTypes.ts';
import type { FortuneType } from '../types/fortune.ts';

type Props = {
  /** 세워둔 사주 — 무엇을 근거로 뽑는지 한 줄로 */
  sajuBadge: { icon: string; name: string } | null;
  onSelect: (t: FortuneType) => void;
  onBack: () => void;
};

// 뽑기 1단계 — 오늘 뭐가 궁금한가.
//
// 그동안 이 선택은 홈 맨 아래 '특정 주제로 볼래요?(보조)' 로 처박혀 있었고,
// 메인 버튼은 주제를 묻지도 않고 '오늘의 나' 로 고정돼 있었다.
// 쪽지는 (내가 누구인가 · 뭘 알고 싶은가 · 지금 기분) 셋으로 뽑히는데
// 가운데가 빠져 있었던 셈이라, 첫 단계로 끌어올린다.
export function TopicScreen({ sajuBadge, onSelect, onBack }: Props) {
  return (
    <AppLayout onBack={onBack} step={2} totalSteps={4}>
      <span className="eyebrow">쪽지 뽑기</span>
      <h2 className="h2">오늘, 뭐가 제일 궁금해요?</h2>
      <p className="lead">고른 주제로 오늘의 쪽지를 뽑아요.</p>

      {sajuBadge ? (
        <p className="topic-basis">
          <span aria-hidden>{sajuBadge.icon}</span> 내 사주 · {sajuBadge.name}
        </p>
      ) : null}

      <div className="topic-grid">
        {FORTUNE_TYPES.map((meta) => (
          <button
            key={meta.key}
            type="button"
            className="topic-btn"
            onClick={() => onSelect(meta.key)}
          >
            <span className="topic-btn__icon" aria-hidden>
              {meta.icon}
            </span>
            <span className="topic-btn__label">{meta.label}</span>
            <span className="topic-btn__desc">{meta.desc}</span>
          </button>
        ))}
      </div>
    </AppLayout>
  );
}
