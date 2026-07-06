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
  markVisit,
  saveResult,
} from './lib/storage';

import { HomeScreen } from './screens/HomeScreen';
import { NotePickScreen } from './screens/NotePickScreen';
import { ResultScreen } from './screens/ResultScreen';
import { DetailResultScreen } from './screens/DetailResultScreen';

type ScreenName = 'home' | 'pick' | 'result' | 'detail';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [fortuneType, setFortuneType] = useState<FortuneType | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [drawNonce, setDrawNonce] = useState(0);

  const dateKey = useMemo(() => todayKey(), []);

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
    setFortuneType(t);
    setScreen('pick');
  }

  async function handlePick(picked: Note) {
    if (busy) return;
    setNote(picked);
    setBusy(true);
    await showInterstitialBeforeResult();
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
      {screen === 'home' && <HomeScreen onSelect={handleType} />}

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
