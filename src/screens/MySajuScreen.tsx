import { useMemo, useState } from 'react';
import { Mascot } from '../components/Mascot.tsx';
import { AppLayout } from '../components/AppLayout.tsx';
import { computeFourPillars, type BirthInput } from '../lib/fourPillars.ts';
import { analyzeSaju, balanceShape, tenGodOf } from '../lib/tenGods.ts';
import { MONEY_STYLE, LOVE_STYLE, WORK_STYLE, YEAR_FLOW } from '../data/sajuAnswers.ts';
import { DAY_MASTER_BY_INDEX } from '../data/dayMaster.ts';
import {
  STRENGTH_READING,
  MISSING_READING,
  USEFUL_READING,
  ELEMENT_SHORT,
} from '../data/sajuContent.ts';
import { ELEMENT_KO, type Element } from '../lib/saju.ts';

type Props = {
  birth: BirthInput;
  onBack: () => void;
  onEdit: () => void;
  onShare: (text: string) => void;
  onDeleteBirth: () => void;
  onDraw: () => void;
};

const EL_ORDER: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
// 천간 0~9 → 오행 (갑을 나무, 병정 불, 무기 흙, 경신 쇠, 임계 물)
function dmElement(stem: number): Element {
  return EL_ORDER[Math.floor(stem / 2)];
}
// 오행 색은 점·막대 같은 장식에만 쓴다. 글자에 얹으면 대비가 떨어지고,
// 특히 화(火)의 붉은색은 토스에서 '오류' 로 읽혀 멀쩡한 사주가 경고처럼 보인다.
const EL_HUE: Record<Element, string> = {
  wood: 'var(--el-wood)',
  fire: 'var(--el-fire)',
  earth: 'var(--el-earth)',
  metal: 'var(--el-metal)',
  water: 'var(--el-water)',
};

