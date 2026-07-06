import { AppLayout } from '../components/AppLayout';
import { NoteCard } from '../components/NoteCard';
import { NOTE_PICK } from '../data/copy';
import type { Note } from '../types/fortune';

type Props = {
  notes: Note[];
  busy: boolean;
  fortuneLabel: string;
  onPick: (note: Note) => void;
  onBack: () => void;
};

// PRD §5.3 — 접힌 쪽지 3장 중 1장 선택.
export function NotePickScreen({ notes, busy, fortuneLabel, onPick, onBack }: Props) {
  return (
    <AppLayout onBack={onBack} step={1} totalSteps={2}>
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
            onClick={() => !busy && onPick(note)}
          />
        ))}
      </div>

      <p className="note-hint">세 장 중 마음이 가는 쪽지를 눌러보세요 ✨</p>

      {busy ? (
        <p
          className="lead"
          style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}
        >
          쪽지를 펼치는 중이에요…
        </p>
      ) : null}
    </AppLayout>
  );
}
