import type { Note } from '../types/fortune';
import { NOTE_COLOR_CLASS } from '../data/notes';

type Props = {
  note: Note;
  /** 뽑기 전(접힘)이면 내용을 숨긴다 */
  faceDown?: boolean;
  onClick?: () => void;
};

// PRD §5.3 — 접힌 쪽지. 문구는 뽑은 뒤 공개, 접힘 상태엔 작은 아이콘만.
export function NoteCard({ note, faceDown, onClick }: Props) {
  return (
    <button
      type="button"
      className={`note ${NOTE_COLOR_CLASS[note.color]}`}
      onClick={onClick}
      aria-label={faceDown ? '쪽지 뽑기' : `${note.name} 쪽지`}
    >
      <span className="note__seal" aria-hidden>
        {faceDown ? '✉️' : note.icon}
      </span>
      <span className="note__hint">{faceDown ? '쪽지' : note.name}</span>
    </button>
  );
}
