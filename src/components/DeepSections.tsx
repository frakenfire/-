import { useRef, useState } from 'react';
import { Icon } from './Icon.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { softBreak } from '../lib/softBreak.ts';
import { Sentences } from './Sentences.tsx';
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
      <div className={`deep-hero deep-hero--${read.verdict}${compact ? ' deep-hero--compact' : ''}`}>
        <div className="deep-hero__main">
          <span className="deep-hero__tag">
            <Icon name={concern.icon} size={14} /> {userName ? `${userName}님의 ${concern.label}` : concern.label}
          </span>
          <strong className="deep-hero__head">{softBreak(read.headline, 14)}</strong>
          <span className="deep-hero__sub"><Sentences text={read.sub} /></span>
          <span className="deep-hero__badge">{VERDICT_WORD[read.verdict]}</span>
        </div>
        <span className="deep-hero__art" aria-hidden>
          <Mascot size={compact ? 56 : 72} mood={read.verdict === 'wait' ? 'calm' : 'grin'} bare />
        </span>
      </div>

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
                <i style={{ width: `${p.score}%` }} />
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

      <div className="sec-card">
        <p className="cat4__head">언제가 좋을까요</p>
        <ul className="when4">
          {read.when.map((w) => (
            <li key={w.k} className="when4__row">
              <span className="when4__k">{w.k}</span>
              <span className="when4__v">{w.v}</span>
              {w.band ? <span className="when4__b">{w.band}</span> : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="sec-card">
        <p className="cat4__head">앞으로 열두 달</p>
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
              className={`mflow__col mflow__col--${m.band}${i === openMonth ? ' mflow__col--on' : ''}`}
            >
              <span className="mflow__barbox">
                <span className="mflow__bar" style={{ height: `${Math.round((m.score / max) * 56) + 8}px` }} />
              </span>
              <span className={`mflow__m num${i === 0 ? ' mflow__m--now' : ''}`}>{m.month}</span>
            </li>
          ))}
        </ul>
        <p className="mflow__foot">맨 왼쪽이 이번 달이에요. 차트를 문지르면 그 달 풀이가 펴져요.</p>
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
            <span className="mpick__band">{picked.band}</span>
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
              <span className="slot__pt-k">좋아요</span>
              <Sentences className="slot__pt-v" text={picked.good} />
            </li>
            <li className="slot__pt slot__pt--care">
              <span className="slot__pt-k">조심해요</span>
              <Sentences className="slot__pt-v" text={picked.care} />
            </li>
          </ul>
        </div>
      </div>

      {read.slots.map((sl) => (
        <div key={sl.k} className="sec-card">
          <p className="slot__head">
            <span className="slot__k">{sl.k}</span>
            <span className="slot__label">{sl.label}</span>
            <span className="slot__band">{sl.band}</span>
          </p>
          <Sentences className="slot__outer" text={sl.outer} />
          <ul className="slot__pts">
            <li className="slot__pt slot__pt--good">
              <span className="slot__pt-k">좋아요</span>
              <Sentences className="slot__pt-v" text={sl.good} />
            </li>
            <li className="slot__pt slot__pt--care">
              <span className="slot__pt-k">조심해요</span>
              <Sentences className="slot__pt-v" text={sl.care} />
            </li>
          </ul>
        </div>
      ))}

      <div className="sec-card">
        <p className="cat4__head">올해와 내년, 무엇이 다른가요</p>
        <ul className="yline">
          {read.yearLines.map((y) => (
            <li key={y.k} className="yline__row">
              <span className="yline__k">
                {y.k} <b>{y.label}</b>
              </span>
              <span className="yline__b">{y.band}</span>
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

      <div className="sec-card">
        <p className="cat4__head">왜 이렇게 봤냐면요</p>
        <ul className="read6">
          {read.why.map((w) => (
            <li key={w.k} className="read6__row">
              <span className="read6__k">{w.k}</span>
              <Sentences className="read6__v" text={w.v} />
            </li>
          ))}
        </ul>
        <p className="mflow__foot">{read.basis}</p>
      </div>

      <div className="sec-card">
        <p className="cat4__head">이 답은 언제 바뀌나요</p>
        <Sentences className="qa qa--sub" text={read.refresh} />
      </div>

      <div className="sec-card">
        <p className="cat4__head">이렇게 해보세요</p>
        <ol className="todo3">
          {read.actions.map((a, i) => (
            <li key={a} className="todo3__row">
              <span className="todo3__no num">{i + 1}</span>
              <Sentences className="todo3__v" text={a} />
            </li>
          ))}
        </ol>
        <div className="plan__hold">
          <span className="plan__hold-k">이건 조심해요</span>
          <span className="plan__hold-v"><Sentences text={read.caution} /></span>
        </div>
      </div>
    </>
  );
}
