import { AppLayout } from '../components/AppLayout';
import { NoteCard } from '../components/NoteCard';
import { Mascot } from '../components/Mascot';
import { NOTE_PICK } from '../data/copy';
import type { Note } from '../types/fortune';

type Props = {
  notes: Note[];
  busy: boolean;
  openingId?: string;
  fortuneLabel: string;
  onPick: (note: Note) => void;
  onBack: () => void;
};

// PRD §5.3 — 접힌 쪽지 3장 중 1장 선택. 선택 시 해당 쪽지가 펼쳐지는 모션.
export function NotePickScreen({
  notes,
  busy,
  openingId,
  fortuneLabel,
  onPick,
  onBack,
}: Props) {
  return (
    <AppLayout onBack={busy ? undefined : onBack} step={1} totalSteps={2}>
      {fortuneLabel ? <span className="eyebrow">{fortuneLabel}</span> : null}
      <h2 className="h2" style={{ whiteSpace: 'pre-line' }}>
        {NOTE_PICK.title}
      </h2>
      <p className="lead">{NOTE_PICK.lead}</p>

      <div className="note-row">
        {notes.map((note, i) => (
          <NoteCard
            key={note.id}
            note={note}
            faceDown
            index={i}
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
        {busy ? '쪽지 펼치는 중이에요…' : '딱 끌리는 쪽지 하나만 콕 🙂'}
      </p>
    </AppLayout>
  );
}
