import { AppLayout } from '../components/AppLayout.tsx';
import { Icon } from '../components/Icon.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { findConcern, type ConcernKey } from '../data/concerns.ts';

type Props = {
  concernKey: ConcernKey;
  onSelect: (optionKey: string) => void;
  onBack: () => void;
};

// 상담 2단계 — 같은 고민도 상황이 다르면 답이 달라진다.
// 네 개 중 하나만 고르면 끝. 자유 입력은 받지 않는다. 적은 건 아무 데도 안 보내야 하니까.
export function ConcernAskScreen({ concernKey, onSelect, onBack }: Props) {
  const concern = findConcern(concernKey);
  return (
    <AppLayout onBack={onBack} step={2} totalSteps={3}>
      <div className="ask-hero">
        <span className="ask-hero__art" aria-hidden>
          <Mascot size={72} mood="grin" bare />
        </span>
        <div className="ask-hero__text">
          <span className="ask-hero__tag">
            <Icon name={concern.icon} size={14} /> {concern.label}
          </span>
          <h2 className="h2">{concern.question}</h2>
          <p className="lead">{concern.questionLead}</p>
        </div>
      </div>

      <div className="concern-list">
        {concern.options.map((o) => (
          <button key={o.key} type="button" className="opt-row" onClick={() => onSelect(o.key)}>
            <span className="opt-row__label">{o.label}</span>
            <span className="opt-row__c" aria-hidden>
              ›
            </span>
          </button>
        ))}
      </div>

      <p className="ask-foot">{concern.basis}</p>
    </AppLayout>
  );
}
