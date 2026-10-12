import type { TodayDecision } from '../types/fortune.ts';
import { Sentences } from './Sentences.tsx';

export type Tile = { k: string; v: string; swatch?: string };

type Props = {
  decision: TodayDecision;
  /** 맨 위 점수가 왜 그 점수인지. 오늘 풀이 다음 카드로 */
  scoreWhy?: { head: string; text: string; rows?: { k: string; v: string }[] };
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
export function TodayDecisionCard({ decision, scoreWhy, intro, goods, avoids }: Props) {
  // 결론 줄이 두 문장일 수 있다. 첫 문장만 크게, 나머지는 아래 설명 앞에 붙인다.
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
        ) : decision.basis && !scoreWhy ? (
          <p className="tdc__basis">{decision.basis}</p>
        ) : null}
      </div>
      {/* 점수 이유는 따로 한 장. 오늘 풀이 안에 작은 글씨로 끼우니 글자 크기가 섞여 보였다 */}
      {scoreWhy ? (
        <div className="sec-card">
          <p className="cat4__head">{scoreWhy.head}</p>
          <Sentences className="tdc__body" text={scoreWhy.text} />
          {scoreWhy.rows?.length ? (
            <ul className="read6 read6--tight tdc__why-rows">
              {scoreWhy.rows.map((r) => (
                <li key={r.k} className="read6__row">
                  <span className="read6__k">{r.k}</span>
                  <Sentences className="read6__v" text={r.v} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
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
