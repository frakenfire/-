import { Icon } from './Icon.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { softBreak } from '../lib/softBreak.ts';
import { Sentences } from './Sentences.tsx';
import { Chapter } from './Chapter.tsx';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import { bigMoveOf, type DeepRead } from '../lib/deepRead.ts';
import { withJosa } from '../lib/josa.ts';
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

// 고민에 대한 답 한 벌. 오늘 할 일은 결과 맨 위 카드(TodayDecisionCard)가 맡고,
// 여기는 앞으로 기대해도 되는 것과 조심하면 좋은 것 두 카드, 그리고 접어 둔
// 사주 근거를 맡는다.
//
// 전에는 열두 달 표, 올해와 내년, 지금 지나는 십 년을 카드마다 따로 세웠다.
// 달마다 해마다 십 년마다 읽을 게 너무 많아 하나도 안 와닿는다는 말을 들었다
// (사장님). 같은 재료를 '기대해도 되는 것' 과 '조심하면 좋은 것' 두 목록으로만
// 다시 짠다. 시기는 목록 왼쪽 이름표가 말한다.
export function DeepSections({ concernKey, read, userName, compact = false }: Props) {
  const concern = findConcern(concernKey);
  // 고른 상황의 큰 한 걸음(이직 지원서, 고백, 100만 원 넘는 결제 등)을 그대로 쓴다.
  const move = bigMoveOf(concernKey, read.optionKey);
  const row = (k: string) => read.when.find((x) => x.k === k);
  const best = row('가장 좋은 때');
  const avoid = row('피할 때');
  const thisMonth = row('이번 달');
  const goodYear = row('좋은 해');
  const monthOf = (v: string) => v.split(',')[0];
  const [y0, y1] = read.yearLines;
  const good = read.yearCompare[0];
  const care = read.yearCompare[1];
  const decadeKeep = read.decade?.rows.find((r) => r.k === '이 십 년 동안 기억할 것');

  const expect: { k: string; v: string }[] = [
    // 가장 좋은 달이 이번 달이면 같은 달이 두 줄로 선다. 한 줄로 합친다.
    ...(thisMonth?.act && !(best && monthOf(best.v) === thisMonth.v) ? [{ k: '이번 달', v: thisMonth.act }] : []),
    ...(best?.act ? [{ k: thisMonth && monthOf(best.v) === thisMonth.v ? '이번 달' : monthOf(best.v), v: best.act }] : []),
    ...(good?.thisYear && y0 ? [{ k: `올해 ${y0.label}`, v: good.thisYear }] : []),
    ...(good?.nextYear && y1 ? [{ k: `내년 ${y1.label}`, v: good.nextYear }] : []),
    ...(goodYear?.act && goodYear.v !== y0?.label && goodYear.v !== y1?.label ? [{ k: `${goodYear.v}`, v: goodYear.act }] : []),
  ];
  const watch: { k: string; v: string }[] = [
    ...(avoid?.act ? [{ k: monthOf(avoid.v), v: avoid.act }] : []),
    ...(care?.thisYear && y0 ? [{ k: `올해 ${y0.label}`, v: care.thisYear }] : []),
    ...(care?.nextYear && y1 ? [{ k: `내년 ${y1.label}`, v: care.nextYear }] : []),
    ...(decadeKeep && read.decade ? [{ k: read.decade.span, v: decadeKeep.v }] : []),
  ];
  // 두 카드의 첫 줄은 답이다. 고백은 언제가 가장 좋고, 언제는 미뤄두는 게 나은지.
  const expectLead = best ? `${withJosa(move, '은는')} ${monthOf(best.v)}이 가장 좋아요.` : read.whenVerdict.head;
  const watchLead = avoid ? `${withJosa(move, '은는')} ${monthOf(avoid.v)}에는 미뤄두는 게 나아요.` : read.caution;

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

      <div className="sec-card">
        <p className="cat4__head">앞으로 기대해도 되는 것</p>
        <Sentences className="ahead__lead" text={expectLead} />
        <ul className="read6 read6--tight">
          {expect.map((r) => (
            <li key={r.k + r.v} className="read6__row">
              <span className="read6__k">{r.k}</span>
              <Sentences className="read6__v" text={r.v} />
            </li>
          ))}
        </ul>
      </div>

      <div className="sec-card">
        <p className="cat4__head">앞으로 조심하면 좋은 것</p>
        <Sentences className="ahead__lead ahead__lead--care" text={watchLead} />
        <ul className="read6 read6--tight">
          {watch.map((r) => (
            <li key={r.k + r.v} className="read6__row">
              <span className="read6__k">{r.k}</span>
              <Sentences className="read6__v" text={r.v} />
            </li>
          ))}
        </ul>
      </div>

      {/* 여기부터는 답이 아니라 근거다. 더 볼 사람만 연다. */}
      <Chapter title="내 사주 자세히 보기" fold>
      {/* 점수가 어디서 나왔는지 — '87점입니다' 하고 끝내면 아무도 안 믿는다. */}
      <div className="sec-card">
        <p className="cat4__head">{read.score.total}점이 나온 이유</p>
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

      {/* 왜 지금 이 고민이 커졌나 */}
      <div className="sec-card">
        <p className="cat4__head">요즘 {concern.shortName} 생각이 커진 이유</p>
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

      <div className="sec-card">
        <p className="cat4__head">네 가지 나</p>
        <ul className="selves">
          {read.selves.map((x) => (
            <li key={x.k} className="selves__row">
              <span className="selves__k">
                {x.k}
                <i className="selves__label">{x.label}</i>
              </span>
              <span className="selves__v num">{x.score}</span>
              <Sentences className="selves__line" text={x.line} />
              <Sentences className="selves__vs" text={x.vs ?? '이 점수가 기준이에요. 위 세 점수는 이 점수와 비교한 거예요.'} />
            </li>
          ))}
        </ul>
        <Sentences
          className="mflow__foot"
          text={'오늘이 맨 위예요. 쪽지는 날마다 새로 뽑으니까요.\n가까운 미래는 올해와 이번 달 점수를 반씩 합산한 값이에요.\n타고난 나는 평생 그대로고, 나머지 셋은 때가 지나면 바뀌어요.'}
        />
      </div>

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
