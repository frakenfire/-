import type { TodayDecision } from '../types/fortune.ts';
import { Sentences } from './Sentences.tsx';

// 결과 맨 위 결론. 오늘 전체 종합, 오늘 할 것과 그 까닭, 오늘 하지 말아야
// 할 것과 그 까닭. 고민을 골라 뽑은 결과도, 그냥 뽑은 결과도 이 카드 하나로
// 그린다. 두 길이 다른 모양으로 결론을 말하면 어느 쪽이 결론인지 헷갈린다.
//
// 할 것과 하지 말 것은 색이 아니라 제목과 테두리로 가른다. 초록·빨강은 이
// 앱에서 안 쓴다.
export function TodayDecisionCard({ decision }: { decision: TodayDecision }) {
  // 결론 줄이 '해도 좋아요. 대신 ~가 나아요.' 두 문장이다. 둘 다 20px 굵게 두면 네 줄짜리
  // 덩어리가 된다. 첫 문장만 크게, 나머지는 아래 설명 앞에 붙인다.
  const [head, ...rest] = decision.overall.headline.split(/(?<=[.!?])\s+/);
  const summary = [...rest, decision.overall.summary].join(' ');
  return (
    <section className="tdc" aria-label="오늘 결론">
      <div className="sec-card tdc__overall">
        <p className="cat4__head">오늘 전체 종합</p>
        {decision.feeling ? <p className="tdc__feeling">{decision.feeling}</p> : null}
        {decision.basis ? <p className="tdc__basis">{decision.basis}</p> : null}
        <p className="tdc__headline">{head}</p>
        <Sentences className="tdc__summary" text={summary} />
      </div>
      <div className="sec-card tdc__act tdc__act--do">
        <p className="tdc__k">오늘 해보면 좋은 것</p>
        <Sentences className="tdc__action" text={decision.do.action} />
        <p className="tdc__why-k">왜?</p>
        <Sentences className="tdc__why" text={decision.do.why} />
      </div>
      <div className="sec-card tdc__act tdc__act--dont">
        <p className="tdc__k">오늘은 미뤄두면 좋은 것</p>
        <Sentences className="tdc__action" text={decision.dont.action} />
        <p className="tdc__why-k">왜?</p>
        <Sentences className="tdc__why" text={decision.dont.why} />
      </div>
      {decision.note ? <Sentences className="tdc__note" text={decision.note} /> : null}
    </section>
  );
}
