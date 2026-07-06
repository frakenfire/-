import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Disclaimer } from '../components/Disclaimer';
import { NOTE_TYPES, NOTE_TYPE_LIST, computeCompat } from '../data/noteTypes';
import type { NoteType, NoteTypeId } from '../data/noteTypes';

type Props = {
  type: NoteType;
  onShare: (type: NoteType) => void;
  onRetake: () => void;
  onHome: () => void;
};

// 유형 결과 카드 — "예쁘다"가 공유의 조건. 궁합(2인 참여)으로 친구를 끌어온다.
export function TypeResultScreen({ type, onShare, onRetake, onHome }: Props) {
  const [friendType, setFriendType] = useState<NoteTypeId | null>(null);
  const compat = friendType ? computeCompat(type.id, friendType) : null;
  const best = NOTE_TYPES[type.bestMatch];
  const spark = NOTE_TYPES[type.sparkMatch];

  return (
    <AppLayout onBack={onHome} title="내 동물 유형">
      {/* 유형 카드 */}
      <div className="type-card fade-in">
        <span className="type-card__emoji" aria-hidden>
          {type.emoji}
        </span>
        <p className="type-card__label">나의 본체는…</p>
        <h2 className="type-card__name">{type.name}</h2>
        <p className="type-card__tagline">{type.tagline}</p>
        <div className="type-card__traits">
          {type.traits.map((t) => (
            <span className="type-trait" key={t}>
              #{t}
            </span>
          ))}
        </div>
        <p className="type-card__cheer">“{type.cheer}”</p>
      </div>

      {/* 잘 맞는 동물 */}
      <div className="card">
        <p className="section-title">나랑 잘 맞는 동물</p>
        <div className="match-row">
          <div className="match-cell">
            <span className="match-cell__emoji" aria-hidden>
              {best.emoji}
            </span>
            <span className="match-cell__label">운명의 단짝</span>
            <span className="match-cell__name">{best.name}</span>
          </div>
          <div className="match-cell">
            <span className="match-cell__emoji" aria-hidden>
              {spark.emoji}
            </span>
            <span className="match-cell__label">톰과 제리 케미</span>
            <span className="match-cell__name">{spark.name}</span>
          </div>
        </div>
      </div>

      {/* 친구 동물 궁합 — 2인 참여 엔진 */}
      <div className="card">
        <p className="section-title">친구랑 동물 궁합 보기</p>
        <p className="lead" style={{ fontSize: 14, marginBottom: 12 }}>
          친구는 무슨 동물이에요? 모르면 지금 물어봐요 👀
        </p>
        <div className="type-grid">
          {NOTE_TYPE_LIST.map((t) => (
            <button
              key={t.id}
              type="button"
              className={
                friendType === t.id ? 'type-chip type-chip--on' : 'type-chip'
              }
              onClick={() => setFriendType(t.id)}
            >
              <span aria-hidden>{t.emoji}</span> {t.short}
            </button>
          ))}
        </div>

        {compat && friendType ? (
          <div className="compat-box fade-in" key={friendType}>
            <p className="compat-box__score">
              {type.emoji}×{NOTE_TYPES[friendType].emoji}{' '}
              <b>{compat.score}점</b> · {compat.title}
            </p>
            <p className="compat-box__comment">{compat.comment}</p>
          </div>
        ) : null}
      </div>

      <div className="btn-stack">
        <button type="button" className="btn btn--primary" onClick={() => onShare(type)}>
          내 본체 자랑하기 🐾
        </button>
        <button type="button" className="btn btn--secondary" onClick={onHome}>
          오늘의 쪽지 뽑으러 가기
        </button>
        <button type="button" className="btn btn--ghost" onClick={onRetake}>
          다시 해볼래요
        </button>
      </div>

      <Disclaimer />
    </AppLayout>
  );
}
