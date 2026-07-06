import { DISCLAIMER } from '../data/copy';

// PRD §5.2 — 필수 고지. 결과 화면 하단에 항상 노출한다.
export function Disclaimer() {
  return <p className="disclaimer">{DISCLAIMER}</p>;
}
