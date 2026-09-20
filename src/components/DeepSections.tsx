import { useRef, useState } from 'react';
import { Icon } from './Icon.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { softBreak } from '../lib/softBreak.ts';
import { Sentences } from './Sentences.tsx';
import { Fold } from './Fold.tsx';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import type { DeepRead } from '../lib/deepRead.ts';
import type { TimingRead } from '../lib/timing.ts';

type Props = {
  concernKey: ConcernKey;
  read: DeepRead;
  timing: TimingRead;
  userName: string | null;
  /** 결과 화면 안에 끼울 때는 결론 카드를 조금 작게 쓴다 */
  compact?: boolean;
};

const VERDICT_WORD = { now: '지금', soon: '곧', wait: '아직' } as const;

// 고민에 대한 답 한 벌. 상담 화면과 쪽지 결과 화면이 같은 것을 쓴다.
// 순서는 결론, 언제, 열두 달, 달별 풀이, 올해와 내년, 십 년, 근거, 할 일.
export function DeepSections({ concernKey, read, timing, userName, compact = false }: Props) {
  const concern = findConcern(concernKey);
  const max = Math.max(...timing.months.map((m) => m.score));
  // 막대만 보여주면 '그래서 그 달에 뭐가 있는데' 가 남는다. 눌러서 펴 볼 수 있게 한다.
  const [openMonth, setOpenMonth] = useState(0);
  const picked = read.monthSlots[openMonth] ?? read.monthSlots[0];
  const flowRef = useRef<HTMLUListElement>(null);
  const last = read.monthSlots.length - 1;

  // 막대 하나하나를 버튼으로 두면 폭이 22px 이라 손가락이 옆 달을 누른다.
  // 그래서 막대는 그림으로만 두고, 차트 위를 문질러 고르게 한다.
  // 정확히 집어야 할 때는 밑의 좌우 버튼(44px)을 쓰면 된다.
  function scrubTo(clientX: number) {
    const el = flowRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ratio = (clientX - r.left) / r.width;
    const i = Math.round(ratio * last);
    setOpenMonth(Math.max(0, Math.min(last, i)));
  }

  return (
    <>
      {/* 결과 화면 안에서는 맨 위 쪽지 카드가 이미 결론을 말했다. 같은 말을 두 번
          하면 화면만 길어진다. 상담 단독 화면일 때만 결론 카드를 세운다. */}
      {compact ? null : (
        <div className={`deep-hero deep-hero--${read.verdict}`}>
          <div className="deep-hero__main">
            <span className="deep-hero__tag">
              <Icon name={concern.icon} size={14} /> {userName ? `${userName}님의 ${concern.label}` : concern.label}
            </span>
            <strong className="deep-hero__head">{softBreak(read.headline, 14)}</strong>
            <span className="deep-hero__sub"><Sentences text={read.sub} /></span>
            <span className="deep-hero__badge">{VERDICT_WORD[read.verdict]}</span>
          </div>
          <span className="deep-hero__art" aria-hidden>
            <Mascot size={72} mood={read.verdict === 'wait' ? 'calm' : 'grin'} bare />
          </span>
        </div>
      )}

      {/* 점수가 어디서 나왔는지 — '87점입니다' 하고 끝내면 아무도 안 믿는다.
          바탕 30, 십 년 20, 올해 20, 이번 달 20, 오늘 10 을 그대로 펼쳐 보여준다. */}
      <div className="sec-card">
        <p className="cat4__head">왜 {read.score.total}점인가요</p>
        <Sentences className="why-score__lead" text={read.scoreLine} />
        <ul className="why-score">
          {read.score.parts.map((p) => (
            <li key={p.k} className={`why-score__row why-score__row--${p.band}`}>
              <span className="why-score__k">
                {p.k}
                <i className="why-score__label">{p.label}</i>
              </span>
              <span className="why-score__bar" aria-hidden>
                {/* 점수는 실제로 50~92 사이에 모인다. 0~100 을 그대로 그리면
                    67과 78이 눈으로 구분이 안 된다. 실제 범위로 펴서 그린다.
                    숫자는 바로 옆에 그대로 있으니 과장이 아니라 확대다. */}
                <i style={{ width: `${Math.max(6, Math.min(100, ((p.score - 45) / 50) * 100))}%` }} />
              </span>
              <span className="why-score__v num">{p.score}</span>
              <span className="why-score__w num">{p.weight}%</span>
            </li>
          ))}
        </ul>
        <p className="mflow__foot">
          다섯 칸을 몫대로 더하면 {read.score.total}점이에요. 모델이 아니라 계산이라, 같은 날 몇 번을 봐도 같은 숫자가 나와요.
        </p>
      </div>

      {/* 결정 카드 — 이 리포트가 실패하지 않으려면 여기서 끝이 나야 한다.
          다 읽고 '그래서 뭘 하라는 거지' 가 남으면 진 것이다. */}
      <div className="sec-card sec-card--decide">
        <p className="cat4__head">지금 어떻게 하면 될까요</p>
        <span className={`decide__stance decide__stance--${read.decision.stance}`}>{read.decision.stanceWord}</span>
        <Sentences className="decide__verdict" text={read.decision.verdict} />
        <p className="decide__sub">지금 할 것</p>
        <ol className="decide__list decide__list--do">
          {read.decision.dos.map((d, i) => (
            <li key={d} className="decide__row">
              <span className="decide__no num">{i + 1}</span>
              <span className="decide__v">{d}</span>
            </li>
          ))}
        </ol>
        <p className="decide__sub">지금 하지 말 것</p>
        <ul className="decide__list decide__list--dont">
          {read.decision.donts.map((d) => (
            <li key={d} className="decide__row">
              <span className="decide__x" aria-hidden />
              <span className="decide__v">{d}</span>
            </li>
          ))}
        </ul>
        <p className="mflow__foot">맨 위 하나가 오늘 바로 할 수 있는 것이에요.</p>
      </div>

      {/* '이 고민' 은 앱이 아는 것을 일부러 안 말하는 것이다. 돈을 물었으면
          돈이라고 적는다. */}
      <Fold title="내 사주는 이렇게 생겼어요" hint={`타고난 구조와, 지금 ${concern.shortName} 생각이 커진 이유`}>
      {/* 평생 안 바뀌는 자리 — 오늘 어떠냐가 아니라 나는 원래 어떤 사람이냐 */}
      <div className="sec-card">
        <p className="cat4__head">{read.shape.head}</p>
        <ul className="shape4">
          {read.shape.rows.map((r) => (
            <li key={r.k} className="shape4__row">
              <span className="shape4__k">{r.k}</span>
              <Sentences className="shape4__v" text={r.v} />
            </li>
          ))}
        </ul>
        <p className="mflow__foot">이 다섯 줄은 태어난 여덟 글자에서만 나와요. 해가 바뀌어도 안 바뀌는 자리예요.</p>
      </div>

      {/* 왜 지금 이 고민이 커졌나 — 타고난 구조가 '원래 어떤 사람이냐' 라면
          여기는 '그래서 지금 왜 이런 상황이냐' 에 답한다. */}
      <div className="sec-card">
        <p className="cat4__head">{read.now.head}</p>
        {read.now.situation ? <Sentences className="deep-situation" text={read.now.situation} /> : null}
        <ul className="nowlist">
          {read.now.rows.map((r) => (
            <li key={r.k} className="nowlist__row">
              <span className="nowlist__k">
                {r.k}
                {r.label ? <i className="nowlist__label">{r.label}</i> : null}
              </span>
              <Sentences className="nowlist__v" text={r.v} />
            </li>
          ))}
        </ul>
        <p className="mflow__foot">십 년이 배경을 깔고, 올해가 방향을 정하고, 이번 달이 눈앞에 밀어놓은 거예요.</p>
      </div>

      </Fold>

      <Fold title="언제 움직일까요" hint="가장 좋은 때와 조심할 때, 앞으로 열두 달">
      <div className="sec-card">
        <p className="cat4__head">언제가 좋을까요</p>
        <ul className="when4">
          {read.when.map((w) => (
            <li key={w.k} className="when4__row">
              <span className="when4__k">{w.k}</span>
              <span className="when4__v">{w.v}</span>
              {w.band ? (
                <span className={`when4__b when4__b--${w.bandKey ?? 'ok'}`}>{w.band}</span>
              ) : null}
              {w.act ? <span className="when4__act">{w.act}</span> : null}
            </li>
          ))}
        </ul>

        <p className="cat4__head cat4__head--sub">앞으로 열두 달</p>
        <ul
          className="mflow"
          ref={flowRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            scrubTo(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 0) return;
            scrubTo(e.clientX);
          }}
        >
          {timing.months.map((m, i) => (
            <li
              key={m.label}
              className={`mflow__col mflow__col--${m.band}${i === openMonth ? ' mflow__col--on' : ''}`
                + (i > 0 && m.year !== timing.months[i - 1].year ? ' mflow__col--newyear' : '')}
            >
              <span className="mflow__barbox">
                <span className="mflow__bar" style={{ height: `${Math.round((m.score / max) * 56) + 8}px` }} />
              </span>
              <span className={`mflow__m num${i === 0 ? ' mflow__m--now' : ''}`}>{m.month}</span>
            </li>
          ))}
        </ul>
        {/* 가로축에 1 2 3 만 적혀 있으면 그게 내년인지 올해인지 알 수가 없다.
            해가 바뀌는 자리에 세로선을 긋고, 아래 한 줄이 범위를 말한다. */}
        <p className="mflow__foot">
          {timing.months[0].label}부터 {timing.months[timing.months.length - 1].label}까지예요.
          맨 왼쪽이 이번 달이고, 세로선 오른쪽이 {timing.months[timing.months.length - 1].year}년이에요.
          차트를 문지르면 그 달 풀이가 펴져요.
        </p>
        <div className="mpick">
          <p className="mpick__head">
            <button
              type="button"
              className="mpick__step"
              aria-label="이전 달"
              disabled={openMonth === 0}
              onClick={() => setOpenMonth((v) => Math.max(0, v - 1))}
            >
              ‹
            </button>
            <span className="mpick__label">{picked.label}</span>
            <span className={`mpick__band mpick__band--${picked.bandKey}`}>{picked.band}</span>
            <button
              type="button"
              className="mpick__step"
              aria-label="다음 달"
              disabled={openMonth === last}
              onClick={() => setOpenMonth((v) => Math.min(last, v + 1))}
            >
              ›
            </button>
          </p>
          <Sentences className="mpick__line" text={picked.outer} />
          <ul className="slot__pts">
            <li className="slot__pt slot__pt--good">
              {/* 밴드 칩이 같은 화면에서 '좋아요 92' 로 쓰이고 있다.
                  여기까지 '좋아요' 라고 적으면 한 단어가 두 가지 뜻이 된다.
                  점수를 말하는 자리와 내용을 말하는 자리를 갈라놓는다. */}
              <span className="slot__pt-k">잘 되는 것</span>
              <Sentences className="slot__pt-v" text={picked.good} />
            </li>
            <li className="slot__pt slot__pt--care">
              <span className="slot__pt-k">탈 나는 것</span>
              <Sentences className="slot__pt-v" text={picked.care} />
            </li>
          </ul>
        </div>
      </div>

      <div className="sec-card">
        <p className="cat4__head">올해와 내년, 무엇이 다른가요</p>
        <ul className="yline">
          {read.yearLines.map((y) => (
            <li key={y.k} className="yline__row">
              <span className="yline__k">
                {y.k} <b>{y.label}</b>
              </span>
              <span className={`yline__b yline__b--${y.bandKey}`}>{y.band}</span>
              <span className="yline__v"><Sentences text={y.v} /></span>
            </li>
          ))}
        </ul>
        {/* 따로 설명만 하면 뭐가 다른지 안 보인다. 같은 줄에 맞대 놓는다. */}
        <table className="ycmp">
          <thead>
            <tr>
              <th />
              <th>{read.yearLines[0]?.label}</th>
              <th>{read.yearLines[1]?.label}</th>
            </tr>
          </thead>
          <tbody>
            {read.yearCompare.map((row) => (
              <tr key={row.k}>
                <th scope="row">{row.k}</th>
                <td>{row.thisYear}</td>
                <td>{row.nextYear}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ycmp__gap">{read.yearGap}</p>
      </div>

      {read.decade ? (
        <div className="sec-card">
          <p className="cat4__head">지금 지나는 십 년</p>
          <p className="dec__span">{read.decade.span}</p>
          <p className="dec__head">{read.decade.head}</p>
          <ul className="dec">
            {read.decade.rows.map((r) => (
              <li key={r.k} className="dec__row">
                <span className="dec__k">{r.k}</span>
                <Sentences className="dec__v" text={r.v} />
              </li>
            ))}
          </ul>
          {read.decade.next ? <p className="mflow__foot">{read.decade.next}</p> : null}
        </div>
      ) : (
        <div className="sec-card">
          <p className="cat4__head">지금 지나는 십 년</p>
          <Sentences className="qa qa--sub" text={read.daeunLine} />
        </div>
      )}

      </Fold>

      <Fold title="왜 이렇게 봤나요" hint="내 글자와 올해, 이번 달에서 본 것">
      <div className="sec-card">
        {/* 묶음 이름이 바로 위에서 '왜 이렇게 봤나요' 라고 묻고 있다.
            여기서 '왜 이렇게 봤냐면요' 라고 다시 쓰면 같은 질문을 두 번 한다.
            이 카드가 실제로 보여주는 것(네 층에서 각각 무엇을 봤나)을 적는다. */}
        <p className="cat4__head">층마다 본 것</p>
        <ul className="read6 read6--tight">
          {read.why.map((w) => (
            <li key={w.k} className="read6__row">
              <span className="read6__k">{w.k}</span>
              <Sentences className="read6__v" text={w.v} />
            </li>
          ))}
        </ul>
        <p className="mflow__foot">{read.basis}</p>
      </div>

      {/* 명식을 그대로 펼친다. 근거를 안 보여주면 '아무 말이나 하는 앱' 이 된다. */}
      <div className="sec-card">
        <p className="cat4__head">내 명식 여덟 글자</p>
        <ul className="chart8">
          {read.chart.pillars.map((c) => (
            <li key={c.k} className={`chart8__col${c.me ? ' chart8__col--me' : ''}`}>
              <span className="chart8__k">{c.k}</span>
              <span className="chart8__stem">{c.stem}</span>
              <span className="chart8__branch">{c.branch}</span>
              <span className="chart8__god">{c.god}</span>
              <span className="chart8__step">{c.step}</span>
            </li>
          ))}
        </ul>
        <ul className="read6 read6--tight">
          <li className="read6__row">
            <span className="read6__k">나를 뜻하는 글자</span>
            <Sentences className="read6__v" text={read.chart.dayMaster} />
          </li>
          <li className="read6__row">
            <span className="read6__k">힘의 균형</span>
            <Sentences className="read6__v" text={read.chart.strength} />
          </li>
          <li className="read6__row">
            <span className="read6__k">태어난 달</span>
            <Sentences className="read6__v" text={read.chart.season} />
          </li>
          <li className="read6__row">
            <span className="read6__k">채워주는 기운</span>
            <Sentences className="read6__v" text={read.chart.useful} />
          </li>
        </ul>

        <p className="cat4__head cat4__head--sub">다섯 기운의 비중</p>
        <ul className="elbar">
          {read.chart.elements.map((e) => (
            <li key={e.el} className={`elbar__row${e.mine ? ' elbar__row--me' : ''}`}>
              <span className="elbar__k">{e.el}</span>
              <span className="elbar__bar"><i style={{ width: `${Math.min(100, e.pct * 2)}%` }} /></span>
              <span className="elbar__v num">{e.pct}%</span>
            </li>
          ))}
        </ul>
        <p className="mflow__foot">별표가 붙은 줄이 나를 뜻하는 기운이에요. 지지는 속에 든 글자까지 풀어서 셌어요.</p>

        {read.chart.sinsal.length > 0 ? (
          <>
            <p className="cat4__head cat4__head--sub">타고난 별</p>
            <ul className="read6 read6--tight">
              {read.chart.sinsal.map((x) => (
                <li key={x.k} className="read6__row">
                  <span className="read6__k">
                    {x.k}
                    <i className="read6__at">{x.at}</i>
                  </span>
                  <Sentences className="read6__v" text={x.v} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <Sentences className="mflow__foot" text={read.chart.gongmang} />

        {read.name ? (
          <>
            <p className="cat4__head cat4__head--sub">이름이 싣는 기운</p>
            <ul className="nameel">
              {read.name.letters.map((l, i) => (
                <li key={`${l.ch}${i}`} className="nameel__box">
                  <span className="nameel__ch">{l.ch}</span>
                  <span className="nameel__el">{l.el}</span>
                </li>
              ))}
            </ul>
            <Sentences className="qa qa--sub" text={read.name.verdict} />
            <p className="mflow__foot">한글 소리를 다섯 기운으로 갈라서 봐요. 한자는 안 받으니 획수는 세지 않아요.</p>
          </>
        ) : null}

        <p className="cat4__head cat4__head--sub">이 주제에서 본 자리</p>
        <Sentences className="qa qa--sub" text={read.chart.focus} />
      </div>

      {/* 오늘 글자와 내 글자가 만나는 자리. 매일 바뀌므로 다시 볼 이유가 된다. */}
      <div className="sec-card">
        <p className="cat4__head">오늘 글자와 내 글자</p>
        <p className="meet__pillar">
          오늘은 <b>{read.todayMeet.pillar}</b>날이에요
        </p>
        <Sentences className="qa qa--sub" text={read.chart.today} />
        <ul className="read6 read6--tight">
          <li className="read6__row">
            <span className="read6__k">오늘 내 단계</span>
            <Sentences className="read6__v" text={`${read.todayMeet.step}. ${read.todayMeet.stepLine}`} />
          </li>
          {read.todayMeet.rows.map((r, i) => (
            <li key={`${r.k}${r.rel}${i}`} className="read6__row">
              <span className="read6__k">
                {r.k}
                <i className="read6__at">{r.rel}</i>
              </span>
              <Sentences className="read6__v" text={r.v} />
            </li>
          ))}
        </ul>
        {read.todayMeet.quiet ? <Sentences className="qa qa--sub" text={read.todayMeet.quiet} /> : null}
        <Sentences className="mflow__foot" text={read.refresh} />
      </div>
      </Fold>
    </>
  );
}
