import { Icon } from './Icon.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { softBreak } from '../lib/softBreak.ts';
import { Sentences } from './Sentences.tsx';
import { Chapter } from './Chapter.tsx';
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

// 고민에 대한 사주 근거. 오늘 할 일은 결과 맨 위 카드(TodayDecisionCard)가 맡고,
// 여기는 접어 둔 근거만 맡는다.
//
// 오늘의 쪽지를 뽑는 앱이다. 열두 달 표, 올해와 내년, 십 년, 앞으로 기대할 것과
// 조심할 것까지 세웠더니 미래 얘기만 길고 오늘 얘기가 묻혔다(사장님). 미래 칸은 다 뺐다.
export function DeepSections({ concernKey, read, userName, compact = false }: Props) {
  const concern = findConcern(concernKey);
  // 두 기둥이 같은 성향이면 같은 줄이 두 번 나온다. 한 줄로 묶고 기둥 이름을 같이 적는다.
  const traitRows: { trait: string; ks: string[] }[] = [];
  for (const c of read.chart.pillars) {
    const hit = traitRows.find((t) => t.trait === c.trait);
    if (hit) hit.ks.push(c.k);
    else traitRows.push({ trait: c.trait, ks: [c.k] });
  }

  return (
    <>
      {/* 결과 화면 안에서는 맨 위 쪽지 카드가 이미 결론을 말했다. 상담 단독 화면일 때만 세운다. */}
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

      {/* 여기부터는 답이 아니라 근거다. 더 볼 사람만 연다. */}
      <Chapter title="내 사주 자세히 보기" fold>
      {/* 점수가 어디서 나왔는지 — '87점입니다' 하고 끝내면 아무도 안 믿는다. */}
      <div className="sec-card">
        <p className="cat4__head">점수 계산표</p>
        <Sentences className="why-score__lead" text={read.scoreLine} />
        <ul className="why-score">
          <li className="why-score__head" aria-hidden>
            <span>항목</span>
            <span />
            <span>점수</span>
            <span>비율</span>
          </li>
          {read.score.parts.map((p) => (
            <li key={p.k} className={`why-score__row why-score__row--${p.band}`}>
              <span className="why-score__k">
                {p.k}
                <i className="why-score__label">{p.label}</i>
              </span>
              <span className="why-score__bar" aria-hidden>
                <i style={{ width: `${Math.max(0, Math.min(100, p.score))}%` }} />
              </span>
              <span className="why-score__v num">{p.score}</span>
              <span className="why-score__w num">{p.weight}%</span>
            </li>
          ))}
        </ul>
        <Sentences
          className="mflow__foot"
          text={`다섯 칸을 정해진 비율대로 더하면 ${read.score.total}점이에요. 정해진 계산이라 같은 날에는 몇 번을 봐도 같은 숫자가 나와요.`}
        />
      </div>

      {/* 평생 안 바뀌는 자리 — 오늘 어떠냐가 아니라 나는 원래 어떤 사람이냐 */}
      <div className="sec-card">
        <p className="cat4__head">타고난 {concern.shortName} 성향</p>
        <ul className="shape4">
          {read.shape.rows.map((r) => (
            <li key={r.k} className="shape4__row">
              <span className="shape4__k">{r.k}</span>
              <Sentences className="shape4__v" text={r.v} />
            </li>
          ))}
        </ul>
        <Sentences className="mflow__foot" text="이 다섯 줄은 타고난 사주에서만 나와요. 해가 바뀌어도 내용은 그대로예요." />
      </div>

      {read.chart.dayPillar ? (
        <div className="sec-card">
          <p className="cat4__head">{read.chart.dayPillar.name}</p>
          <p className="dayp__nick">{read.chart.dayPillar.nick}</p>
          <Sentences className="dayp__line" text={read.chart.dayPillar.line} />
          <ul className="dayp">
            <li className="dayp__row">
              <span className="dayp__k">잘 풀리는 부분</span>
              <Sentences className="dayp__v" text={read.chart.dayPillar.strong} />
            </li>
            <li className="dayp__row">
              <span className="dayp__k">어려움을 겪기 쉬운 부분</span>
              <Sentences className="dayp__v" text={read.chart.dayPillar.watch} />
            </li>
          </ul>
          <Sentences
            className="mflow__foot"
            text="일주는 태어난 날의 두 글자예요. 예순 가지 중 하나라, 해가 바뀌어도 안 바뀌어요."
          />
        </div>
      ) : null}

      {/* 명식을 그대로 펼친다. 근거를 안 보여주면 '아무 말이나 하는 앱' 이 된다. */}
      <div className="sec-card">
        <p className="cat4__head">{read.chart.pillars.length < 4 ? '내 사주 여섯 글자' : '내 사주 여덟 글자'}</p>
        {read.chart.pillars.length < 4 ? (
          <Sentences className="mflow__foot" text="태어난 시각을 몰라서 시 기둥은 빼고 봤어요." />
        ) : null}
        <ul className="chart8">
          {read.chart.pillars.map((c) => (
            <li key={c.k} className={`chart8__col${c.me ? ' chart8__col--me' : ''}`}>
              <span className="chart8__k">{c.k}</span>
              <span className="chart8__stem">{c.stem}</span>
              <span className="chart8__branch">{c.branch}</span>
            </li>
          ))}
        </ul>
        <ul className="read6 read6--tight">
          {traitRows.map((t) => (
            <li key={t.trait} className="read6__row">
              <span className="read6__k">
                {t.ks.map((k) => <span key={k} className="read6__kk">{k}</span>)}
              </span>
              <span className="read6__v">{t.trait}</span>
            </li>
          ))}
        </ul>
        <ul className="read6 read6--tight">
          <li className="read6__row">
            <span className="read6__k">타고난 성질</span>
            <Sentences className="read6__v" text={read.chart.dayMaster} />
          </li>
          <li className="read6__row">
            <span className="read6__k">내 힘이 얼마나 있나</span>
            <Sentences className="read6__v" text={read.chart.strength} />
          </li>
          <li className="read6__row">
            <span className="read6__k">태어난 계절</span>
            <Sentences className="read6__v" text={read.chart.season} />
          </li>
          <li className="read6__row">
            <span className="read6__k">보완하면 좋은 부분</span>
            <Sentences className="read6__v" text={read.chart.useful} />
          </li>
        </ul>

        <p className="cat4__head cat4__head--sub">다섯 요소가 차지하는 비율</p>
        <ul className="elbar">
          {read.chart.elements.map((e) => (
            <li key={e.el} className={`elbar__row${e.mine ? ' elbar__row--me' : ''}`}>
              <span className="elbar__k">{e.el}</span>
              <span className="elbar__bar"><i style={{ width: `${Math.min(100, e.pct * 2)}%` }} /></span>
              <span className="elbar__v num">{e.pct}%</span>
            </li>
          ))}
        </ul>
        <Sentences className="mflow__foot" text="별표가 붙은 줄이 나를 나타내는 요소예요. 태어난 글자 안에 숨어 있는 글자까지 함께 셌어요." />

        {read.chart.sinsal.length > 0 ? (
          <>
            <p className="cat4__head cat4__head--sub">타고난 특징</p>
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
            <p className="cat4__head cat4__head--sub">이름에 담긴 소리</p>
            <ul className="nameel">
              {read.name.letters.map((l, i) => (
                <li key={`${l.ch}${i}`} className="nameel__box">
                  <span className="nameel__ch">{l.ch}</span>
                  <span className="nameel__el">{l.el}</span>
                </li>
              ))}
            </ul>
            <Sentences className="qa qa--sub" text={read.name.verdict} />
            <Sentences className="mflow__foot" text="한글 이름의 소리를 다섯 가지로 나눠 봐요. 한자는 받지 않으니 획수는 세지 않아요." />
          </>
        ) : null}

        <p className="cat4__head cat4__head--sub">이 주제에서 본 부분</p>
        <Sentences className="qa qa--sub" text={read.chart.focus} />
      </div>

      {/* 오늘 글자와 내 글자가 만나는 자리. 매일 바뀌므로 다시 볼 이유가 된다. */}
      <div className="sec-card">
        <p className="cat4__head">오늘과 내 사주가 만나는 곳</p>
        <Sentences className="qa qa--sub" text={read.chart.today} />
        <ul className="read6 read6--tight">
          <li className="read6__row">
            <span className="read6__k">오늘 내 상태</span>
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
      </Chapter>
    </>
  );
}
