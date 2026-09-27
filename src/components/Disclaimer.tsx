import { DISCLAIMER } from '../data/copy.ts';
import { Sentences } from './Sentences.tsx';

// PRD §5.2 — 필수 고지. 결과 화면 하단에 항상 노출한다.
export function Disclaimer() {
  return <Sentences className="disclaimer" text={DISCLAIMER} />;
}
