import type { CSSProperties } from 'react';
import type { Note } from '../types/fortune';
import { NOTE_COLOR_CLASS } from '../data/notes';

type Props = {
  note: Note;
  /** 뽑기 전(접힘)이면 내용을 숨긴다 */
  faceDown?: boolean;
  index?: number;
  /** idle: 대기 · opening: 선택돼 펼쳐짐 · dim: 다른 쪽지 선택됨 */
  state?: 'idle' | 'opening' | 'dim';
  onClick?: () => void;
};

// PRD §5.3 — 접힌 쪽지. 기울인 배치 + 순차 등장, 선택 시 펼쳐지는 모션.
export function NoteCard({ note, faceDown, index = 0, state = 'idle', onClick }: Props) {
  const tilt = [-4, 0, 4][index % 3];
  const opening = state === 'opening';
  return (
    <button
      type="button"
      className={`note ${NOTE_COLOR_CLASS[note.color]} note--${state}`}
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
        {opening ? '💌' : faceDown ? '✉️' : note.icon}
      </span>
      <span className="note__hint">{opening ? '두근두근' : faceDown ? '쪽지' : note.name}</span>
    </button>
  );
}
