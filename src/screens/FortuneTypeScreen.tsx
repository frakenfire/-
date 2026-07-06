import { AppLayout } from '../components/AppLayout';
import { FortuneTypeButton } from '../components/FortuneTypeButton';
import { FORTUNE_TYPES } from '../data/fortuneTypes';
import { QUESTIONS } from '../data/copy';
import type { FortuneType } from '../types/fortune';

type Props = {
  selected: FortuneType | null;
  onSelect: (t: FortuneType) => void;
  onBack: () => void;
};

// PRD §5.2 — 운세 선택. 선택 즉시 다음 화면.
export function FortuneTypeScreen({ selected, onSelect, onBack }: Props) {
  return (
    <AppLayout onBack={onBack} step={1} totalSteps={3}>
      <span className="eyebrow">운세 고르기</span>
      <h2 className="h2">{QUESTIONS.fortuneType}</h2>
      <div className="menu-list">
        {FORTUNE_TYPES.map((meta) => (
          <FortuneTypeButton
            key={meta.key}
            meta={meta}
            selected={selected === meta.key}
            onClick={() => onSelect(meta.key)}
          />
        ))}
      </div>
    </AppLayout>
  );
}
