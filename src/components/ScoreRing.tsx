import { useEffect, useRef, useState } from 'react';
import { scoreColor } from '../lib/luck';

type Props = {
  score: number;
  grade: string;
  caption?: string;
  size?: number;
};

// 총운 점수 링 게이지 — 0부터 점수까지 차오르는 카운트업 연출.
// 숫자가 올라가는 순간의 기대감이 결과 몰입도를 높인다.
export function ScoreRing({ score, grade, caption = '오늘의 총운', size = 168 }: Props) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const color = scoreColor(score);

  const [shown, setShown] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const DURATION = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setShown(Math.round(clamped * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [clamped]);

  const dash = (shown / 100) * c;
  const done = shown >= clamped;

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
          {shown}
          <span className="score-ring__unit">점</span>
        </span>
        <span
          className={done ? 'score-ring__grade score-ring__grade--pop' : 'score-ring__grade'}
          style={{ color, opacity: done ? 1 : 0 }}
        >
          {grade}
        </span>
      </div>
    </div>
  );
}
