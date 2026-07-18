import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { AdBadge } from '../components/AdNotice';
import { Disclaimer } from '../components/Disclaimer';
import { ZODIACS, findZodiac, type ZodiacId } from '../data/zodiac';
import { STAR_SIGNS, findStarSign, type StarSignId } from '../data/starSign';
import { computeCompat, type CompatResult } from '../lib/compat';
import { computeStarCompat } from '../lib/starCompat';
import { saveCompatCard } from '../lib/compatCard';
import { scoreColor, scoreTextColor } from '../lib/luck';
import {
  RELATIONS,
  addSavedPerson,
  loadSavedPeople,
  relationMeta,
  removeSavedPerson,
  type RelationKey,
  type SavedPerson,
} from '../lib/storage';

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
  const [savedPeople, setSavedPeople] = useState<SavedPerson[]>(() => loadSavedPeople());

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


  // 내 사람들 랭킹 — 오늘 나랑 저장된 사람들 중 누가 가장 잘 맞는지 한눈에.
  const savedRanked = savedPeople
    .map((p) => {
      const label = p.mode === 'zodiac' ? findZodiac(p.value) : findStarSign(p.value);
      const canScore = p.mode === 'zodiac' ? !!myZodiac : !!myStar;
      const score = canScore
        ? p.mode === 'zodiac'
          ? computeCompat(dateKey, myZodiac!, p.value as ZodiacId).score
          : computeStarCompat(dateKey, myStar!, p.value as StarSignId).score
        : null;
      return { person: p, label, score };
    })
    .filter((r) => r.label)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  function pickSaved(p: SavedPerson) {
    setMode(p.mode);
    if (p.mode === 'zodiac') setFriendZodiac(p.value as ZodiacId);
    else setFriendStar(p.value as StarSignId);
    setUnlocked(false);
    setPicking(null);
  }

  function saveCurrentFriend(relation: RelationKey) {
    if (!friend) return;
    const { list, saved, duplicate } = addSavedPerson({ mode, value: friend, relation });
    setSavedPeople(list);
    if (duplicate) onToast('이미 저장돼 있어요');
    else if (saved) onToast('내 사람으로 저장했어요 ⭐ 다음엔 바로 확인할 수 있어요');
    else onToast('앗, 저장 공간이 부족해 저장을 못 했어요');
  }

  function forgetPerson(id: string) {
    setSavedPeople(removeSavedPerson(id));
  }

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
    try {
      const ok = await onAdUnlock();
      if (ok) setUnlocked(true);
      else onToast('광고를 끝까지 봐야 열려요');
    } catch {
      onToast('앗, 광고를 불러오지 못했어요');
    } finally {
      setBusy(false);
    }
  }

  async function unlockByShare() {
    if (busy || !myLabel || !friendLabel) return;
    setBusy(true);
    try {
      const invite = `${myLabel.emoji}${myLabel.label} × ${friendLabel.emoji}${friendLabel.label}\n오늘 우리 ${modeLabel} 궁합 얼마나 맞을까? 나 방금 봤어 👀\n[오늘쪽지] 친구 궁합에서 너도 확인해봐 💌`;
      const ok = await onShare(invite);
      if (ok) {
        setUnlocked(true);
        onToast('공유했어요! 결과를 열었어요 💌');
      }
      // 취소/실패 시엔 잠금 유지 (보상 위장 금지) — 별도 안내 없이 조용히.
    } catch {
      onToast('앗, 공유를 못 했어요');
    } finally {
      setBusy(false);
    }
  }

  async function brag() {
    if (!myLabel || !friendLabel || !result) return;
    const ohaeng = result.elements
      ? `\n${result.elements.aKo} × ${result.elements.bKo} = ${result.elements.flowKo} 조합`
      : '';
    const text = `[오늘쪽지] 오늘 우리 ${modeLabel} 궁합 ${result.score}점 · ${result.archetype} 💗\n${myLabel.emoji}${myLabel.label} × ${friendLabel.emoji}${friendLabel.label}${ohaeng}\n"${result.headline}"\n너도 누구랑 몇 점인지 봐봐 👀`;
    const ok = await onShare(text);
    onToast(ok ? '궁합 자랑 완료! 💌' : '앗, 공유를 못 했어요');
  }

  // 스토리에 올리는 바이럴 카드 — 광고 없이(확산 우선) 바로 이미지 저장.
  async function saveCard() {
    if (busy || !myLabel || !friendLabel || !result) return;
    setBusy(true);
    try {
      const ok = await saveCompatCard({ modeLabel, me: myLabel, friend: friendLabel, result });
      onToast(ok ? '궁합 카드 저장 완료! 📸 스토리에 올려봐요' : '앗, 저장을 못 했어요');
    } catch {
      onToast('앗, 저장 중 문제가 생겼어요');
    } finally {
      setBusy(false);
    }
  }

  // 띠/별자리 고르는 중
  if (picking) {
    return (
      <AppLayout
        onBack={picking === 'friend' && !friend ? () => setPicking(null) : onBack}
        title="친구 궁합"
      >
        <h2 className="h2">
          {picking === 'my' ? `내 ${modeLabel}는 뭐예요?` : `상대는 무슨 ${modeLabel}예요?`}
        </h2>
        <p className="lead">
          {modeLabel}만 고르면 돼요. 생년월일은 필요 없어요.
        </p>
        <div className="zodiac-grid zodiac-grid--full picker-grid">
          {options.map((z) => (
            <button key={z.id} type="button" className="zodiac-chip" onClick={() => choose(z.id)}>
              {z.emoji} {z.label}
            </button>
          ))}
        </div>
        <p className="pick-foot">
          <span className="pick-foot__lock" aria-hidden>🔒</span>
          이름·생년월일 없이 {modeLabel}만으로 봐요
        </p>
      </AppLayout>
    );
  }

  return (
    <AppLayout onBack={onBack} title="친구 궁합">
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

      {/* 아직 아무것도 안 고른 상태면 선택 영역을 남은 공간 중앙에 채워
          제목·버튼이 상단에 쏠려 아래가 비는 걸 막는다. */}
      <div className={!ready && savedRanked.length === 0 ? 'fill-rest' : undefined}>
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

      {savedRanked.length > 0 ? (
        <div className="saved-people">
          <p className="saved-people__title">💌 내 사람들 · 오늘의 랭킹</p>
          {savedRanked.map(({ person, label, score }) => {
            const rel = relationMeta(person.relation);
            return (
              <div className="saved-row" key={person.id}>
                <button type="button" className="saved-row__main" onClick={() => pickSaved(person)}>
                  <span className="saved-row__relation">{rel.emoji} {rel.label}</span>
                  <span className="saved-row__who">{label!.emoji} {label!.label}</span>
                  {score !== null ? (
                    <span className="saved-row__score num" style={{ color: scoreTextColor(score) }}>
                      {score}점
                    </span>
                  ) : (
                    <span className="saved-row__hint">내 {person.mode === 'zodiac' ? '띠' : '별자리'} 선택 필요</span>
                  )}
                </button>
                <button
                  type="button"
                  className="saved-row__del"
                  aria-label="내 사람 목록에서 지우기"
                  onClick={() => forgetPerson(person.id)}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {!ready ? (
        <p className="compat-hint">두 {modeLabel}를 고르면 오늘의 궁합이 나와요</p>
      ) : !unlocked ? (
        <div className="compat-lock">
          <div className="compat-lock__score">?</div>
          <p className="compat-lock__title">오늘 우리 궁합, 몇 점일까요?</p>
          <p className="compat-lock__teaser">
            케미 · 대화 · 갈등 관리 점수부터 오늘의 커플 유형, 잘 맞는 점과 팁까지 한 번에 나와요
          </p>
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
          <div className={`compat-result compat-result--${result.vibe} fade-in`}>
            <span className="compat-result__badge">{BAND_EMOJI[result.band]} 오늘의 {modeLabel} 궁합</span>
            <div className="compat-result__score num">{result.score}<small>점</small></div>
            <p className="compat-result__archetype">{result.archetype}</p>
            <p className="compat-result__head">{result.headline}</p>

            <div className="compat-cats">
              {result.categories.map((c) => (
                <div className="compat-cat" key={c.key}>
                  <span className="compat-cat__emoji" aria-hidden>{c.emoji}</span>
                  <span className="compat-cat__label">{c.label}</span>
                  <span className="compat-cat__score num">{c.score}</span>
                  <span className="compat-cat__bar">
                    <span
                      className="compat-cat__fill"
                      style={{ width: `${c.score}%`, background: scoreColor(c.score) }}
                    />
                  </span>
                </div>
              ))}
            </div>

            <p className="compat-result__reason">🔮 {result.reason}</p>

            {result.elements ? (
              <div className="compat-ohaeng">
                <span className="compat-ohaeng__pair">
                  {result.elements.aEmoji} {result.elements.aKo}
                  <i>×</i>
                  {result.elements.bEmoji} {result.elements.bKo}
                </span>
                <span className={`compat-ohaeng__flow compat-ohaeng__flow--${result.elements.flow}`}>
                  {result.elements.flowKo}
                </span>
              </div>
            ) : null}

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
            <button type="button" className="btn btn--secondary" disabled={busy} onClick={saveCard}>
              궁합 카드 이미지로 저장하기 📸
            </button>
            <button
              type="button"
              className="btn btn--ghost"
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

          <div className="save-person">
            <p className="save-person__title">이 사람, 내 사람으로 저장할까요?</p>
            <p className="save-person__desc">관계만 골라두면 다음부터 한 번에 바로 확인해요</p>
            <div className="save-person__chips">
              {RELATIONS.map((r) => (
                <button
                  type="button"
                  className="save-person__chip"
                  key={r.key}
                  onClick={() => saveCurrentFriend(r.key)}
                >
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
      </div>
      {ready ? <Disclaimer /> : null}
    </AppLayout>
  );
}
