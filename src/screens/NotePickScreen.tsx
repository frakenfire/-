import { AppLayout } from '../components/AppLayout.tsx';
import { NoteCard } from '../components/NoteCard.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { NOTE_PICK, NOTE_TEASERS } from '../data/copy.ts';
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
}: Props) {
  const teasers = pickTeasers(`${todayKey()}|${fortuneLabel}`);

  return (
    <AppLayout onBack={busy ? undefined : onBack} step={4} totalSteps={4}>
      {fortuneLabel ? <span className="eyebrow">{fortuneLabel}</span> : null}
      <h2 className="h2" style={{ whiteSpace: 'pre-line' }}>
        {NOTE_PICK.title}
      </h2>
      <p className="lead">{NOTE_PICK.lead}</p>
      {/* 생년월일을 받아놓고 쪽지 후보에 안 쓰면 "그래서 뭐가 달라졌지" 가 된다.
          반영됐다는 사실을 이 자리에서 밝힌다. */}
      {personal ? (
        <p className="pick-basis">오늘 기운에 맞춰<b>내 사주로 고른</b>세 장이에요</p>
      ) : null}

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

      <div className="note-mascot" aria-hidden>
        <Mascot size={96} mood="happy" />
      </div>

      <p className="note-hint note-hint--foot">
        {busy ?'쪽지 펼치는 중이에요…' : '딱 끌리는 쪽지 하나만 콕'}
      </p>
    </AppLayout>
  );
}
