import { AppLayout } from '../components/AppLayout.tsx';
import { Icon } from '../components/Icon.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { CONCERNS, type ConcernKey } from '../data/concerns.ts';

type Props = {
  userName: string | null;
  onSelect: (key: ConcernKey) => void;
  onBack: () => void;
};

// 상담 1단계 — 요즘 뭐가 고민인지 하나만 고른다.
// 한 화면에 질문 하나. 고른 뒤에 상황을 한 번 더 좁히고, 그다음에 생년월일을 받는다.
export function ConcernScreen({ userName, onSelect, onBack }: Props) {
  return (
    <AppLayout onBack={onBack} step={1} totalSteps={3}>
      <div className="ask-hero">
        <span className="ask-hero__art" aria-hidden>
          <Mascot size={72} mood="calm" bare />
        </span>
        <div className="ask-hero__text">
          <h2 className="h2">{userName ? `${userName}님, 요즘 뭐가 고민이에요?` : '요즘 뭐가 고민이에요?'}</h2>
          <p className="lead">하나만 골라주면 그 얘기만 깊게 풀어드려요.</p>
        </div>
      </div>

      <div className="concern-list">
        {CONCERNS.map((c) => (
          <button key={c.key} type="button" className="concern-row" onClick={() => onSelect(c.key)}>
            <span className="concern-row__icon" aria-hidden>
              <Icon name={c.icon} size={22} />
            </span>
            <span className="concern-row__body">
              <span className="concern-row__label">{c.label}</span>
              <span className="concern-row__hook">{c.hook}</span>
            </span>
            <span className="concern-row__c" aria-hidden>
              ›
            </span>
          </button>
        ))}
      </div>

      <p className="ask-foot">고른 고민에 맞는 시기를 사주로 계산해요. 답은 이 기기에서만 만들어져요.</p>
    </AppLayout>
  );
}
