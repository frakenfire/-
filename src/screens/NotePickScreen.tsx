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
// 자주 묻는 것. 설득이 아니라 작동 방식만 말한다.
const FAQ = [
  { q: '세 장은 어떻게 골라지나요?', a: '오늘 날짜와 내 사주에 맞춰 골라요. 같은 날엔 같은 세 장이에요.' },
  { q: '어떤 걸 눌러도 되나요?', a: '네. 셋 다 오늘 나에게 맞는 쪽지예요. 느낌 오는 걸 눌러요.' },
  { q: '매일 바뀌나요?', a: '자정이 지나면 새 쪽지 세 장이 와요.' },
  { q: '하루에 몇 번 뽑나요?', a: '한 번이 기본이에요. 결과에서 하나 더 열 수 있어요.' },
  { q: '내 정보는 어디에 있나요?', a: '이 폰에만 있어요. 서버로 보내지 않아요.' },
];

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
      <div className="note-pouch">
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
      <p className="note-pouch__hint">하나를 톡 눌러요</p>
      </div>
      </div>

      {/* 아래는 비워두지 않는다. 어떻게 뽑히는지, 자주 묻는 것 다섯 줄 */}
      <section className="sec faq">
        <div className="sec__head">
          <h2 className="sec__title">이렇게 뽑혀요</h2>
        </div>
        <ul className="faq__list">
          {FAQ.map((f) => (
            <li key={f.q} className="faq__row">
              <span className="faq__q">{f.q}</span>
              <span className="faq__a">{f.a}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 제목이 이미 '하나만 골라볼까요' 라고 묻는다. 바닥에 같은 말을 한 번 더
          붙여두면 빈 화면을 메우려는 문장으로 읽힌다. 펼치는 중일 때만 한 줄. */}
      {busy ? <p className="note-hint">쪽지 펼치는 중이에요</p> : null}
    </AppLayout>
  );
}