// 내 사주 한 장 — 여덟 글자, 오행 저울, 기운의 방향.
// 사주는 낯선 한자 덩어리라 그냥 보여주면 아무것도 전달되지 않는다.
// 그래서 순서를'나는 누구인가(일간)  근거(팔자)  저울(오행)  쓰는 법'으로 뒀다.
export function MySajuScreen({ birth, onBack, onEdit, onShare, onDeleteBirth, onDraw }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pillars = useMemo(() => computeFourPillars(birth), [birth]);
  const profile = useMemo(() => analyzeSaju(pillars), [pillars]);
  const dm = DAY_MASTER_BY_INDEX[pillars.dayStem];
  const strength = STRENGTH_READING[profile.strength];
  const useful = USEFUL_READING[profile.usefulElement];
  // 막대와 문장이 어긋나지 않도록 요약 문구를 분포에서 직접 뽑는다
  const shape = balanceShape(profile);
  // 올해의 글자 — 2월 4일 전이면 사주로는 아직 지난해다
  const now = new Date();
  const sajuYear = now.getMonth() + 1 < 2 || (now.getMonth() + 1 === 2 && now.getDate() < 4) ? now.getFullYear() - 1 : now.getFullYear();
  const yearStem = (((sajuYear - 4) % 10) + 10) % 10;
  const yearFlow = YEAR_FLOW[tenGodOf(pillars.dayStem, yearStem)];
  // 나를 받쳐주는 기운의 사람 (나를 낳는 오행: 물→나무, 나무→불, 불→흙, 흙→쇠, 쇠→물)
  const SUPPORTER: Record<Element, Element> = { wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal' };
  const supporterEl = SUPPORTER[dmElement(pillars.dayStem)];

  const cols: { label: string; pillar: typeof pillars.year | null }[] = [
    { label: '년', pillar: pillars.year },
    { label: '월', pillar: pillars.month },
    { label: '일', pillar: pillars.day },
    { label: '시', pillar: pillars.hour },
  ];

  function share() {
    onShare(
      [
        `나는 ${dm.name}`,
        `"${dm.tagline}"`,
        ``,
        `사주 ${pillars.year.kor} ${pillars.month.kor} ${pillars.day.kor}${pillars.hour ? ` ${pillars.hour.kor}` : ''}`,
        `${strength.label}`,
        ``,
        `너는 무슨 일간인지 봐봐 `,
      ].join('\n'),
    );
  }

  return (
    <AppLayout onBack={onBack}>
      {/* 1. 나는 누구인가 — 여기서 "이게 나야"가 안 오면 나머지는 안 읽힌다 */}
      <div className="dm-hero" style={{ ['--dm-hue' as string]: dm.hue, ['--dm-hue-text' as string]: dm.hueText }}>
        <span className="dm-hero__cap">타고난 성격</span>
        <div className="dm-hero__row">
          <span className="dm-hero__icon" aria-hidden>
            <Mascot size={40} accent={dm.hue} bare />
          </span>
          <h2 className="dm-hero__name">{dm.name}</h2>
        </div>
        <p className="dm-hero__tag">{dm.tagline}</p>
        <p className="dm-hero__nature">{dm.nature}</p>
        <ul className="dm-chips">
          {dm.strengths.map((s) => (
            <li key={s} className="dm-chip">
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* 2. 손님이 묻는 순서: 돈 · 사랑 · 일 · 올해 · 조심 · 행운 */}
      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">돈</h2>
        </div>
        <p className="qa">{MONEY_STYLE[dm.id]}</p>
      </section>

      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">사랑</h2>
        </div>
        <p className="qa">{LOVE_STYLE[dm.id]}</p>
        <div className="dm-note">
          <span className="dm-note__k">나를 받쳐주는 사람</span>
          <p className="dm-note__v">{ELEMENT_KO[supporterEl]} 기운을 가진 사람이에요. 곁에 있으면 힘이 나요.</p>
        </div>
      </section>

      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">일</h2>
        </div>
        <p className="qa">{WORK_STYLE[dm.id]}</p>
        <div className="dm-note">
          <span className="dm-note__k">{strength.label} · {strength.short}</span>
          <p className="dm-note__v">{strength.tip}</p>
        </div>
      </section>

      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">올해 {sajuYear}년</h2>
        </div>
        <p className="qa"><b>{yearFlow.title}</b></p>
        <p className="qa qa--sub">{yearFlow.body}</p>
      </section>

      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">조심할 것</h2>
        </div>
        <p className="qa">{dm.shadow}</p>
        <div className="dm-note">
          <span className="dm-note__k">이럴 때 살아나요</span>
          <p className="dm-note__v">{dm.shines}</p>
        </div>
      </section>

      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">나에게 좋은 기운 · {ELEMENT_KO[profile.usefulElement]}</h2>
        </div>
        <p className="qa">{useful.what}이 필요해요</p>
        <p className="qa qa--sub">{useful.how}</p>
      </section>

      {/* 2. 근거 — 여덟 글자. 한자만 두면 벽이라 아래 한글을 붙인다 */}
      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">내 사주 글자</h2>
          <button type="button" className="sec__action" onClick={onEdit}>
            수정
          </button>
        </div>
        <div className="pillars-card">
        <div className="pillars-grid">
          {cols.map((c) => (
            <div key={c.label} className={c.label === '일' ? 'pcol pcol--me' : 'pcol'}>
              <span className="pcol__label">{c.label}</span>
              {c.pillar ? (
                <>
                  {/* 한자는 읽을 수 있는 사람이 드물다. 한글로 보여주고 한자는 아예 뺀다. */}
                  <span className="pcol__stem">{c.pillar.kor[0]}</span>
                  <span className="pcol__branch">{c.pillar.kor[1]}</span>
                  {/* 오행은 글자색이 아니라 점으로 — 한자 넷이 제각각 색이면 산만하다 */}
                  <span className="pcol__els" aria-hidden>
                    <i style={{ background: EL_HUE[stemEl(c.pillar.stem)] }} />
                    <i style={{ background: EL_HUE[branchEl(c.pillar.branch)] }} />
                  </span>
                </>
              ) : (
                <>
                  <span className="pcol__stem pcol__stem--none">?</span>
                  <span className="pcol__branch pcol__branch--none">?</span>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="pillars-card__foot">
          가운데 <b>{pillars.dayMaster.kor}</b>이 나예요. 다른 글자는 나를 둘러싼
          것들이에요.
        </p>
        {pillars.corrections.notes.length > 0 ? (
          <ul className="pillars-corr">
            {pillars.corrections.notes.map((n) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
        ) : null}
        </div>
      </section>

      {/* 3. 오행 저울 — 숫자를 그림으로. 지장간까지 풀어 센 값이다 */}
      <section className="sec">
        <div className="sec__head">
          <h2 className="sec__title">내 안의 다섯 기운</h2>
        </div>
        <div className="elbal-card">
        <ul className="elbal-list">
          {EL_ORDER.map((e) => {
            const pct = Math.round(profile.balance[e] * 100);
            return (
              <li key={e} className="elbal-row">
                <span className="elbal-row__k">
                  <i className="elbal-row__dot" style={{ background: EL_HUE[e] }} aria-hidden />
                  {ELEMENT_SHORT[e]}
                </span>
                <span className="elbal-row__bar">
                  <i style={{ width: `${Math.max(pct, 2)}%`, background: EL_HUE[e] }} />
                </span>
                <span className="elbal-row__v num">{pct}%</span>
              </li>
            );
          })}
        </ul>
        <p className="elbal-card__foot">
          가장 많은 건 <b>{ELEMENT_KO[profile.strongest]}</b>
          {shape.kind === 'missing' ? (
            <> · 거의 없는 건 {profile.missing.map((m) => ELEMENT_KO[m]).join(', ')}</>
          ) : shape.kind === 'tilted' ? (
            <> · 이쪽으로 많이 쏠려 있어요</>
          ) : shape.kind === 'thin' ? (
            <> · 가장 옅은 건 {ELEMENT_KO[shape.el]}</>
          ) : (
            <> · 다섯 기운이 고르게 있어요</>
          )}
        </p>
        {shape.kind !== 'even' ? (
          <p className="elbal-missing">{MISSING_READING[shape.el]}</p>
        ) : null}
        </div>
      </section>

      {/* 사주는 목적이 아니라 쪽지를 맞추기 위한 근거다. 마지막엔 쪽지로 돌려보낸다. */}
      <button type="button" className="btn btn--primary" onClick={onDraw}>
        이 사주로 오늘 쪽지 뽑기 
      </button>
      <button type="button" className="btn btn--secondary" onClick={share}>
        내 사주 자랑하기 
      </button>
      {/* 개인정보를 받았으니 지우는 길도 같은 화면에 둔다 — 설정 깊숙이 숨기지 않는다 */}
      <div className="privacy-note">
        <p className="privacy-note__body">
          생년월일은 <b>이 기기에만</b> 있어요. 서버로 보내지 않고, 앱을 지우면 함께 사라져요.
        </p>
        {confirmDelete ? (
          <div className="privacy-note__confirm">
            <span>정말 지울까요? 사주는 다시 볼 수 없어요.</span>
            <div className="privacy-note__acts">
              <button type="button" className="privacy-note__btn" onClick={() => setConfirmDelete(false)}>
                그대로 둘게요
              </button>
              <button
                type="button"
                className="privacy-note__btn privacy-note__btn--danger"
                onClick={onDeleteBirth}
              >
                네, 지울게요
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="privacy-note__del" onClick={() => setConfirmDelete(true)}>
            생년월일 삭제
          </button>
        )}
      </div>
    </AppLayout>
  );
}

// 화면에서만 쓰는 작은 매핑 — 엔진을 건드리지 않기 위해 여기에 둔다
const STEM_EL: Element[] = ['wood','wood','fire','fire','earth','earth','metal','metal','water','water'];
const BRANCH_EL: Element[] = ['water','earth','wood','wood','earth','fire','fire','earth','metal','metal','earth','water'];
function stemEl(i: number): Element {
  return STEM_EL[i];
}
function branchEl(i: number): Element {
  return BRANCH_EL[i];
}
