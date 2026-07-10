import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { AdBadge } from '../components/AdNotice';
import { ZODIACS, findZodiac, type ZodiacId } from '../data/zodiac';
import { STAR_SIGNS, findStarSign, type StarSignId } from '../data/starSign';
import { computeCompat, type CompatResult } from '../lib/compat';
import { computeStarCompat } from '../lib/starCompat';

type Mode = 'zodiac' | 'star';

type Props = {
  dateKey: string;
  initialMyZodiac: ZodiacId | null;
  initialMyStar: StarSignId | null;
  onSaveMyZodiac: (id: ZodiacId) => void;
  onSaveMyStar: (id: StarSignId) => void;
  onBack: () => void;
  onAdUnlock: () => Promise<boolean>;
  onShare: (text: string) => Promise<boolean>;
  onToast: (msg: string) => void;
};

const BAND_EMOJI = { best: '💗', good: '🧡', ok: '🤝' } as const;

// 친구 궁합 — 로그인 없이 되는 바이럴 훅. 띠/별자리 두 방식 지원(광고/공유로 잠금 해제).
export function CompatScreen({
  dateKey,
  initialMyZodiac,
  initialMyStar,
  onSaveMyZodiac,
  onSaveMyStar,
  onBack,
  onAdUnlock,
  onShare,
  onToast,
}: Props) {
  const [mode, setMode] = useState<Mode>('zodiac');

  const [myZodiac, setMyZodiac] = useState<ZodiacId | null>(initialMyZodiac);
  const [friendZodiac, setFriendZodiac] = useState<ZodiacId | null>(null);
  const [myStar, setMyStar] = useState<StarSignId | null>(initialMyStar);
  const [friendStar, setFriendStar] = useState<StarSignId | null>(null);

  // 아직 내 띠(기본 모드)가 없으면 바로 선택 화면부터 열어 탭 한 번을 줄인다.
  const [picking, setPicking] = useState<'my' | 'friend' | null>(initialMyZodiac ? null : 'my');
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const my = mode === 'zodiac' ? myZodiac : myStar;
  const friend = mode === 'zodiac' ? friendZodiac : friendStar;
  const myLabel = mode === 'zodiac' ? findZodiac(myZodiac ?? '') : findStarSign(myStar ?? '');
  const friendLabel = mode === 'zodiac' ? findZodiac(friendZodiac ?? '') : findStarSign(friendStar ?? '');
  const ready = !!(my && friend);
  const result: CompatResult | null = ready
    ? mode === 'zodiac'
      ? computeCompat(dateKey, myZodiac!, friendZodiac!)
      : computeStarCompat(dateKey, myStar!, friendStar!)
    : null;

  const options = mode === 'zodiac' ? ZODIACS : STAR_SIGNS;
  const modeLabel = mode === 'zodiac' ? '띠' : '별자리';

  function switchMode(next: Mode) {
    setMode(next);
    setUnlocked(false);
    setPicking(null);
  }

  function choose(id: string) {
    if (picking === 'my') {
      if (mode === 'zodiac') {
        setMyZodiac(id as ZodiacId);
        onSaveMyZodiac(id as ZodiacId);
      } else {
        setMyStar(id as StarSignId);
        onSaveMyStar(id as StarSignId);
      }
      setPicking(friend ? null : 'friend');
    } else if (picking === 'friend') {
      if (mode === 'zodiac') setFriendZodiac(id as ZodiacId);
      else setFriendStar(id as StarSignId);
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
    if (busy || !myLabel || !friendLabel) return;
    setBusy(true);
    const invite = `${myLabel.emoji}${myLabel.label} × ${friendLabel.emoji}${friendLabel.label}\n오늘 우리 ${modeLabel} 궁합 얼마나 맞을까? 나 방금 봤어 👀\n[오늘쪽지] 친구 궁합에서 너도 확인해봐 💌`;
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
    if (!myLabel || !friendLabel || !result) return;
    const text = `[오늘쪽지] 오늘 우리 ${modeLabel} 궁합 ${result.score}점 💗\n${myLabel.emoji}${myLabel.label} × ${friendLabel.emoji}${friendLabel.label}\n"${result.headline}"\n너도 궁합 봐봐 👀`;
    const ok = await onShare(text);
    onToast(ok ? '궁합 자랑 완료! 💌' : '앗, 공유를 못 했어요');
  }

  // 띠/별자리 고르는 중
  if (picking) {
    return (
      <AppLayout
        onBack={picking === 'friend' && !friend ? () => setPicking(null) : onBack}
        title="친구 궁합"
        center
      >
        <h2 className="h2">
          {picking === 'my' ? `내 ${modeLabel}는 뭐예요?` : `상대는 무슨 ${modeLabel}예요?`}
        </h2>
        <p className="lead">
          {modeLabel}만 고르면 돼요. 생년월일은 필요 없어요.
        </p>
        <div className="zodiac-grid zodiac-grid--full">
          {options.map((z) => (
            <button key={z.id} type="button" className="zodiac-chip" onClick={() => choose(z.id)}>
              {z.emoji} {z.label}
            </button>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout onBack={onBack} title="친구 궁합" center={!unlocked}>
      <div className="seg-tabs">
        <button
          type="button"
          className={mode === 'zodiac' ? 'seg-tab seg-tab--on' : 'seg-tab'}
          onClick={() => switchMode('zodiac')}
        >
          🐭 띠 궁합
        </button>
        <button
          type="button"
          className={mode === 'star' ? 'seg-tab seg-tab--on' : 'seg-tab'}
          onClick={() => switchMode('star')}
        >
          ⭐ 별자리 궁합
        </button>
      </div>

      <div className="compat-pair">
        <button type="button" className="compat-pick" onClick={() => setPicking('my')}>
          <span className="compat-pick__k">나</span>
          <span className="compat-pick__emoji">{myLabel ? myLabel.emoji : '＋'}</span>
          <span className="compat-pick__label">{myLabel ? myLabel.label : `${modeLabel} 고르기`}</span>
        </button>
        <span className="compat-pair__x">×</span>
        <button type="button" className="compat-pick" onClick={() => setPicking('friend')}>
          <span className="compat-pick__k">상대</span>
          <span className="compat-pick__emoji">{friendLabel ? friendLabel.emoji : '＋'}</span>
          <span className="compat-pick__label">{friendLabel ? friendLabel.label : `${modeLabel} 고르기`}</span>
        </button>
      </div>

      {!ready ? (
        <p className="compat-hint">두 {modeLabel}를 고르면 오늘의 궁합이 나와요</p>
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
            <span className="compat-result__badge">{BAND_EMOJI[result.band]} 오늘의 {modeLabel} 궁합</span>
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
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                if (mode === 'zodiac') setFriendZodiac(null);
                else setFriendStar(null);
                setUnlocked(false);
                setPicking('friend');
              }}
            >
              다른 사람이랑도 해볼래요
            </button>
          </div>
        </>
      ) : null}
    </AppLayout>
  );
}
