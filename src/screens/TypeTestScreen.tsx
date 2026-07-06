import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Mascot } from '../components/Mascot';
import { QUESTIONS, computeNoteType } from '../data/noteTypes';
import type { NoteType } from '../data/noteTypes';

type Props = {
  onDone: (type: NoteType) => void;
  onBack: () => void;
};

// 쪽지 유형 테스트 — 쉬운 질문 4개(낮은 허들), 답할 때마다 바로 다음으로.
export function TypeTestScreen({ onDone, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const q = QUESTIONS[step];

  function answer(a: boolean) {
    const next = [...answers, a];
    if (next.length === QUESTIONS.length) {
      onDone(computeNoteType(next));
    } else {
      setAnswers(next);
      setStep(step + 1);
    }
  }

  return (
    <AppLayout onBack={onBack} step={step + 1} totalSteps={QUESTIONS.length}>
      <span className="eyebrow">
        🥐 나는 무슨 빵? · {step + 1}/{QUESTIONS.length}
      </span>
      <h2 className="h2" style={{ whiteSpace: 'pre-line' }}>
        {q.q}
      </h2>

      <div className="choice-stack">
        <button type="button" className="choice-big" onClick={() => answer(true)}>
          {q.a}
        </button>
        <button type="button" className="choice-big" onClick={() => answer(false)}>
          {q.b}
        </button>
      </div>

      <div className="test-mascot" aria-hidden>
        <Mascot size={96} mood="happy" />
      </div>
    </AppLayout>
  );
}
