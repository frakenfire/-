import type { TodayDecision } from '../types/fortune.ts';
import { Sentences } from './Sentences.tsx';

export type TodoItem = { v: string; why?: string };

type Props = {
  decision: TodayDecision;
  /** 고른 상황의 할 일과 미룰 일. 오늘 한 가지 뒤에 이어 붙는다 */
  more?: { dos: TodoItem[]; donts: TodoItem[] };
  /** 내일은 무엇이 달라지는가. 오늘 풀이 끝에 붙는다 */
  tomorrow?: string;
};

// 결과 맨 위 세 카드. 오늘 풀이, 오늘 해보면 좋은 것(여러 개와 까닭), 오늘은
// 미뤄두면 좋은 것(여러 개와 까닭). 고민을 골라 뽑은 결과도, 그냥 뽑은 결과도
// 이 카드로 그린다.
//
// 전에는 할 것 하나, 미룰 것 하나만 두고 나머지는 '이번 달 계획' 이라는 이름으로
// 한참 아래에 따로 뒀다. 오늘의 쪽지를 뽑았는데 오늘 얘기가 없다는 말을 들었다.
// 할 일은 전부 여기로 모은다.
export function TodayDecisionCard({ decision, more, tomorrow }: Props) {
  // 결론 줄이 '해도 좋아요. 대신 ~가 나아요.' 두 문장이다. 둘 다 20px 굵게 두면 네 줄짜리
  // 덩어리가 된다. 첫 문장만 크게, 나머지는 아래 설명 앞에 붙인다.
  const [head, ...rest] = decision.overall.headline.split(/(?<=[.!?])\s+/);
  const summary = [...rest, decision.overall.summary].join(' ');
  const dos: TodoItem[] = [{ v: decision.do.action, why: decision.do.why }, ...(more?.dos ?? [])];
  const donts: TodoItem[] = [{ v: decision.dont.action, why: decision.dont.why }, ...(more?.donts ?? [])];
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
        {tomorrow ? (
          <Sentences className="tdc__tmr" text={tomorrow} />
        ) : null}
      </div>
      <div className="sec-card tdc__act tdc__act--do">
        <p className="cat4__head">오늘 해보면 좋은 것</p>
        <ol className="decide__list decide__list--do">
          {dos.map((d, i) => (
            <li key={d.v} className="decide__row">
              <span className="decide__no num">{i + 1}</span>
              <span className="decide__body">
                <Sentences className="decide__v" text={d.v} />
                {d.why ? <Sentences className="decide__why" text={d.why} /> : null}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="sec-card tdc__act tdc__act--dont">
        <p className="cat4__head">오늘은 미뤄두면 좋은 것</p>
        <ul className="decide__list decide__list--dont">
          {donts.map((d) => (
            <li key={d.v} className="decide__row">
              <span className="decide__x" aria-hidden />
              <span className="decide__body">
                <Sentences className="decide__v" text={d.v} />
                {d.why ? <Sentences className="decide__why" text={d.why} /> : null}
              </span>
            </li>
          ))}
        </ul>
        {decision.note ? <Sentences className="tdc__note" text={decision.note} /> : null}
      </div>
    </section>
  );
}
