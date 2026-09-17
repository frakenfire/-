import { Icon } from './Icon.tsx';
import { Mascot } from './Mascot.tsx';
import type { Note } from '../types/fortune.ts';
import { NOTE_COLOR_CLASS } from '../data/notes.ts';

type Props = {
  note: Note;
  /** 뽑기 전(접힘)이면 내용을 숨긴다 */
  faceDown?: boolean;
  index?: number;
  /** idle: 대기 · opening: 선택돼 펼쳐짐 · dim: 다른 쪽지 선택됨 */
  state?: 'idle' | 'opening' | 'dim';
  /** 접힌 상태에서 보여줄 한 줄 (3장이 서로 다른 문구를 갖는다) */
  teaser?: string;
  /** 뽑은 순서(1~3). 있으면 카드가 들리고 번호가 붙는다 */
  onClick?: () => void;
};

// 접힌 쪽지. 순차 등장, 고르면 펼쳐지는 모션.
//
// 예전엔 장마다 몇 도씩 기울여 뒀다. 부채꼴로 겹쳐 놓을 때 쓰던 장치인데,
// 지금처럼 격자에 세우면 기울어진 장만 자리를 더 차지해서 줄이 안 맞아 보인다.
export function NoteCard({ note, faceDown, index = 0, state = 'idle', teaser, onClick }: Props) {
  const opening = state === 'opening';
  return (
    <button
      type="button"
      /* 접힌 쪽지는 셋 다 같은 종이여야 한다. 색이 다르면 뒤집기 전부터
         서로 다른 것이 보여서, 고르는 게 아니라 색을 고르는 일이 된다. */
      className={`note ${faceDown ? 'note--paper note--facedown' : NOTE_COLOR_CLASS[note.color]} note--${state}`}
      onClick={onClick}
      aria-label={faceDown ? '쪽지 뽑기' : `${note.name} 쪽지`}
    >
      <span className="note__seal" aria-hidden>
        {opening ? (
          <Mascot size={40} mood="grin" bare />
        ) : faceDown ? (
          <Mascot size={40} mood={(['happy', 'calm', 'happy'] as const)[index % 3]} bare />
        ) : (
          <Icon name={note.icon} size={26} />
        )}
      </span>
      <span className="note__hint">
        {opening ? '여는 중' : faceDown ? (teaser ?? '쪽지') : note.name}
      </span>
    </button>
  );
}
