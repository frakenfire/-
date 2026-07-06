import { AppLayout } from '../components/AppLayout';
import { NoteCard } from '../components/NoteCard';
import { NOTE_PICK } from '../data/copy';
import type { Note } from '../types/fortune';

type Props = {
  notes: Note[];
  busy: boolean;
  onPick: (note: Note) => void;
  onBack: () => void;
};

// PRD §5.3 — 접힌 쪽지 3장 중 1장 선택.
export function NotePickScreen({ notes, busy, onPick, onBack }: Props) {
  return (
    <AppLayout onBack={onBack} step={2} totalSteps={3}>
      <span className="eyebrow">쪽지 뽑기</span>
      <h2 className="h2" style={{ whiteSpace: 'pre-line' }}>
        {NOTE_PICK.title}
      </h2>
      <p className="lead">{NOTE_PICK.lead}</p>

      <div className="note-row">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            faceDown
            onClick={() => !busy && onPick(note)}
          />
        ))}
      </div>

      {busy ? (
        <p
          className="lead"
          style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}
        >
          쪽지를 펼치는 중이에요…
        </p>
      ) : null}
    </AppLayout>
  );
}
