import { useEffect, useMemo, useRef, useState } from 'react';
import type { FortuneResult, FortuneType, Mood, Note } from './types/fortune';
import { NOTES } from './data/notes';
import { FORTUNE_LABEL } from './data/fortuneTypes';
import { hashSeed, pickBySeed, todayKey } from './lib/dateSeed';
import { generateFortune } from './lib/generateFortune';
import { luckPercentile } from './lib/luck';
import { showRewardAd, isRewarded, isUnsupportedFreePass, adResultMessage } from './lib/ads';
import { shareBriefing, shareForUnlock, copyText } from './lib/share';
import { saveResultCard } from './lib/saveImage';
import {
  incrementDailyDrawCount,
  loadTodayReading,
  markVisit,
  saveResult,
  saveTodayReading,
  updateStreak,
  peekStreak,
  pushHistory,
  getRecordForDate,
} from './lib/storage';
import { clearAllData } from './lib/storage';
import { getTrustedDateKey, subscribeSafeArea, subscribeBackEvent, logEvent, reportError } from './lib/toss';
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
  // 공유·딥링크로 재현 가능한 화면(궁합)은 URL 해시와 연결한다.
  // (결과·심층은 뽑기 시점 상태에 의존해 재현 대상이 아니므로 홈으로 시작)
  const [screen, setScreen] = useState<ScreenName>(() =>
    typeof window !== 'undefined' && window.location.hash === '#/compat' ? 'compat' : 'home',
  );
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [fortuneType, setFortuneType] = useState<FortuneType | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  // 재뽑기 nonce 는 세션에 유지해, 새로고침해도 같은 후보 3장이 반복되지 않게 한다.
  const [drawNonce, setDrawNonce] = useState(() => {
    try {
      return Number(window.sessionStorage.getItem('tn_nonce')) || 0;
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    try {
      window.sessionStorage.setItem('tn_nonce', String(drawNonce));
    } catch {
      /* no-op */
    }
  }, [drawNonce]);

  // 자정을 넘겨도(앱을 계속 켜둬도) 날짜가 갱신되도록 state 로 관리하고,
  // 앱이 포그라운드로 돌아올 때마다 신뢰 가능한 '오늘'을 다시 확인한다.
  const [dateKey, setDateKey] = useState(() => todayKey());
  const yesterdayKey = useMemo(() => {
    const d = new Date(`${dateKey}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return todayKey(d);
  }, [dateKey]);
  // 스트릭은 '앱을 연 순간'이 아니라 '쪽지를 뽑은 날' 기준으로 오른다(handlePick).
  // 홈에는 부작용 없이 현재 값만 보여준다.
  const [streak, setStreak] = useState(() => peekStreak());

  const yesterdayRecord = useMemo(() => getRecordForDate(yesterdayKey), [yesterdayKey]);

  // 쪽지 후보 3장은 날짜뿐 아니라 운세 종류·기분까지 반영해, 같은 날
  // 연애운/금전운/직장운에서 똑같은 세 장이 나오지 않게 한다.
  const shownNotes = useMemo(() => {
    const seed = hashSeed(`${dateKey}#${fortuneType ?? ''}#${mood ?? ''}#${drawNonce}`);
    return pickBySeed(NOTES, 3, seed);
  }, [dateKey, fortuneType, mood, drawNonce]);

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

  // 시스템 뒤로가기(토스 백 이벤트) 핸들러가 현재 화면을 알 수 있도록 ref 로 추적.
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const hasResultRef = useRef(false);
  hasResultRef.current = !!result;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  function goBack() {
    if (busyRef.current) return;
    switch (screenRef.current) {
      case 'mood':
        setScreen('home');
        break;
      case 'pick':
        setScreen('mood');
        break;
      case 'result':
        setScreen('home');
        break;
      case 'detail':
        setScreen('result');
        break;
      case 'compat':
        setScreen(hasResultRef.current ? 'result' : 'home');
        break;
      default:
        break; // home/reveal — 토스가 앱 종료를 처리
    }
  }

  useEffect(() => {
    let alive = true;
    // 자정 경과·시간 조작 대응: 신뢰 가능한 '오늘'로 날짜 키를 동기화.
    const syncDate = async () => {
      const trusted = await getTrustedDateKey(() => todayKey());
      if (alive) setDateKey((cur) => (cur === trusted ? cur : trusted));
    };
    void syncDate();
    const onVis = () => {
      if (document.visibilityState === 'visible') void syncDate();
    };
    document.addEventListener('visibilitychange', onVis);
    const unsubSafe = subscribeSafeArea();
    const unsubBack = subscribeBackEvent(goBack);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVis);
      unsubSafe();
      unsubBack();
    };
    // 마운트 시 1회 구독 (goBack 은 ref 로 최신 상태를 읽음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 퍼널 계측 — 화면 진입 로깅 (토스 Analytics, 미지원 시 no-op)
  useEffect(() => {
    logEvent('screen_view', { screen });
    // 궁합 화면만 해시로 반영(새로고침 유지 + 딥링크 재현). replaceState 라 히스토리 오염 없음.
    const target = screen === 'compat' ? '#/compat' : '#/';
    if (typeof window !== 'undefined' && window.location.hash !== target) {
      try {
        window.history.replaceState(null, '', target);
      } catch {
        /* no-op */
      }
    }
  }, [screen]);

  function handleReset() {
    const ok = clearAllData();
    if (ok) {
      setZodiac(null);
      setStarSign(null);
      setTodayReading(null);
      setResult(null);
      flash('내 데이터를 모두 지웠어요');
      setScreen('home');
    } else {
      flash('앗, 데이터를 지우지 못했어요');
    }
  }

  function handleZodiac(id: ZodiacId) {
    const z = findZodiac(id);
    if (!z) return;
    const saved = saveMyZodiac(id);
    setZodiac(z);
    flash(saved ? `${z.emoji} ${z.label}의 한 줄이 매일 홈에 떠요` : '앗, 저장을 못 했어요');
  }

  function handleStarSign(id: StarSignId) {
    const s = findStarSign(id);
    if (!s) return;
    const saved = saveMyStarSign(id);
    setStarSign(s);
    flash(saved ? `${s.emoji} ${s.label}의 한 줄이 매일 홈에 떠요` : '앗, 저장을 못 했어요');
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
    try {
      const generated = generateFortune({ fortuneType, note: picked, mood, dateKey });
      setResult(generated);
      // 쪽지 오픈 모션(0.5s)을 보여준 뒤 몽글 로딩 연출로 전환.
      // 무료 첫 결과에는 광고를 넣지 않는다(정책: 무료 결과는 광고 없이 제공).
      await wait(550);
      setScreen('reveal');
      await wait(2600); // 로딩 멘트 4단계(620ms×4) 연출 시간
      incrementDailyDrawCount(dateKey);
      const record = { dateKey, fortuneType, noteId: picked.id };
      saveResult(record);
      pushHistory(record); // 날짜별 최근 7건 보관(어제의 쪽지 유지)
      setStreak(updateStreak(dateKey, yesterdayKey)); // 실제 뽑은 날에만 스트릭 갱신
      const snapshot = { ...record, result: generated };
      saveTodayReading(snapshot);
      setTodayReading(snapshot);
      logEvent('result_viewed', { fortuneType });
      setScreen('result');
    } catch (e) {
      reportError('handlePick', e);
      flash('앗, 쪽지를 여는 중 문제가 생겼어요. 다시 시도해 주세요');
      setScreen('pick');
    } finally {
      setBusy(false);
    }
  }

  // 보상형 광고 게이트 — 'rewarded'(광고 완주) 또는 'unsupported'(광고 미지원
  // 구버전 토스에 대한 명시적 무료 정책)일 때만 기능을 연다. dismissed/failed 는 막는다.
  async function runRewardGate(
    placement: 'detail' | 'saveImage' | 'retry',
    onUnlock: () => void | Promise<void>,
  ) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await showRewardAd(placement);
      logEvent('reward_ad', { placement, status: result.status });
      if (isRewarded(result) || isUnsupportedFreePass(result)) {
        await onUnlock();
      } else {
        flash(adResultMessage(result) || '앗, 잠시 후 다시 시도해요');
      }
    } catch (e) {
      reportError(`rewardGate:${placement}`, e);
      flash('앗, 문제가 생겼어요. 다시 시도해 주세요');
    } finally {
      setBusy(false);
    }
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
    await runRewardGate('detail', () => setScreen('detail'));
  }

  async function handleShare() {
    if (!result) return;
    const brag = luckPercentile(result.luck.total);
    const r = await shareBriefing({
      title: result.title,
      score: result.luck.total,
      headline: result.dayPlan.headline,
      doItem: result.dayPlan.steps[0].text,
      dontItem: result.dayPlan.holdOff,
      brag: `상위 ${brag.pct}%`,
    });
    logEvent('share', { outcome: r });
    if (r === 'shared') flash('친구에게 공유했어요 💌');
    else if (r === 'copied') flash('공유 문구 복사 완료! 💌');
    else if (r === 'cancelled') return; // 취소 — 아무 안내 없이 조용히
    else flash('앗, 공유를 못 했어요');
  }

  async function handleCopyLine() {
    if (!result) return;
    const ok = await copyText(result.detail.charm);
    flash(ok ? '부적 문장 복사 완료! 🔖' : '앗, 복사를 못 했어요');
  }

  async function handleSave() {
    if (busy || !result || !note) return;
    const snapshot = result;
    await runRewardGate('saveImage', async () => {
      const ok = await saveResultCard({
        title: snapshot.title,
        subtitle: snapshot.subtitle,
        headline: snapshot.dayPlan.headline,
        total: snapshot.luck.total,
        grade: snapshot.luck.grade,
        rarity: snapshot.rarity,
      });
      flash(ok ? '결과 카드 저장 완료! 📸' : '앗, 저장을 못 했어요');
    });
  }

  async function handleRetry() {
    await runRewardGate('retry', () => {
      setNote(null);
      setDrawNonce((n) => n + 1);
      setScreen('pick');
    });
  }

  // 친구 궁합 보상 광고 게이트 — rewarded/unsupported 만 잠금 해제.
  async function handleCompatAdUnlock(): Promise<boolean> {
    const result = await showRewardAd('compat');
    return isRewarded(result) || isUnsupportedFreePass(result);
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
          onReset={handleReset}
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
          onAdUnlock={handleCompatAdUnlock}
          onShare={shareForUnlock}
          onToast={flash}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
