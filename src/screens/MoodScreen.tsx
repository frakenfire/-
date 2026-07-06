import { AppLayout } from '../components/AppLayout';
import { Mascot } from '../components/Mascot';
import { MOODS } from '../data/letterFragments';
import type { Mood } from '../types/fortune';

type Props = {
  fortuneLabel: string;
  onSelect: (m: Mood) => void;
  onBack: () => void;
};

// 지금 내 기분 한 번 입력 → 요정이 그 마음을 읽고 편지를 쓴다.
export function MoodScreen({ fortuneLabel, onSelect, onBack }: Props) {
  return (
    <AppLayout onBack={onBack} step={1} totalSteps={2}>
      {fortuneLabel ? <span className="eyebrow">{fortuneLabel}</span> : null}
      <h2 className="h2">
        쪽지를 쓰기 전에,
        <br />
        지금 기분은 어때요?
      </h2>
      <p className="lead">요정이 당신 마음에 맞춰 편지를 써줄 거예요.</p>

      <div className="mood-grid">
        {MOODS.map((m) => (
          <button
            key={m.key}
            type="button"
            className="mood-btn"
            onClick={() => onSelect(m.key)}
          >
            <span className="mood-btn__emoji" aria-hidden>
              {m.emoji}
            </span>
            <span className="mood-btn__label">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="mood-mascot" aria-hidden>
        <Mascot size={88} mood="happy" />
      </div>
    </AppLayout>
  );
}
