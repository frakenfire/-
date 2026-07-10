import { useMemo, useState } from 'react';
import type { FortuneResult, FortuneType, Mood, Note } from './types/fortune';
import { NOTES } from './data/notes';
import { FORTUNE_LABEL } from './data/fortuneTypes';
import { hashSeed, pickBySeed, todayKey } from './lib/dateSeed';
import { generateFortune } from './lib/generateFortune';
import { luckPercentile } from './lib/luck';
import {
  showInterstitialBeforeResult,
  showRewardAdForCompat,
  showRewardAdForDetail,
  showRewardAdForRetry,
  showRewardAdForSaveImage,
} from './lib/ads';
import { shareOrCopy, shareText, copyText } from './lib/share';
import { saveResultCard } from './lib/saveImage';
import {
  incrementDailyDrawCount,
  loadResult,
  loadTodayReading,
  markVisit,
  saveResult,
  saveTodayReading,
  updateStreak,
} from './lib/storage';
import { findNote } from './data/notes';
import { findZodiac } from './data/zodiac';
import type { Zodiac, ZodiacId } from './data/zodiac';
import { findStarSign } from './data/starSign';
import type { StarSign, StarSignId } from './data/starSign';
import { loadMyZodiac, saveMyZodiac, loadMyStarSign, saveMyStarSign } from './lib/storage';

import { HomeScreen } from './screens/HomeScreen';
import { MoodScreen } from './screens/MoodScreen';
import { NotePickScreen } from './screens/NotePickScreen';
import { RevealScreen } from './screens/RevealScreen';
import { ResultScreen } from './screens/ResultScreen';
import { DetailResultScreen } from './screens/DetailResultScreen';
import { CompatScreen } from './screens/CompatScreen';

