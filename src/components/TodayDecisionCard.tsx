import type { TodayDecision } from '../types/fortune.ts';
import { Sentences } from './Sentences.tsx';

type Props = {
  decision: TodayDecision;
  /** 맨 위 점수가 왜 그 점수인지. 오늘 풀이 안에 짧게 */
  scoreWhy?: { head: string; text: string };
};

type Item = { action: string; why: string };

// 결과 맨 위 세 카드. 오늘 풀이, 오늘 해보면 좋은 것, 오늘은 미뤄두면 좋은 것.
// 고민을 골라 뽑은 결과도, 그냥 뽑은 결과도 이 카드로 그린다.
//
// 할 것과 미룰 것은 모두 오늘 사주에서 나온다. 첫 항목은 오늘 십신, 다음 항목들은
// 같은 무리의 짝 십신과 오늘 지지 십신이다. 한때 상황 표의 고정 목록을 붙였다가
// 날마다 같은 체크리스트가 됐고, 그걸 빼서 하나씩만 두니 너무 적다는 말을 들었다.
// 항목마다 무엇을 할지(굵게)와 왜 오늘 그게 좋은지(설명)를 붙인다.
export function TodayDecisionCard({ decision, scoreWhy }: Props) {
  // 결론 줄이 두 문장일 수 있다. 둘 다 20px 굵게 두면 네 줄짜리 덩어리가 된다.
  // 첫 문장만 크게, 나머지는 아래 설명 앞에 붙인다.
  const [head, ...rest] = decision.overall.headline.split(/(?<=[.!?])\s+/);
  const summary = [...rest, decision.overall.summary].join(' ');
  const dos: Item[] = [decision.do, ...(decision.more?.dos ?? [])];
  const donts: Item[] = [decision.dont, ...(decision.more?.donts ?? [])];
  return (
    <section className="tdc" aria-label="오늘 결론">
      <div className="sec-card tdc__overall">
        <p className="cat4__head">오늘 풀이</p>
        <p className="tdc__headline">{head}</p>
        <Sentences className="tdc__summary" text={summary} />
        {decision.feeling ? (
          <div className="tdc__mind">
            <p className="tdc__feeling">{decision.feeling}</p>
          </div>
        ) : null}
        {/* 오늘이 내 사주로 어떤 날인지(basis)는 점수 이유가 함께 말한다 */}
        {scoreWhy ? (
          <div className="tdc__why">
            <p className="tdc__why-k">{scoreWhy.head}</p>
            <Sentences className="tdc__why-v" text={scoreWhy.text} />
          </div>
        ) : decision.basis ? (
          <p className="tdc__basis">{decision.basis}</p>
        ) : null}
      </div>
      <div className="sec-card tdc__act tdc__act--do">
        <p className="cat4__head">오늘 해보면 좋은 것</p>
        <ol className="decide__list decide__list--do">
          {dos.map((d, i) => (
            <li key={d.action} className="decide__row">
              <span className="decide__no num">{i + 1}</span>
              <span className="decide__body">
                <p className="tdc__act-v">{d.action}</p>
                <Sentences className="tdc__act-why" text={d.why} />
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="sec-card tdc__act tdc__act--dont">
        <p className="cat4__head">오늘은 미뤄두면 좋은 것</p>
        <ul className="decide__list decide__list--dont">
          {donts.map((d) => (
            <li key={d.action} className="decide__row">
              <span className="decide__x" aria-hidden />
              <span className="decide__body">
                <p className="tdc__act-v">{d.action}</p>
                <Sentences className="tdc__act-why" text={d.why} />
              </span>
            </li>
          ))}
        </ul>
        {decision.note ? <Sentences className="tdc__note" text={decision.note} /> : null}
      </div>
    </section>
  );
}
