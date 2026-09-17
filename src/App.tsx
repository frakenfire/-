import { useEffect, useMemo, useRef, useState } from 'react';
import type { FortuneResult, FortuneType, Mood, Note } from './types/fortune.ts';
import { NOTES } from './data/notes.ts';
import { FORTUNE_LABEL } from './data/fortuneTypes.ts';
import { todayKey } from './lib/dateSeed.ts';
import { pickNotesFor } from './lib/pickNotes.ts';
import { generateFortune } from './lib/generateFortune.ts';
import { luckPercentile } from './lib/luck.ts';
import { showRewardAd, isRewarded, isUnsupportedFreePass } from './lib/ads.ts';
import { buildShareText, shareBriefing, shareForUnlock, copyText, shareMessage } from './lib/share.ts';
import { ConcernScreen } from './screens/ConcernScreen.tsx';
import { ConcernAskScreen } from './screens/ConcernAskScreen.tsx';
import { computeTiming } from './lib/timing.ts';
import { buildDeepRead } from './lib/deepRead.ts';
import { computeFourScores } from './lib/concernScore.ts';
import { findConcern, type ConcernKey } from './data/concerns.ts';
import { AppLayout } from './components/AppLayout.tsx';
import { saveResultCard } from './lib/saveImage.ts';
import {
  incrementDailyDrawCount,
  markVisit,
  updateStreak,
  peekStreak, loadSkipBirth, saveSkipBirth } from './lib/storage.ts';
import { clearAllData } from './lib/storage.ts';
import { getTrustedDateKey, subscribeSafeArea, subscribeBackEvent, logEvent, reportError, askReview } from './lib/toss.ts';
import { findZodiac } from './data/zodiac.ts';
import type { Zodiac, ZodiacId } from './data/zodiac.ts';
import { findStarSign } from './data/starSign.ts';
import type { StarSign, StarSignId } from './data/starSign.ts';
import { loadMyZodiac, saveMyZodiac, loadMyStarSign, saveMyStarSign, hasAskedReview, markReviewAsked, loadBirth, saveBirth, clearBirth,
  type StoredBirth } from './lib/storage.ts';

import { HomeScreen } from './screens/HomeScreen.tsx';
import { MoodScreen } from './screens/MoodScreen.tsx';
import { NotePickScreen } from './screens/NotePickScreen.tsx';
import { RevealScreen } from './screens/RevealScreen.tsx';
import { ResultScreen } from './screens/ResultScreen.tsx';
import { DetailResultScreen } from './screens/DetailResultScreen.tsx';
import { CompatScreen } from './screens/CompatScreen.tsx';
import { BirthScreen } from './screens/BirthScreen.tsx';
import { parseBirth } from './lib/birth.ts';
import { MySajuScreen } from './screens/MySajuScreen.tsx';
import { TopicScreen } from './screens/TopicScreen.tsx';
import { computeFourPillars } from './lib/fourPillars.ts';
import { tap } from './lib/haptic.ts';
import { hashSeed } from './lib/dateSeed.ts';
import { dailyForMe } from './lib/dailySaju.ts';
import { analyzeSaju } from './lib/tenGods.ts';
import { DAY_MASTER_BY_INDEX } from './data/dayMaster.ts';

