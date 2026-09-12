import { AppLayout } from '../components/AppLayout.tsx';
import { NoteCard } from '../components/NoteCard.tsx';
import { NOTE_TEASERS } from '../data/copy.ts';
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
    <AppLayout onBack={busy ? undefined : onBack} step={2} totalSteps={3}>
      <h2 className="h2">쪽지 하나를 골라요</h2>
      {personal ? <p className="pick-basis">오늘 기운과 <b>내 사주</b>에 맞춰 골라뒀어요</p> : null}
      <div className="note-stage">
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

      {/* 제목이 이미 '하나만 골라볼까요' 라고 묻는다. 바닥에 같은 말을 한 번 더
          붙여두면 빈 화면을 메우려는 문장으로 읽힌다. 펼치는 중일 때만 한 줄. */}
      {busy ? <p className="note-hint">쪽지 펼치는 중이에요</p> : null}
    </AppLayout>
  );
}
