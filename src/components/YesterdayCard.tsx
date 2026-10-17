import { useState } from 'react';
import type { LastNote } from '../lib/storage.ts';

export type Reflection = 'kept' | 'fun' | 'skip';

type Props = {
  note: LastNote;
  onAnswer: (r: Reflection) => void;
};

// 어제의 쪽지 — 다음 날 홈에서 한 번만 묻는다.
// 맞았냐고 묻지 않는다. 적중률처럼 읽히는 순간 이 앱이 하지 않는 약속이 된다.
// 어제 쪽지가 하루에 남았는지만 묻는다. 답하면 고맙다고 하고 접힌다.
export function YesterdayCard({ note, onAnswer }: Props) {
  const [done, setDone] = useState(false);

  function answer(r: Reflection) {
    setDone(true);
    onAnswer(r);
  }

  if (done) {
    return (
      <div className="yday yday--done" role="status">
        <p className="yday__thanks">알려줘서 고마워요. 오늘 쪽지도 열어보세요.</p>
      </div>
    );
  }

  return (
    <div className="yday">
      <div className="yday__top">
        <span className="yday__k">어제의 쪽지</span>
        <button type="button" className="yday__close" onClick={() => answer('skip')}>
          닫기
        </button>
      </div>
      <p className="yday__title">{note.title}</p>
      <p className="yday__do">어제 할 일 · {note.doItem}</p>
      <p className="yday__q">어제 뽑은 쪽지, 기억에 남았나요?</p>
      <div className="yday__answers">
        <button type="button" className="yday__a" onClick={() => answer('kept')}>
          마음에 남았어요
        </button>
        <button type="button" className="yday__a" onClick={() => answer('fun')}>
          재미있게 봤어요
        </button>
      </div>
    </div>
  );
}