type ScreenName =
  | 'home' | 'mood' | 'pick' | 'reveal' | 'result' | 'detail' | 'compat' | 'birth' | 'saju' | 'topic'
  | 'concern' | 'concernAsk';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  // 공유·딥링크로 재현 가능한 화면(궁합)은 URL 해시와 연결한다.
  // (결과·심층은 뽑기 시점 상태에 의존해 재현 대상이 아니므로 홈으로 시작)
  const [screen, setScreenRaw] = useState<ScreenName>(() =>
    typeof window !== 'undefined' && window.location.hash === '#/compat' ? 'compat' : 'home',
  );
  // 뒤로가기는 '한 단계 앞' 으로 가야 한다. 화면마다 돌아갈 곳을 손으로 적어두면
  // 흐름이 바뀔 때마다 한 군데씩 틀어져서, 결국 어디서 눌러도 홈으로 떨어진다.
  // 그래서 지나온 길을 쌓아두고 그대로 되짚는다.
  const backStack = useRef<ScreenName[]>([]);
  // 거쳐 가기만 하는 화면은 쌓지 않는다. 되돌아가면 곧바로 다시 앞으로 가버린다.
  const PASS_THROUGH: ScreenName[] = ['reveal'];

  function setScreen(next: ScreenName) {
    setScreenRaw((cur) => {
      if (cur !== next && !PASS_THROUGH.includes(cur)) backStack.current.push(cur);
      return next;
    });
  }

  /** 쌓지 않고 자리만 바꾼다 (연출 화면에서 결과로 넘어갈 때) */
  function replaceScreen(next: ScreenName) {
    setScreenRaw(next);
  }

  function goBack(fallback: ScreenName = 'home') {
    const prev = backStack.current.pop();
    setScreenRaw(prev ?? fallback);
  }

  /** 처음으로 — 쌓인 길도 비운다 */
  function goHome() {
    backStack.current = [];
    setScreenRaw('home');
  }
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
  // 회전 값 — 열 때마다, 뽑을 때마다 바뀐다. 결과 자체(점수·쪽지)는 날짜와 사주로 고정이고,
  // 제목·한마디·힌트·질문답 같은 겉 문구만 이 값으로 돌아간다. 같은 말이 계속 나오지 않게.
  const [spin, setSpin] = useState(() => hashSeed(String(Date.now())) % 100000);
  // 누르는 맛 — 버튼이면 어디든 손끝에 한 번
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('button, [role="button"], a')) tap('soft');
    };
    document.addEventListener('pointerdown', onDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);
  const yesterdayKey = useMemo(() => {
    const d = new Date(`${dateKey}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return todayKey(d);
  }, [dateKey]);
  // 스트릭은 '앱을 연 순간'이 아니라 '쪽지를 뽑은 날' 기준으로 오른다(handlePick).
  // 홈에는 부작용 없이 현재 값만 보여준다.
  const [streak, setStreak] = useState(() => peekStreak());


  // 내 사주 — 띠(1/12)로는 '나를 위한 결과'가 안 나온다.
  // 저장은 이 기기 localStorage 뿐이고 서버로 나가지 않는다.
  const [birth, setBirth] = useState<StoredBirth | null>(() => loadBirth());
  const birthInput = useMemo(
    () => (birth ? parseBirth(birth.date, birth.time) : null),
    [birth],
  );
  // 사주 여덟 글자 — 상담과 홈 배지가 같은 계산을 두 번 하지 않게 여기서 한 번만 세운다.
  const pillars = useMemo(() => (birthInput ? computeFourPillars(birthInput) : null), [birthInput]);

  // 오늘 내 앞에 놓이는 쪽지 세 장 — 날짜·운세종류·기분에 더해 생년월일까지 반영한다.
  // 사주를 넣었으면 오늘 기운이 모자란/넘치는 쪽에 따라 후보가 기운다.
  const notePick = useMemo(
    () =>
      pickNotesFor(NOTES, 6, {
        dateKey,
        fortuneType: fortuneType ?? '',
        mood: mood ?? '',
        nonce: drawNonce,
        birth: birthInput,
      }),
    [dateKey, fortuneType, mood, drawNonce, birthInput],
  );
  const shownNotes = notePick.notes;

  // 결과는 뽑는 순간 한 번만 생성 (편지 조합의 직전 회피 로직이 재계산에 영향받지 않도록)
  const [result, setResult] = useState<FortuneResult | null>(null);

  // 오늘 이미 받은 편지 (다시 읽기용 스냅샷)

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

  // 토스 하드웨어 뒤로가기도 같은 길을 되짚는다. 화면마다 따로 적어두면 어긋난다.
  function handleHardwareBack() {
    if (busyRef.current) return;
    if (screenRef.current === 'home') return; // 토스가 앱 종료를 처리
    goBack();
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
    const unsubBack = subscribeBackEvent(handleHardwareBack);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVis);
      unsubSafe();
      unsubBack();
    };
    // 마운트 시 1회 구독 (goBack 은 ref 로 최신 상태를 읽음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 날짜가 실제로 바뀌면(앱을 켜둔 채 자정을 넘긴 경우) 어제 것을 오늘 것으로
  // 들고 있지 않도록 오늘 기준 상태를 다시 읽는다.
  // dateKey 는 visibilitychange 마다 갱신되지만 아래 값들은 마운트 때 한 번만
  // 읽혔던 탓에, 자정을 넘기면 홈이 어제 편지를 '오늘 받은 편지'로 보여줬다.
  const lastSyncedDate = useRef(dateKey);
  useEffect(() => {
    if (lastSyncedDate.current === dateKey) return;
    lastSyncedDate.current = dateKey;
    setStreak(peekStreak());
    // 어제 뽑은 결과 화면을 띄워둔 채 자정을 넘겼다면 홈으로 되돌린다.
    setResult(null);
    setNote(null);
    // 날이 바뀌었으니 지나온 길도 의미가 없다
    setScreenRaw((cur) => {
      if (cur === 'result' || cur === 'detail' || cur === 'reveal') {
        backStack.current = [];
        return 'home';
      }
      return cur;
    });
  }, [dateKey]);

  // 퍼널 계측 — 화면 진입 로깅 (토스 Analytics, 미지원 시 no-op)
  useEffect(() => {
    logEvent('screen_view', { screen });
    // 화면이 바뀌면 항상 맨 위에서 시작한다.
    // 스크롤 컨테이너는 환경에 따라 달라진다(콘텐츠가 길면 window, 웹뷰처럼 높이가
    // 고정되면 .app__body). 둘 다 초기화하지 않으면, 앞 화면에서 내려둔 스크롤이
    // 그대로 남아 새 화면이 중간부터 보이고 '빈 화면'처럼 느껴진다.
    if (typeof window !== 'undefined') {
      try {
        window.scrollTo(0, 0);
        document.querySelector('.app__body')?.scrollTo(0, 0);
      } catch {
        /* no-op */
      }
    }
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


  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1800);
  }

  function handleType(t: FortuneType) {
    startDraw(t);
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

  async function handlePick(pickedAll: Note[]) {
    // 한 장만 고른다. 배열로 받는 건 화면 쪽 신호 모양을 그대로 쓰기 위해서다.
    const picked = pickedAll[0];
    if (!picked || busy || !fortuneType || !mood) return;
    setNote(picked);
    setBusy(true);
    try {
      const generated = generateFortune({
        fortuneType,
        note: picked,
        mood,
        dateKey,
        zodiac: zodiac?.id ?? null,
        star: starSign?.id ?? null,
        birth: birthInput,
      });
      setResult(generated);
      // 쪽지 오픈 모션(0.5s)을 보여준 뒤 몽글 로딩 연출로 전환.
      // 무료 첫 결과에는 광고를 넣지 않는다(정책: 무료 결과는 광고 없이 제공).
      await wait(550);
      setScreen('reveal');
      await wait(1400);
      // 쪽지를 누른 다음, 결과 전에 광고 한 번. 광고가 없는 곳(브라우저)에서는 그냥 지나간다.
      try {
        const ad = await showRewardAd('note');
        logEvent('reward_ad', { placement: 'note', status: ad.status });
      } catch (e) {
        reportError('noteAd', e);
      }
      incrementDailyDrawCount(dateKey);
      setStreak(updateStreak(dateKey, yesterdayKey)); // 실제 뽑은 날에만 스트릭 갱신
      logEvent('result_viewed', { fortuneType, engineVersion: generated.engineVersion });
      replaceScreen('result');
      setSpin((v) => v + 7);
      // 기분 좋은 순간(대길·3일 스트릭)에 미니앱 리뷰를 한 번만 요청.
      // 실제로 리뷰 UI 가 뜬 경우에만 소진 처리(토스 밖에서 기회를 태우지 않게).
      const streakNow = peekStreak();
      if (!hasAskedReview() && (generated.luck.grade === '대길' || streakNow >= 3)) {
        void askReview().then((shown) => {
          if (shown) {
            markReviewAsked();
            logEvent('review_requested', { grade: generated.luck.grade, streak: streakNow });
          }
        });
      }
    } catch (e) {
      reportError('handlePick', e);
      flash('앗, 쪽지를 여는 중 문제가 생겼어요. 다시 시도해 주세요');
      setScreen('pick');
    } finally {
      setBusy(false);
    }
  }

  // 오늘 받은 편지 다시 읽기 (스냅샷 그대로 복원)


  function briefingOf(r: NonNullable<typeof result>) {
    const brag = luckPercentile(r.luck.total);
    return {
      title: r.title,
      score: r.luck.total,
      headline: r.dayPlan.headline,
      doItem: r.dayPlan.steps[0].text,
      dontItem: r.dayPlan.holdOff,
      brag: brag.isBrag ? `상위 ${brag.pct}%` : undefined,
      pinpoint: r.pinpoint,
    };
  }

  // 복사하기 — 카톡 붙여넣기용. 공유창과 같은 문구.
  async function handleCopyResult() {
    if (!result) return;
    const ok = await copyText(buildShareText(briefingOf(result)));
    flash(ok ? '복사했어요. 카톡에 붙여넣으면 돼요' : '앗, 복사를 못 했어요');
  }

  async function handleShare() {
    if (!result) return;
    const brag = luckPercentile(result.luck.total);
    const r = await shareBriefing({
      title: result.title,
      topic: deep && concernKey ? findConcern(concernKey).label : undefined,
      score: deep ? deep.read.score.total : result.luck.total,
      headline: deep ? deep.read.headline : result.dayPlan.headline,
      bestWhen: deep ? deep.timing.bestMonth.label : undefined,
      careWhen: deep ? deep.timing.hardMonth.label : undefined,
      doItem: result.dayPlan.steps[0].text,
      dontItem: result.dayPlan.holdOff,
      // 자랑거리일 때만 공유 문구에 넣는다 — "상위 90% " 를 친구에게 보내는 건
      // 자랑이 아니라 김빠지는 일이라, 그런 날엔 점수만 담아 보낸다.
      brag: brag.isBrag ? `상위 ${brag.pct}%` : undefined,
      pinpoint: result.pinpoint,
    });
    logEvent('share', { outcome: r });
    if (r === 'shared') flash('친구에게 공유했어요');
    else if (r === 'copied') flash('공유 문구 복사 완료!');
    else if (r === 'cancelled') return; // 취소 — 아무 안내 없이 조용히
    else flash('앗, 공유를 못 했어요');
  }

  async function handleCopyLine() {
    if (!result) return;
    const ok = await copyText(result.detail.charm);
    flash(ok ?'한 줄 복사 완료!' : '앗, 복사를 못 했어요');
  }

  async function handleShareWeek(text: string) {
    const r = await shareMessage(text);
    logEvent('share_week', { outcome: r });
    if (r === 'shared') flash('이번 주 운세를 공유했어요');
    else if (r === 'copied') flash('공유 문구 복사 완료!');
    else if (r === 'failed') flash('앗, 공유를 못 했어요');
  }

  //  내 사주 
  // 띠(1/12)로는 '나를 위한 결과'가 안 나온다. 생년월일시를 받아 사주 여덟 글자를 세운다.
  // 저장은 이 기기 localStorage 뿐이고 서버로 나가지 않는다.

  // 뽑기 흐름 중에 생년월일을 받았으면 흐름을 이어간다(주제 고르기로).
  // 홈에서 직접 들어왔으면 세운 사주를 보여준다.
  const [birthFromFlow, setBirthFromFlow] = useState(false);
  const [skipBirth, setSkipBirth] = useState(() => loadSkipBirth());

  // 고민 상담 — 주제를 고르고, 상황을 좁히고, 생년월일을 받은 뒤 시기를 답으로 준다.
  const [concernKey, setConcernKey] = useState<ConcernKey | null>(null);
  const [concernOption, setConcernOption] = useState<string | null>(null);
  // 생년월일을 받으러 갔다가 돌아올 곳
  const [birthNext, setBirthNext] = useState<'draw' | 'saju' | 'concern'>('saju');
  // 쪽지 뽑기 흐름 안에서 고민을 묻는 중인가. 아니면 '더 해보기' 로 들어온 단독 상담인가.
  const [concernInFlow, setConcernInFlow] = useState(false);

  // 네 가지 운도 같은 점수 엔진에서 뽑는다. 난수로 흩뿌리면 바로 위 고민 점수와
  // 숫자가 어긋나고, 그 순간 둘 다 못 믿을 숫자가 된다.
  const chartScores = useMemo(() => {
    if (!birthInput || !pillars) return null;
    return computeFourScores(birthInput, pillars, birth?.gender ?? null, dateKey);
  }, [birthInput, pillars, birth?.gender, dateKey]);

  const deep = useMemo(() => {
    if (!concernKey || !birthInput || !pillars) return null;
    const timing = computeTiming(birthInput, pillars, birth?.gender ?? null, concernKey);
    return { timing, read: buildDeepRead(pillars, timing, concernKey, concernOption, dateKey) };
  }, [concernKey, concernOption, birthInput, pillars, birth?.gender, dateKey]);

  function handleConcern(key: ConcernKey) {
    setConcernKey(key);
    setConcernOption(null);
    setScreen('concernAsk');
  }

  function handleConcernOption(optionKey: string) {
    setConcernOption(optionKey);
    logEvent('concern_picked', { concern: concernKey ?? '', option: optionKey });
    setScreen('pick');
  }

  // 뽑기 시작 — 이름·성별을 받고, 고민과 보고 싶은 부분을 물은 뒤에 쪽지를 고른다.
  // 기분은 묻지 않는다. 보통 기분이 기본이다.
  function startDraw(type: FortuneType = 'tomorrow') {
    markVisit(dateKey);
    setSpin((v) => v + 1);
    setFortuneType(type);
    setMood((m) => m ?? 'soso');
    setConcernKey(null);
    setConcernOption(null);
    setConcernInFlow(true);
    setScreen('concern');
  }

  function handleSaveBirth(b: StoredBirth) {
    setBirth(b);
    saveBirth(b);
    logEvent('birth_saved', { hasTime: b.time !== null, viaFlow: birthFromFlow });
    if (birthNext === 'concern' || birthFromFlow) startDraw();
    else setScreen('saju');
    setBirthFromFlow(false);
    setBirthNext('saju');
  }

  // 생년월일 없이 그냥 뽑고 싶은 사람도 있다. 막지 않는다.
  function handleSkipBirth() {
    logEvent('birth_skipped', {});
    saveSkipBirth(true);
    setSkipBirth(true);
    setBirthFromFlow(false);
    startDraw();
  }

  // 홈에 보여줄 일간 배지 — 사주를 세운 사람에게는 '내 것'이 홈에서 바로 보여야 한다.
  const sajuBadge = useMemo(() => {
    if (!birthInput || !pillars) return null;
    const dm = DAY_MASTER_BY_INDEX[pillars.dayStem];
    // 오늘 기운이 돈·사랑·일에 어떻게 닿는지 홈에서 바로 보여주기 위한 묶음
    const group = dailyForMe(dateKey, pillars, analyzeSaju(pillars)).dayGodGroup;
    // 한자는 붙이지 않는다. '壬 큰 물' 은 읽는 사람 대부분에게 앞 글자가 장벽이다.
    return { icon: dm.icon, name: dm.name, hue: dm.hue, group };
  }, [birthInput, pillars, dateKey]);

  // 사주를 세우면 띠는 이미 정해진다(그것도 입춘 기준이라 더 정확하다).
  // 그런데도 홈이 "내 띠를 고르면…"이라고 물으면 유저는 "방금 넣었는데?" 가 된다.
  // 사주가 있으면 띠를 자동으로 맞춰, 같은 걸 두 번 묻지 않는다.
  useEffect(() => {
    if (!birthInput) return;
    const derived = computeFourPillars(birthInput).zodiac;
    if (zodiac?.id === derived) return;
    setZodiac(findZodiac(derived) ?? null);
    saveMyZodiac(derived);
  }, [birthInput, zodiac?.id]);

  // 지우는 길은 하나면 된다. 개인적인 값이 다 모여 있는 내 사주 화면에 둔다.
  function handleDeleteBirth() {
    const ok = clearAllData();
    clearBirth();
    setBirth(null);
    setZodiac(null);
    setStarSign(null);
    setResult(null);
    setStreak(0);
    setSkipBirth(false);
    logEvent('birth_deleted', {});
    flash(ok ? '내 정보를 모두 지웠어요' : '앗, 데이터를 지우지 못했어요');
    setScreen('home');
  }

  async function handleShareSaju(text: string) {
    const r = await shareMessage(text);
    logEvent('share_saju', { outcome: r });
    if (r === 'shared') flash('내 일간을 공유했어요');
    else if (r === 'copied') flash('공유 문구 복사 완료!');
    else if (r === 'failed') flash('앗, 공유를 못 했어요');
  }


  async function handleSave() {
    if (busy || !result || !note) return;
    const snapshot = result;
    setBusy(true);
    try {
      const ok = await saveResultCard({
        title: snapshot.title,
        subtitle: snapshot.subtitle,
        headline: snapshot.dayPlan.headline,
        total: snapshot.luck.total,
        grade: snapshot.luck.grade,
        rarity: snapshot.rarity,
        saju: snapshot.saju
          ? { iljin: snapshot.saju.iljin.kor, rel: snapshot.saju.relationKo, tone: snapshot.saju.toneWord }
          : null,
      });
      logEvent('save_card', { ok });
      flash(ok ?'결과 카드 저장 완료!  스토리에 올려봐요' : '앗, 저장을 못 했어요');
    } catch (e) {
      reportError('handleSave', e);
      flash('앗, 저장 중 문제가 생겼어요');
    } finally {
      setBusy(false);
    }
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
          zodiac={zodiac}
          spin={spin}
          onStart={() => {
            setBirthNext('concern');
            setScreen('birth');
          }}
        />
      )}

      {screen === 'topic' && (
        <TopicScreen
          sajuBadge={sajuBadge}
          onSelect={handleType}
          onBack={() => goBack()}
        />
      )}

      {screen === 'mood' && (
        <MoodScreen
          zodiac={zodiac}
          star={starSign}
          onPickZodiac={handleSaveMyZodiac}
          onPickStar={handleSaveMyStarSign}
          onSelect={handleMood}
          hasBirth={birthInput !== null}
          onBack={() => goBack()}
        />
      )}

      {screen === 'reveal' && fortuneType && (
        <RevealScreen fortuneType={fortuneType} special={result?.rarity.special} />
      )}

      {screen === 'pick' && (
        <NotePickScreen
          notes={shownNotes}
          spin={spin + drawNonce * 13}
          busy={busy}
          openingId={busy ? note?.id : undefined}
          fortuneLabel={fortuneType ? FORTUNE_LABEL[fortuneType] : ''}
          personal={notePick.personal}
          onPick={handlePick}
          onBack={() => goBack()}
        />
      )}

      {screen === 'result' && result && note && (
        <ResultScreen
          result={result}
          note={note}
          busy={busy}
          onShare={handleShare}
          onCopy={handleCopyResult}
          spin={spin}
          userName={birth?.name ?? null}
          deep={concernKey && deep ? { concernKey, read: deep.read, timing: deep.timing } : null}
          sajuBadge={sajuBadge}
          onSaju={() => setScreen(birth ? 'saju' : 'birth')}
          zodiac={zodiac}
          chartScores={chartScores}
          onShareWeek={handleShareWeek}
          onCompat={() => setScreen('compat')}
          onMonth={() => (birthInput || skipBirth ? handleType('month') : (setBirthNext('concern'), setScreen('birth')))}
          onBack={() => goBack()}
        />
      )}

      {screen === 'birth' && (
        <BirthScreen
          initial={birth}
          spin={spin}
          inFlow={birthFromFlow || birthNext === 'concern'}
          ctaLabel={birthNext === 'concern' || birthFromFlow ? '다음' : undefined}
          onSave={handleSaveBirth}
          onSkip={handleSkipBirth}
          onBack={() => goBack()}
        />
      )}

      {screen === 'saju' && birthInput && (
        <MySajuScreen
          birth={birthInput}
          onBack={() => goBack()}
          onEdit={() => setScreen('birth')}
          onShare={handleShareSaju}
          onDeleteBirth={handleDeleteBirth}
          onDraw={() => startDraw()}
        />
      )}

      {/* 안전망 — 저장된 생년월일이 깨졌으면 사주 화면 대신 입력으로 되돌린다 */}
      {screen === 'saju' && !birthInput && (
        <BirthScreen initial={null} onSave={handleSaveBirth} onBack={() => goBack()} />
      )}

      {screen === 'detail' && result && (
        <DetailResultScreen
          result={result}
          busy={busy}
          onShare={handleShare}
          onCopyLine={handleCopyLine}
          onSave={handleSave}
          onBack={() => goBack()}
        />
      )}

      {/* 안전망 — 결과/심층 화면인데 데이터가 없으면(저장 실패·비정상 복원 등)
          빈 화면을 보여주지 않고 홈으로 돌아갈 길을 준다. */}
      {(screen === 'result' || screen === 'detail') && !(result && note) && (
        <AppLayout onBack={() => goBack()} title="오늘의 쪽지">
          <div className="empty-state">
            <p className="empty-state__title">쪽지를 불러오지 못했어요</p>
            <p className="empty-state__desc">잠시 문제가 있었어요. 다시 뽑아볼까요?</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setNote(null);
                setDrawNonce((n) => n + 1);
                goHome();
              }}
            >
              처음으로 돌아가기
            </button>
          </div>
        </AppLayout>
      )}

      {screen === 'compat' && (
        <CompatScreen
          dateKey={dateKey}
          initialMyZodiac={zodiac?.id ?? null}
          initialMyStar={starSign?.id ?? null}
          onSaveMyZodiac={handleSaveMyZodiac}
          onSaveMyStar={handleSaveMyStarSign}
          onBack={() => goBack()}
          onAdUnlock={handleCompatAdUnlock}
          onShare={shareForUnlock}
          onToast={flash}
        />
      )}

      {screen === 'concern' && (
        <ConcernScreen
          userName={birth?.name ?? null}
          onSelect={handleConcern}
          onBack={() => goBack()}
          inFlow={concernInFlow}
        />
      )}

      {screen === 'concernAsk' && concernKey && (
        <ConcernAskScreen
          concernKey={concernKey}
          onSelect={handleConcernOption}
          onBack={() => goBack()}
          inFlow={concernInFlow}
        />
      )}


      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