type ScreenName = 'home' | 'mood' | 'pick' | 'reveal' | 'result' | 'detail' | 'compat';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [fortuneType, setFortuneType] = useState<FortuneType | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [drawNonce, setDrawNonce] = useState(0);

  const dateKey = useMemo(() => todayKey(), []);
  const yesterdayKey = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return todayKey(y);
  }, []);
  const streak = useMemo(
    () => updateStreak(dateKey, yesterdayKey),
    [dateKey, yesterdayKey],
  );

  const yesterdayRecord = useMemo(() => {
    const r = loadResult();
    return r && r.dateKey === yesterdayKey ? r : null;
  }, [yesterdayKey]);

  const shownNotes = useMemo(() => {
    const seed = hashSeed(`${dateKey}#${drawNonce}`);
    return pickBySeed(NOTES, 3, seed);
  }, [dateKey, drawNonce]);

  // 결과는 뽑는 순간 한 번만 생성 (편지 조합의 직전 회피 로직이 재계산에 영향받지 않도록)
  const [result, setResult] = useState<FortuneResult | null>(null);

  // 오늘 이미 받은 편지 (다시 읽기용 스냅샷)
  const [todayReading, setTodayReading] = useState(() => loadTodayReading(todayKey()));

  // 내 띠 (띠별 한 줄용, 선택형 값)
  const [zodiac, setZodiac] = useState<Zodiac | null>(() => {
    const id = loadMyZodiac();
    return id ? (findZodiac(id) ?? null) : null;
  });

  // 내 별자리 (별자리별 한 줄용, 선택형 값 — 생년월일 아님)
  const [starSign, setStarSign] = useState<StarSign | null>(() => {
    const id = loadMyStarSign();
    return id ? (findStarSign(id) ?? null) : null;
  });

  function handleZodiac(id: ZodiacId) {
    const z = findZodiac(id);
    if (!z) return;
    saveMyZodiac(id);
    setZodiac(z);
    flash(`${z.emoji} ${z.label}의 한 줄이 매일 홈에 떠요`);
  }

  function handleStarSign(id: StarSignId) {
    const s = findStarSign(id);
    if (!s) return;
    saveMyStarSign(id);
    setStarSign(s);
    flash(`${s.emoji} ${s.label}의 한 줄이 매일 홈에 떠요`);
  }

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  }

  function handleType(t: FortuneType) {
    markVisit(dateKey);
    setFortuneType(t);
    setScreen('mood');
  }

  function handleMood(m: Mood) {
    setMood(m);
    setScreen('pick');
  }

  function handleSaveMyZodiac(id: ZodiacId) {
    const z = findZodiac(id);
    if (!z) return;
    saveMyZodiac(id);
    setZodiac(z);
  }

  function handleSaveMyStarSign(id: StarSignId) {
    const s = findStarSign(id);
    if (!s) return;
    saveMyStarSign(id);
    setStarSign(s);
  }

  async function handlePick(picked: Note) {
    if (busy || !fortuneType || !mood) return;
    setNote(picked);
    setBusy(true);
    const generated = generateFortune({ fortuneType, note: picked, mood, dateKey });
    setResult(generated);
    // 쪽지 오픈 모션(0.5s)을 보여준 뒤 몽글 로딩 연출로 전환
    await wait(550);
    setScreen('reveal');
    // 광고 mock + 로딩 멘트 4단계(620ms×4)가 끝날 시간을 함께 보장
    await Promise.all([showInterstitialBeforeResult(), wait(2600)]);
    incrementDailyDrawCount(dateKey);
    saveResult({ dateKey, fortuneType, noteId: picked.id });
    const snapshot = { dateKey, fortuneType, noteId: picked.id, result: generated };
    saveTodayReading(snapshot);
    setTodayReading(snapshot);
    setBusy(false);
    setScreen('result');
  }

  // 오늘 받은 편지 다시 읽기 (스냅샷 그대로 복원)
  function handleReopen() {
    if (!todayReading) return;
    const n = findNote(todayReading.noteId);
    if (!n) return;
    setFortuneType(todayReading.fortuneType);
    setNote(n);
    setResult(todayReading.result);
    setScreen('result');
  }

  async function handleDetail() {
    if (busy) return;
    setBusy(true);
    await showRewardAdForDetail();
    setBusy(false);
    setScreen('detail');
  }

  async function handleShare() {
    if (!result) return;
    const gradeText = result.rarity.special
      ? `${result.rarity.emoji}${result.rarity.label}`
      : result.luck.grade;
    const brag = luckPercentile(result.luck.total);
    const r = await shareOrCopy({
      title: result.title,
      score: result.luck.total,
      grade: gradeText,
      headline: result.dayPlan.headline,
      doItem: result.dayPlan.steps[0].text,
      dontItem: result.dayPlan.holdOff,
      shareLine: result.shareLine,
      brag: `상위 ${brag.pct}%`,
    });
    if (r === 'shared') flash('공유 창을 열었어요 💌');
    else if (r === 'copied') flash('공유 문구 복사 완료! 💌');
    else flash('앗, 공유를 못 했어요');
  }

  async function handleCopyLine() {
    if (!result) return;
    const ok = await copyText(result.detail.charm);
    flash(ok ? '부적 문장 복사 완료! 🔖' : '앗, 복사를 못 했어요');
  }

  async function handleSave() {
    if (busy || !result || !note) return;
    setBusy(true);
    await showRewardAdForSaveImage();
    const ok = await saveResultCard({
      title: result.title,
      subtitle: result.subtitle,
      headline: result.dayPlan.headline,
      shareLine: result.shareLine,
      total: result.luck.total,
      grade: result.luck.grade,
      tag: result.luck.tag,
      rarity: result.rarity,
    });
    setBusy(false);
    flash(ok ? '결과 카드 저장 완료! 📸' : '앗, 저장을 못 했어요');
  }

  async function handleRetry() {
    if (busy) return;
    setBusy(true);
    await showRewardAdForRetry();
    setBusy(false);
    setNote(null);
    setDrawNonce((n) => n + 1);
    setScreen('pick');
  }

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          streak={streak}
          yesterdayRecord={yesterdayRecord}
          todayReading={todayReading}
          zodiac={zodiac}
          onZodiac={handleZodiac}
          starSign={starSign}
          onStarSign={handleStarSign}
          onReopen={handleReopen}
          onCompat={() => setScreen('compat')}
          onSelect={handleType}
        />
      )}

      {screen === 'mood' && (
        <MoodScreen
          fortuneLabel={fortuneType ? FORTUNE_LABEL[fortuneType] : ''}
          onSelect={handleMood}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'reveal' && fortuneType && (
        <RevealScreen fortuneType={fortuneType} special={result?.rarity.special} />
      )}

      {screen === 'pick' && (
        <NotePickScreen
          notes={shownNotes}
          busy={busy}
          openingId={busy ? note?.id : undefined}
          fortuneLabel={fortuneType ? FORTUNE_LABEL[fortuneType] : ''}
          onPick={handlePick}
          onBack={() => setScreen('mood')}
        />
      )}

      {screen === 'result' && result && note && (
        <ResultScreen
          result={result}
          note={note}
          busy={busy}
          onDetail={handleDetail}
          onSave={handleSave}
          onShare={handleShare}
          onRetry={handleRetry}
          onCompat={() => setScreen('compat')}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'detail' && result && (
        <DetailResultScreen
          result={result}
          busy={busy}
          onShare={handleShare}
          onCopyLine={handleCopyLine}
          onSave={handleSave}
          onBack={() => setScreen('result')}
        />
      )}

      {screen === 'compat' && (
        <CompatScreen
          dateKey={dateKey}
          initialMyZodiac={zodiac?.id ?? null}
          initialMyStar={starSign?.id ?? null}
          onSaveMyZodiac={handleSaveMyZodiac}
          onSaveMyStar={handleSaveMyStarSign}
          onBack={() => setScreen(result ? 'result' : 'home')}
          onAdUnlock={showRewardAdForCompat}
          onShare={shareText}
          onToast={flash}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
