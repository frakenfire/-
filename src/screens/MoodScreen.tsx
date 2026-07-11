import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { MOODS } from '../data/letterFragments';
import { ZODIACS, type Zodiac, type ZodiacId } from '../data/zodiac';
import { STAR_SIGNS, type StarSign, type StarSignId } from '../data/starSign';
import type { Mood } from '../types/fortune';

type Props = {
  fortuneLabel: string;
  zodiac: Zodiac | null;
  star: StarSign | null;
  onPickZodiac: (id: ZodiacId) => void;
  onPickStar: (id: StarSignId) => void;
  onSelect: (m: Mood) => void;
  onBack: () => void;
};

// 지금 나 = 기분 + 띠 + 별자리. 세 개를 조합해 '나에게 딱 맞는' 쪽지를 만든다.
// (띠/별자리만으론 12분의 1이라 뻔하니, 기분까지 더해 720가지로 좁힌다.)
export function MoodScreen({
  fortuneLabel,
  zodiac,
  star,
  onPickZodiac,
  onPickStar,
  onSelect,
  onBack,
}: Props) {
  const [open, setOpen] = useState<'zodiac' | 'star' | null>(null);

  return (
    <AppLayout onBack={onBack} step={1} totalSteps={2}>
      {fortuneLabel ? <span className="eyebrow">{fortuneLabel}</span> : null}
      <h2 className="h2">쪽지를 쓰기 전에, 지금 나는?</h2>
      <p className="lead">기분 · 띠 · 별자리를 고르면 나에게 딱 맞는 쪽지가 나와요.</p>

      {/* 내 띠 · 별자리 (눌러서 고르기 — 결과에 반영) */}
      <div className="me-picks">
        <button
          type="button"
          className={open === 'zodiac' ? 'me-pick me-pick--on' : 'me-pick'}
          onClick={() => setOpen((v) => (v === 'zodiac' ? null : 'zodiac'))}
        >
          <span className="me-pick__k">내 띠</span>
          <span className="me-pick__v">
            {zodiac ? `${zodiac.emoji} ${zodiac.label}` : '고르기'}
            <span className="me-pick__chev" aria-hidden> ▾</span>
          </span>
        </button>
        <button
          type="button"
          className={open === 'star' ? 'me-pick me-pick--on' : 'me-pick'}
          onClick={() => setOpen((v) => (v === 'star' ? null : 'star'))}
        >
          <span className="me-pick__k">내 별자리</span>
          <span className="me-pick__v">
            {star ? `${star.emoji} ${star.label}` : '고르기'}
            <span className="me-pick__chev" aria-hidden> ▾</span>
          </span>
        </button>
      </div>

      {open === 'zodiac' ? (
        <div className="zodiac-grid zodiac-grid--full me-grid">
          {ZODIACS.map((z) => (
            <button
              key={z.id}
              type="button"
              className="zodiac-chip"
              onClick={() => {
                onPickZodiac(z.id);
                setOpen(null);
              }}
            >
              {z.emoji} {z.label}
            </button>
          ))}
        </div>
      ) : null}
      {open === 'star' ? (
        <div className="zodiac-grid zodiac-grid--full me-grid">
          {STAR_SIGNS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="zodiac-chip"
              onClick={() => {
                onPickStar(s.id);
                setOpen(null);
              }}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      ) : null}

      <p className="mood-heading">지금 기분은 어때요?</p>
      <div className="mood-grid">
        {MOODS.map((m) => (
          <button key={m.key} type="button" className="mood-btn" onClick={() => onSelect(m.key)}>
            <span className="mood-btn__emoji" aria-hidden>
              {m.emoji}
            </span>
            <span className="mood-btn__label">{m.label}</span>
          </button>
        ))}
      </div>
      <p className="mood-foot">기분을 고르면 바로 쪽지를 뽑아요</p>
    </AppLayout>
  );
}
