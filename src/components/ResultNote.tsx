type Props = {
  icon: string;
  title: string;
  subtitle: string;
  summaryLines: string[];
};

// PRD §5.4 — 무료 결과 쪽지(열린 상태). 광고 없이 즉시 3줄 제공.
export function ResultNote({ icon, title, subtitle, summaryLines }: Props) {
  return (
    <div className="result-note fade-in">
      <div className="result-note__head">
        <span className="result-note__seal" aria-hidden>
          {icon}
        </span>
        <span>
          <span className="result-note__subtitle">{subtitle}</span>
          <br />
          <span className="result-note__title">{title}</span>
        </span>
      </div>
      <p className="result-note__summary">{summaryLines.join('\n')}</p>
    </div>
  );
}
