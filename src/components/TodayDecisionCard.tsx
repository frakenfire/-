import type { TodayDecision } from '../types/fortune.ts';
import { Sentences } from './Sentences.tsx';

type Props = {
  decision: TodayDecision;
  /** 맨 위 점수가 왜 그 점수인지 두 문장. 오늘 풀이 안에 짧게 */
  scoreWhy?: { head: string; text: string };
};

// 결과 맨 위 세 카드. 오늘 풀이, 오늘 해보면 좋은 것, 오늘은 미뤄두면 좋은 것.
// 고민을 골라 뽑은 결과도, 그냥 뽑은 결과도 이 카드로 그린다.
//
// 한때 할 것과 미룰 것을 넷씩 번호 목록으로 세웠다. 둘째부터 넷째는 고른 상황의
// 고정 목록이라 날마다 같은 취업 준비 체크리스트가 됐고, 짧은 명령이 줄줄이 늘어서
// AI 가 쓴 글처럼 읽혔다(사장님 지적). 이제 오늘 사주에서 나온 한 가지씩을 한 문단으로
// 쓴다. 무엇을 할지와 왜 그게 오늘인지가 한 흐름으로 읽힌다.
export function TodayDecisionCard({ decision, scoreWhy }: Props) {
  // 결론 줄이 두 문장일 수 있다. 둘 다 20px 굵게 두면 네 줄짜리 덩어리가 된다.
  // 첫 문장만 크게, 나머지는 아래 설명 앞에 붙인다.
  const [head, ...rest] = decision.overall.headline.split(/(?<=[.!?])\s+/);
  const summary = [...rest, decision.overall.summary].join(' ');
  return (
    <section className="tdc" aria-label="오늘 결론">
      <div className="sec-card tdc__overall">
        <p className="cat4__head">오늘 풀이</p>
        <p className="tdc__headline">{head}</p>
        <Sentences className="tdc__summary" text={summary} />
        {/* 마음 한 줄과 사주 근거는 결론을 받쳐주는 말이라 상자로 묶어 아래에 */}
        {decision.feeling || decision.basis ? (
          <div className="tdc__mind">
            {decision.feeling ? <p className="tdc__feeling">{decision.feeling}</p> : null}
            {decision.basis ? <p className="tdc__basis">{decision.basis}</p> : null}
          </div>
        ) : null}
        {scoreWhy ? (
          <div className="tdc__why">
            <p className="tdc__why-k">{scoreWhy.head}</p>
            <Sentences className="tdc__why-v" text={scoreWhy.text} />
          </div>
        ) : null}
      </div>
      <div className="sec-card tdc__act tdc__act--do">
        <p className="cat4__head">오늘 해보면 좋은 것</p>
        <p className="tdc__act-v">{decision.do.action}</p>
        <Sentences className="tdc__act-why" text={decision.do.why} />
      </div>
      <div className="sec-card tdc__act tdc__act--dont">
        <p className="cat4__head">오늘은 미뤄두면 좋은 것</p>
        <p className="tdc__act-v">{decision.dont.action}</p>
        <Sentences className="tdc__act-why" text={decision.dont.why} />
        {decision.note ? <Sentences className="tdc__note" text={decision.note} /> : null}
      </div>
    </section>
  );
}
