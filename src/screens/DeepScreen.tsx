import { AppLayout } from '../components/AppLayout.tsx';
import { Icon } from '../components/Icon.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { softBreak } from '../lib/softBreak.ts';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import type { DeepRead } from '../lib/deepRead.ts';
import type { TimingRead } from '../lib/timing.ts';

type Props = {
  concernKey: ConcernKey;
  read: DeepRead;
  timing: TimingRead;
  userName: string | null;
  busy: boolean;
  onShare: () => void;
  onCopy: () => void;
  onBack: () => void;
};

const VERDICT_WORD = { now: '지금', soon: '곧', wait: '아직' } as const;

// 상담 3단계 — 답.
// 순서는 결론, 언제, 열두 달 그래프, 왜, 할 일. 사람들이 돈 내고 보는 건 '언제' 라서 위로 뺐다.
export function DeepScreen({ concernKey, read, timing, userName, busy, onShare, onCopy, onBack }: Props) {
  const concern = findConcern(concernKey);
  const max = Math.max(...timing.months.map((m) => m.score));

  return (
    <AppLayout
      onBack={onBack}
      title={concern.resultTitle}
      bottom={
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onShare}>
          친구한테 보내기
        </button>
      }
    >
      {/* 1. 결론 */}
      <div className={`deep-hero deep-hero--${read.verdict}`}>
        <span className="deep-hero__art" aria-hidden>
          <Mascot size={80} mood={read.verdict === 'wait' ? 'calm' : 'grin'} bare />
        </span>
        <span className="deep-hero__tag">
          <Icon name={concern.icon} size={14} /> {userName ? `${userName}님의 ${concern.label}` : concern.label}
        </span>
        <strong className="deep-hero__head">{softBreak(read.headline, 16)}</strong>
        <span className="deep-hero__sub">{read.sub}</span>
        <span className="deep-hero__badge">{VERDICT_WORD[read.verdict]}</span>
      </div>

      {read.situationLine ? <p className="deep-situation">{read.situationLine}</p> : null}

      {/* 2. 언제 */}
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

      {/* 3. 열두 달 흐름 */}
      <div className="sec-card">
        <p className="cat4__head">앞으로 열두 달</p>
        <ul className="mflow">
          {timing.months.map((m, i) => (
            <li key={m.label} className={`mflow__col mflow__col--${m.band}`}>
              <span className="mflow__bar" style={{ height: `${Math.round((m.score / max) * 56) + 8}px` }} />
              <span className="mflow__m num">{m.month}</span>
              {i === 0 ? <span className="mflow__now">지금</span> : null}
            </li>
          ))}
        </ul>
        <p className="mflow__foot">막대가 높은 달이 이 고민에 힘이 붙는 달이에요.</p>
      </div>

      {/* 3.5 달마다 풀이 — 이번 달, 좋은 달, 조심할 달 */}
      {read.slots.map((sl) => (
        <div key={sl.k} className="sec-card">
          <p className="slot__head">
            <span className="slot__k">{sl.k}</span>
            <span className="slot__label">{sl.label}</span>
            <span className="slot__band">{sl.band}</span>
          </p>
          <p className="slot__outer">{sl.outer}</p>
          <p className="slot__inner">{sl.inner}</p>
          <p className="slot__note">속으로는 이래요. {sl.note}</p>
        </div>
      ))}

      {/* 3.7 올해와 내년 */}
      <div className="sec-card">
        <p className="cat4__head">올해와 내년</p>
        <ul className="yline">
          {read.yearLines.map((y) => (
            <li key={y.k} className="yline__row">
              <span className="yline__k">
                {y.k} <b>{y.label}</b>
              </span>
              <span className="yline__b">{y.band}</span>
              <span className="yline__v">{y.v}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. 십 년 배경 */}
      <div className="sec-card">
        <p className="cat4__head">지금 지나는 십 년</p>
        <p className="qa qa--sub">{read.daeunLine}</p>
      </div>

      {/* 5. 왜 이렇게 봤나 */}
      <div className="sec-card">
        <p className="cat4__head">왜 이렇게 봤냐면요</p>
        <ul className="read6">
          {read.why.map((w) => (
            <li key={w.k} className="read6__row">
              <span className="read6__k">{w.k}</span>
              <span className="read6__v">{w.v}</span>
            </li>
          ))}
        </ul>
        <p className="mflow__foot">{read.basis}</p>
        <p className="mflow__foot">{read.innerNote}</p>
      </div>

      <div className="sec-card">
        <p className="cat4__head">이 답은 언제 바뀌나요</p>
        <p className="qa qa--sub">{read.refresh}</p>
      </div>

      {/* 6. 할 일 */}
      <div className="sec-card">
        <p className="cat4__head">이렇게 해보세요</p>
        <ol className="todo3">
          {read.actions.map((a, i) => (
            <li key={a} className="todo3__row">
              <span className="todo3__no num">{i + 1}</span>
              <span className="todo3__v">{a}</span>
            </li>
          ))}
        </ol>
        <div className="plan__hold">
          <span className="plan__hold-k">이건 조심해요</span>
          <span className="plan__hold-v">{read.caution}</span>
        </div>
      </div>

      <div className="share-row">
        <button type="button" className="btn btn--primary share-row__btn" disabled={busy} onClick={onShare}>
          카톡·메시지로 보내기
        </button>
        <button type="button" className="btn btn--secondary share-row__btn" disabled={busy} onClick={onCopy}>
          복사하기
        </button>
      </div>

      <Disclaimer />
    </AppLayout>
  );
}
