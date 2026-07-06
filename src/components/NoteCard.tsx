import type { CSSProperties } from 'react';
import type { Note } from '../types/fortune';
import { NOTE_COLOR_CLASS } from '../data/notes';

type Props = {
  note: Note;
  /** 뽑기 전(접힘)이면 내용을 숨긴다 */
  faceDown?: boolean;
  index?: number;
  onClick?: () => void;
};

// PRD §5.3 — 접힌 쪽지. 살짝 기울인 배치 + 순차 등장으로 뽑는 재미를 준다.
export function NoteCard({ note, faceDown, index = 0, onClick }: Props) {
  const tilt = [-4, 0, 4][index % 3];
  return (
    <button
      type="button"
      className={`note ${NOTE_COLOR_CLASS[note.color]}`}
      style={
        {
          '--tilt': `${tilt}deg`,
          animationDelay: `${index * 80}ms`,
        } as CSSProperties
      }
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
