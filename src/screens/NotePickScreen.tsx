import { AppLayout } from '../components/AppLayout.tsx';
import { NoteCard } from '../components/NoteCard.tsx';
import { NOTE_TEASERS, NOTE_PICK_TITLES, NOTE_PICK_LEADS, NOTE_PICK_HINTS, FAQ_POOL } from '../data/copy.ts';
import { todayKey, hashSeed } from '../lib/dateSeed.ts';
import type { Note } from '../types/fortune.ts';

// 3장에 서로 다른 문구를 준다. 날짜가 바뀌면 조합도 바뀌고, 같은 날엔 고정.
function pickTeasers(seedKey: string): string[] {
  const pool = [...NOTE_TEASERS];
  const out: string[] = [];
  for (let i = 0; i < 3; i += 1) {
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
  onPick: (note: Note) => void;
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
  const title = NOTE_PICK_TITLES[spin % NOTE_PICK_TITLES.length];
  const lead = NOTE_PICK_LEADS[(spin >> 2) % NOTE_PICK_LEADS.length];
  const hint = NOTE_PICK_HINTS[(spin >> 4) % NOTE_PICK_HINTS.length];
  const FAQ = Array.from({ length: 5 }, (_, i) => FAQ_POOL[(spin + i * 3) % FAQ_POOL.length]);

  return (
    <AppLayout onBack={busy ? undefined : onBack} step={2} totalSteps={3}>
      <h2 className="h2" data-screen="pick">{title}</h2>
      <p className="pick-basis">{personal ? lead : '느낌 오는 걸 하나 고르면 돼요'}</p>
      <div className="note-stage">
      <div className={openingId ? "note-fan note-fan--opening" : "note-fan"}>
      <div className="note-row">
        {notes.map((note, i) => (
          <NoteCard
            key={note.id}
            note={note}
            faceDown
            index={i}
            teaser={teasers[i]}
            state={
              openingId
                ? openingId === note.id
                  ? 'opening'
                  : 'dim'
                : 'idle'
            }
            onClick={() => !busy && onPick(note)}
          />
        ))}
      </div>
      </div>
      <p className="note-fan__hint">{hint}</p>
      </div>

      {/* 아래는 비워두지 않는다. 어떻게 뽑히는지, 자주 묻는 것 다섯 줄 */}
      <section className="sec faq">
        <div className="sec__head">
          <h2 className="sec__title">이렇게 뽑혀요</h2>
        </div>
        <ul className="faq__list">
          {FAQ.map((f) => (
            <li key={f.q} className="faq__row">
              <span className="faq__q">{f.q}</span>
              <span className="faq__a">{f.a}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 제목이 이미 '하나만 골라볼까요' 라고 묻는다. 바닥에 같은 말을 한 번 더
          붙여두면 빈 화면을 메우려는 문장으로 읽힌다. 펼치는 중일 때만 한 줄. */}
      {busy ? <p className="note-hint">쪽지 펼치는 중이에요</p> : null}
    </AppLayout>
  );
}
