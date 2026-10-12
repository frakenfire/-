import type { TodayDecision } from '../types/fortune.ts';
import { Sentences } from './Sentences.tsx';
import type { ScoreWhy } from '../lib/scoreWhy.ts';

export type Tile = { k: string; v: string; swatch?: string };

type Props = {
  decision: TodayDecision;
  /** 맨 위 점수가 왜 그 점수인지. 오늘 풀이 카드 안에 이어 붙인다 */
  scoreWhy?: ScoreWhy;
  /** 오늘 날짜. '10월 12일 월요일' */
  date?: string;
  /** 할 것과 미룰 것 목록 위에 붙는 '왜 오늘 이게 맞는지' 두세 줄 */
  intro?: { do: string; dont: string };
  /** 할 것 아래 '오늘 곁에 두면 좋은 것'(빛깔, 음식, 음악, 친구 등)과 미룰 것 아래 '오늘 멀리하면 좋은 것' */
  goods?: { tiles: Tile[]; why: string };
  avoids?: { tiles: Tile[]; why: string };
};

type Item = { action: string; why: string };

// 결과 맨 위 카드들. 오늘 풀이, 점수 이유, 오늘 해보면 좋은 것, 오늘은 미뤄두면 좋은 것.
//
// 할 것과 미룰 것은 다섯 개씩, 모두 오늘 사주에서 나온다(오늘 십신, 같은 무리의 짝,
// 오늘 지지 속 글자들의 십신). 목록 위에는 왜 오늘 이게 맞는지 두세 줄, 목록 아래에는
// 바로 실천할 수 있게 빛깔, 음식, 음악, 친구를 붙인다(사장님 2026-10-12).
export function TodayDecisionCard({ decision, scoreWhy, date, intro, goods, avoids }: Props) {
  // 결론 줄이 두 문장일 수 있다. 첫 문장만 크게, 나머지는 아래 설명 앞에 붙인다.
  const [head, ...rest] = decision.overall.headline.split(/(?<=[.!?])\s+/);
  const summary = [...rest, decision.overall.summary].join(' ');
  const dos: Item[] = [decision.do, ...(decision.more?.dos ?? [])];
  const donts: Item[] = [decision.dont, ...(decision.more?.donts ?? [])];
  return (
    <section className="tdc" aria-label="오늘 결론">
      {/* 오늘 풀이와 점수 이유를 한 장에. 토스 앱처럼 위에서 아래로: 날짜 → 큰 결론 → 설명 →
          점수가 어떻게 나왔는지(막대) → 사주를 어디서 봤는지(항목) → 마음 한 줄.
          두 장으로 나눠 두니 같은 얘기를 두 번 읽는 느낌이었다(사장님 2026-10-12). */}
      <div className="sec-card tdc__overall">
        <div className="tdc__top">
          <p className="cat4__head">오늘 풀이</p>
          {date ? <span className="tdc__date">{date}</span> : null}
        </div>
        <p className="tdc__headline">{head}</p>
        <Sentences className="tdc__summary" text={summary} />
        {scoreWhy?.luck ? (
          <div className="tdc__score">
            <p className="tdc__score-k">{scoreWhy.luck.head}</p>
            <Sentences className="tdc__body" text={scoreWhy.luck.text} />
          </div>
        ) : null}
        {scoreWhy ? (
          <div className="tdc__score">
            <p className="tdc__score-k">{scoreWhy.head}</p>
            {scoreWhy.parts?.length ? (
              <ul className="tdc__parts">
                {scoreWhy.parts.map((p) => (
                  <li key={p.k} className={`tdc__part tdc__part--${p.band}`}>
                    <span className="tdc__part-k">
                      {p.k}
                      {p.sub && p.sub !== p.k ? <i className="tdc__part-sub">{p.sub}</i> : null}
                    </span>
                    <span className="tdc__part-bar" aria-hidden>
                      <i style={{ width: `${Math.max(0, Math.min(100, p.score))}%` }} />
                    </span>
                    <span className="tdc__part-v num">{p.score}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Sentences className="tdc__body tdc__parts-why" text={scoreWhy.text} />
          </div>
        ) : null}
        {scoreWhy?.rows?.length ? (
          <ul className="tdc__rows">
            {scoreWhy.rows.map((r) => (
              <li key={r.k} className="tdc__row">
                <p className="tdc__score-k">
                  {r.k}
                  <span className="tdc__row-sub"> · {r.sub}</span>
                </p>
                <Sentences className="tdc__body" text={r.v} />
              </li>
            ))}
          </ul>
        ) : decision.basis ? (
          <p className="tdc__basis">{decision.basis}</p>
        ) : null}
        {decision.feeling ? (
          <div className="tdc__mind">
            <p className="tdc__feeling">{decision.feeling}</p>
          </div>
        ) : null}
      </div>
      <div className="sec-card tdc__act tdc__act--do">
        <p className="cat4__head">오늘 해보면 좋은 것</p>
        {intro ? <Sentences className="tdc__body tdc__intro" text={intro.do} /> : null}
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
        {goods ? <Tiles title="오늘 곁에 두면 좋은 것" tiles={goods.tiles} why={goods.why} /> : null}
      </div>
      <div className="sec-card tdc__act tdc__act--dont">
        <p className="cat4__head">오늘은 미뤄두면 좋은 것</p>
        {intro ? <Sentences className="tdc__body tdc__intro" text={intro.dont} /> : null}
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
        {avoids ? <Tiles title="오늘 멀리하면 좋은 것" tiles={avoids.tiles} why={avoids.why} /> : null}
        {decision.note ? <Sentences className="tdc__note" text={decision.note} /> : null}
      </div>
    </section>
  );
}

function Tiles({ title, tiles, why }: { title: string; tiles: Tile[]; why: string }) {
  return (
    <div className="tdc__tiles">
      <p className="tdc__tiles-k">{title}</p>
      <ul className="tdc__grid">
        {tiles.map((t) => (
          <li key={t.k} className="tdc__tile">
            <span className="tdc__tile-k">
              {t.swatch ? <i className="tdc__swatch" style={{ background: t.swatch }} aria-hidden /> : null}
              {t.k}
            </span>
            <strong className="tdc__tile-v">{t.v}</strong>
          </li>
        ))}
      </ul>
      <Sentences className="tdc__tiles-why" text={why} />
    </div>
  );
}
