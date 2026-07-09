import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { AdBadge } from '../components/AdNotice';
import { ZODIACS, findZodiac, type ZodiacId } from '../data/zodiac';
import { computeCompat, type CompatResult } from '../lib/compat';

type Props = {
  dateKey: string;
  initialMy: ZodiacId | null;
  onSaveMy: (id: ZodiacId) => void;
  onBack: () => void;
  onAdUnlock: () => Promise<boolean>;
  onShare: (text: string) => Promise<boolean>;
  onToast: (msg: string) => void;
};

const BAND_EMOJI = { best: '💗', good: '🧡', ok: '🤝' } as const;

// 친구 궁합 — 로그인 없이 되는 바이럴 훅. 광고/공유로 잠금 해제.
export function CompatScreen({ dateKey, initialMy, onSaveMy, onBack, onAdUnlock, onShare, onToast }: Props) {
  const [my, setMy] = useState<ZodiacId | null>(initialMy);
  const [friend, setFriend] = useState<ZodiacId | null>(null);
  const [picking, setPicking] = useState<'my' | 'friend' | null>(initialMy ? null : 'my');
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const myZ = my ? findZodiac(my) : null;
  const friendZ = friend ? findZodiac(friend) : null;
  const ready = !!(myZ && friendZ);
  const result: CompatResult | null = ready ? computeCompat(dateKey, my!, friend!) : null;

  function choose(id: ZodiacId) {
    if (picking === 'my') {
      setMy(id);
      onSaveMy(id);
      setPicking(friend ? null : 'friend');
    } else if (picking === 'friend') {
      setFriend(id);
      setPicking(null);
    }
    setUnlocked(false);
  }

  async function unlockByAd() {
    if (busy) return;
    setBusy(true);
    const ok = await onAdUnlock();
    setBusy(false);
    if (ok) setUnlocked(true);
    else onToast('앗, 광고를 못 봤어요');
  }

  async function unlockByShare() {
    if (busy || !myZ || !friendZ) return;
    setBusy(true);
    const invite = `${myZ.emoji}${myZ.label} × ${friendZ.emoji}${friendZ.label}\n오늘 우리 궁합 얼마나 맞을까? 나 방금 봤어 👀\n[오늘쪽지] 친구 궁합에서 너도 확인해봐 💌`;
    const ok = await onShare(invite);
    setBusy(false);
    if (ok) {
      setUnlocked(true);
      onToast('공유 완료! 결과를 열었어요 💌');
    } else {
      onToast('앗, 공유를 못 했어요');
    }
  }

  async function brag() {
    if (!myZ || !friendZ || !result) return;
    const text = `[오늘쪽지] 오늘 우리 궁합 ${result.score}점 💗\n${myZ.emoji}${myZ.label} × ${friendZ.emoji}${friendZ.label}\n"${result.headline}"\n너도 궁합 봐봐 👀`;
    const ok = await onShare(text);
    onToast(ok ? '궁합 자랑 완료! 💌' : '앗, 공유를 못 했어요');
  }

  // 띠 고르는 중
  if (picking) {
    return (
      <AppLayout onBack={picking === 'friend' && !friend ? () => setPicking(null) : onBack} title="친구 궁합">
        <h2 className="h2">{picking === 'my' ? '내 띠는 뭐예요?' : '상대는 무슨 띠예요?'}</h2>
        <p className="lead">띠만 고르면 돼요. 생년월일은 필요 없어요.</p>
        <div className="zodiac-grid zodiac-grid--full">
          {ZODIACS.map((z) => (
            <button key={z.id} type="button" className="zodiac-chip" onClick={() => choose(z.id)}>
              {z.emoji} {z.label}
            </button>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout onBack={onBack} title="친구 궁합">
      <div className="compat-pair">
        <button type="button" className="compat-pick" onClick={() => setPicking('my')}>
          <span className="compat-pick__k">나</span>
          <span className="compat-pick__emoji">{myZ ? myZ.emoji : '＋'}</span>
          <span className="compat-pick__label">{myZ ? myZ.label : '띠 고르기'}</span>
        </button>
        <span className="compat-pair__x">×</span>
        <button type="button" className="compat-pick" onClick={() => setPicking('friend')}>
          <span className="compat-pick__k">상대</span>
          <span className="compat-pick__emoji">{friendZ ? friendZ.emoji : '＋'}</span>
          <span className="compat-pick__label">{friendZ ? friendZ.label : '띠 고르기'}</span>
        </button>
      </div>

      {!ready ? (
        <p className="compat-hint">두 띠를 고르면 오늘의 궁합이 나와요</p>
      ) : !unlocked ? (
        <div className="compat-lock">
          <div className="compat-lock__score">?</div>
          <p className="compat-lock__title">오늘 우리 궁합, 몇 점일까요?</p>
          <div className="btn-stack">
            <button type="button" className="btn btn--primary" disabled={busy} onClick={unlockByShare}>
              공유하고 결과 열기 💌
            </button>
            <button type="button" className="btn btn--unlock" disabled={busy} onClick={unlockByAd}>
              <span className="btn-unlock__top">
                <span className="btn-unlock__main">🔓 광고 보고 결과 열기</span>
                <AdBadge label="광고" />
              </span>
            </button>
          </div>
        </div>
      ) : result ? (
        <>
          <div className={`compat-result compat-result--${result.band} fade-in`}>
            <span className="compat-result__badge">{BAND_EMOJI[result.band]} 오늘의 궁합</span>
            <div className="compat-result__score num">{result.score}<small>점</small></div>
            <p className="compat-result__head">{result.headline}</p>
            <div className="compat-result__lines">
              <div className="compat-line">
                <span className="compat-line__k">잘 맞는 점</span>
                <span className="compat-line__v">{result.good}</span>
              </div>
              <div className="compat-line">
                <span className="compat-line__k">오늘 조심</span>
                <span className="compat-line__v">{result.caution}</span>
              </div>
              <div className="compat-line">
                <span className="compat-line__k">오늘의 팁</span>
                <span className="compat-line__v">{result.tip}</span>
              </div>
            </div>
          </div>
          <div className="btn-stack">
            <button type="button" className="btn btn--primary" onClick={brag}>
              이 궁합 친구한테 자랑하기 💌
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => { setFriend(null); setUnlocked(false); setPicking('friend'); }}>
              다른 사람이랑도 해볼래요
            </button>
          </div>
        </>
      ) : null}
    </AppLayout>
  );
}
