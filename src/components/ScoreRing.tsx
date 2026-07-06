import { scoreColor } from '../lib/luck';

type Props = {
  score: number;
  grade: string;
  caption?: string;
  size?: number;
};

// 총운 점수 링 게이지 (포스텔러식 그래프 시각화). 큰 볼드 숫자 = 토스 스타일.
export function ScoreRing({ score, grade, caption = '오늘의 총운', size = 168 }: Props) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * c;
  const color = scoreColor(score);

  return (
    <div className="score-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--gray-100)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-ring__center">
        <span className="score-ring__caption">{caption}</span>
        <span className="score-ring__value" style={{ color }}>
          {score}
          <span className="score-ring__unit">점</span>
        </span>
        <span className="score-ring__grade" style={{ color }}>
          {grade}
        </span>
      </div>
    </div>
  );
}
