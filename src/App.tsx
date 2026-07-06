import { useMemo, useState } from 'react';
import type { FortuneResult, FortuneType, Note } from './types/fortune';
import { NOTES } from './data/notes';
import { FORTUNE_LABEL } from './data/fortuneTypes';
import { hashSeed, pickBySeed, todayKey } from './lib/dateSeed';
import { generateFortune } from './lib/generateFortune';
import {
  showInterstitialBeforeResult,
  showRewardAdForDetail,
  showRewardAdForRetry,
  showRewardAdForSaveImage,
} from './lib/ads';
import { shareOrCopy, copyText } from './lib/share';
import { saveResultCard } from './lib/saveImage';
import {
  incrementDailyDrawCount,
  loadResult,
  markVisit,
  saveResult,
  updateStreak,
} from './lib/storage';
import {
  hasNewDelivery,
  isSubscribed,
  markDelivered,
  subscribeDaily,
} from './lib/subscribe';

import { HomeScreen } from './screens/HomeScreen';
import { NotePickScreen } from './screens/NotePickScreen';
import { RevealScreen } from './screens/RevealScreen';
import { ResultScreen } from './screens/ResultScreen';
import { DetailResultScreen } from './screens/DetailResultScreen';

type ScreenName = 'home' | 'pick' | 'reveal' | 'result' | 'detail';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [fortuneType, setFortuneType] = useState<FortuneType | null>(null);
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

  // 주기 수신: 구독 상태 + 오늘의 쪽지 도착 여부 + 어제의 쪽지 기록
  const [subscribed, setSubscribed] = useState(() => isSubscribed());
  const [delivered, setDelivered] = useState(() => hasNewDelivery(todayKey()));
  const yesterdayRecord = useMemo(() => {
    const r = loadResult();
    return r && r.dateKey === yesterdayKey ? r : null;
  }, [yesterdayKey]);

  const shownNotes = useMemo(() => {
    const seed = hashSeed(`${dateKey}#${drawNonce}`);
    return pickBySeed(NOTES, 3, seed);
  }, [dateKey, drawNonce]);

  const result: FortuneResult | null = useMemo(() => {
    if (!fortuneType || !note) return null;
    return generateFortune({ fortuneType, note, dateKey });
  }, [fortuneType, note, dateKey]);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  }

  function handleType(t: FortuneType) {
    markVisit(dateKey);
    markDelivered(dateKey);
    setDelivered(false);
    setFortuneType(t);
    setScreen('pick');
  }

  async function handleSubscribe() {
    const ok = await subscribeDaily();
    if (ok) {
      setSubscribed(true);
      flash('내일 아침, 새 쪽지로 찾아올게요 💌');
    } else {
      flash('앗, 알림 설정을 못 했어요');
    }
  }

  async function handlePick(picked: Note) {
    if (busy) return;
    setNote(picked);
    setBusy(true);
    // 쪽지 오픈 모션(0.5s)을 보여준 뒤 몽글 로딩 연출로 전환
    await wait(550);
    setScreen('reveal');
    // 광고 mock + 로딩 멘트 4단계(620ms×4)가 끝날 시간을 함께 보장
    await Promise.all([showInterstitialBeforeResult(), wait(2600)]);
    if (fortuneType) {
      incrementDailyDrawCount(dateKey);
      saveResult({ dateKey, fortuneType, noteId: picked.id });
    }
    setBusy(false);
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
    const r = await shareOrCopy(
      result.title,
      result.shareLine,
      result.luck.total,
      result.luck.grade,
    );
    if (r === 'shared') flash('공유 창을 열었어요 💌');
    else if (r === 'copied') flash('공유 문구 복사 완료! 💌');
    else flash('앗, 공유를 못 했어요');
  }

  async function handleCopyLine() {
    if (!result) return;
    const ok = await copyText(result.shareLine);
    flash(ok ? '한 문장 복사 완료! ✨' : '앗, 복사를 못 했어요');
  }

  async function handleSave() {
    if (busy || !result || !note) return;
    setBusy(true);
    await showRewardAdForSaveImage();
    const ok = await saveResultCard({
      title: result.title,
      subtitle: result.subtitle,
      pinpoint: result.pinpoint,
      shareLine: result.shareLine,
      total: result.luck.total,
      grade: result.luck.grade,
      tag: result.luck.tag,
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
          subscribed={subscribed}
          delivered={delivered}
          yesterdayRecord={yesterdayRecord}
          onSubscribe={handleSubscribe}
          onSelect={handleType}
        />
      )}

      {screen === 'reveal' && fortuneType && (
        <RevealScreen fortuneType={fortuneType} />
      )}

      {screen === 'pick' && (
        <NotePickScreen
          notes={shownNotes}
          busy={busy}
          openingId={busy ? note?.id : undefined}
          fortuneLabel={fortuneType ? FORTUNE_LABEL[fortuneType] : ''}
          onPick={handlePick}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'result' && result && note && (
        <ResultScreen
          result={result}
          note={note}
          busy={busy}
          subscribed={subscribed}
          onSubscribe={handleSubscribe}
          onDetail={handleDetail}
          onSave={handleSave}
          onShare={handleShare}
          onRetry={handleRetry}
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

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
