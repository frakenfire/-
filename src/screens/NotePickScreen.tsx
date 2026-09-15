import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout.tsx';
import { NoteCard } from '../components/NoteCard.tsx';
import { NOTE_TEASERS, NOTE_PICK_TITLES, NOTE_PICK_LEADS, NOTE_PICK_HINTS, FAQ_POOL } from '../data/copy.ts';
import { todayKey, hashSeed } from '../lib/dateSeed.ts';
import type { Note } from '../types/fortune.ts';

// 3장에 서로 다른 문구를 준다. 날짜가 바뀌면 조합도 바뀌고, 같은 날엔 고정.
function pickTeasers(seedKey: string): string[] {
  const pool = [...NOTE_TEASERS];
  const out: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const idx = hashSeed(`${seedKey}|${i}`) % pool.length;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

type Props = {
  notes: Note[];
  busy: boolean;
  openingId?: string;
  fortuneLabel: string;
  onPick: (notes: Note[]) => void;
  onBack: () => void;
  /** 회전 값 — 제목·한마디·힌트·질문답이 뽑을 때마다 돌아간다 */
  spin?: number;
  /** 사주가 후보 선정에 반영됐는지 — 근거를 화면에서 밝힌다 */
  personal?: boolean;
};

// PRD §5.3 — 접힌 쪽지 3장 중 1장 선택. 선택 시 해당 쪽지가 펼쳐지는 모션.

export function NotePickScreen({
  notes,
  busy,
  openingId,
  fortuneLabel,
  onPick,
  onBack,
  personal = false,
  spin = 0,
}: Props) {
  const teasers = pickTeasers(`${todayKey()}|${fortuneLabel}|${spin}`);
  // 세 장을 고른다. 고른 순서가 결과의 자리(흐름·챙길 것·행운)가 된다.
  const [picked, setPicked] = useState<string[]>([]);
  function toggle(note: Note) {
    if (busy) return;
    setPicked((cur) => {
      if (cur.includes(note.id)) return cur.filter((id) => id !== note.id);
      if (cur.length >= 3) return cur;
      const next = [...cur, note.id];
      if (next.length === 3) {
        const ordered = next.map((id) => notes.find((n) => n.id === id)!).filter(Boolean);
        window.setTimeout(() => onPick(ordered), 260);
      }
      return next;
    });
  }
  const title = NOTE_PICK_TITLES[spin % NOTE_PICK_TITLES.length];
  const lead = NOTE_PICK_LEADS[(spin >> 2) % NOTE_PICK_LEADS.length];
  const hint = NOTE_PICK_HINTS[(spin >> 4) % NOTE_PICK_HINTS.length];
  const [faqIdx, setFaqIdx] = useState(() => spin % FAQ_POOL.length);
  useEffect(() => {
    const t = window.setInterval(() => setFaqIdx((i) => (i + 1) % FAQ_POOL.length), 4000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <AppLayout onBack={busy ? undefined : onBack} step={4} totalSteps={4}>
      <h2 className="h2" data-screen="pick">{title}</h2>
      <p className="pick-basis">{personal ? lead : '느낌 오는 걸 하나 고르면 돼요'}</p>
      <div className="note-stage">
      <div className="note-grid">
        {notes.map((note, i) => {
          const no = picked.indexOf(note.id) + 1;
          return (
            <NoteCard
              key={note.id}
              note={note}
              faceDown
              index={i}
              teaser={teasers[i]}
              pickNo={no || undefined}
              state={openingId ? (picked.includes(note.id) ? 'opening' : 'dim') : 'idle'}
              onClick={() => toggle(note)}
            />
          );
        })}
      </div>
      <p className="note-fan__hint">
        {picked.length === 0 ? hint : picked.length < 3 ? `${picked.length}장 골랐어요. ${3 - picked.length}장 더` : '세 장 다 골랐어요'}
      </p>
      <span className="note-count" aria-hidden>
        {[0, 1, 2].map((i) => <i key={i} className={i < picked.length ? 'note-count__dot note-count__dot--on' : 'note-count__dot'} />)}
      </span>
      </div>

      {/* 아래는 비워두지 않는다. 어떻게 뽑히는지, 자주 묻는 것 다섯 줄 */}
      <section className="sec faq">
        <div className="sec__head">
          <h2 className="sec__title">이렇게 뽑혀요</h2>
          <span className="faq__count">{faqIdx + 1} / {FAQ_POOL.length}</span>
        </div>
        {/* 한 칸만 보이며 돌아간다. 4초마다 다음, 누르면 바로 다음 */}
        <button type="button" className="faq__card" onClick={() => setFaqIdx((i) => (i + 1) % FAQ_POOL.length)}>
          <span key={faqIdx} className="faq__inner">
            <span className="faq__q">{FAQ_POOL[faqIdx].q}</span>
            <span className="faq__a">{FAQ_POOL[faqIdx].a}</span>
          </span>
          <span className="faq__dots" aria-hidden>
            {FAQ_POOL.map((f, i) => (
              <i key={f.q} className={i === faqIdx ? 'faq__dot faq__dot--on' : 'faq__dot'} />
            ))}
          </span>
        </button>
      </section>

      {/* 제목이 이미 '하나만 골라볼까요' 라고 묻는다. 바닥에 같은 말을 한 번 더
          붙여두면 빈 화면을 메우려는 문장으로 읽힌다. 펼치는 중일 때만 한 줄. */}
      {busy ? <p className="note-hint">쪽지 펼치는 중이에요</p> : null}
    </AppLayout>
  );
}
