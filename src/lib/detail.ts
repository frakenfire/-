import type { CategoryScore, LuckSet } from './luck';
import { ZODIACS, type Zodiac } from '../data/zodiac';
import { pickFresh } from './pickFresh';
import {
  BAND_TAG,
  CATEGORY_INTERP,
  CHARMS,
  MATCH_CAUTION_REASONS,
  MATCH_GOOD_REASONS,
  MISSION_TEMPLATES,
  NUMBER_HINTS,
  SUMMARY_TEMPLATES,
  band,
  type Band,
} from '../data/detailContent';

// 심층 리포트 — 광고를 눌러서라도 보고 싶은 보상 페이지의 콘텐츠를 seed 로 계산.

export type RankedCat = CategoryScore & { band: Band; bandTag: string; interp: string };

export type DetailReport = {
  ranked: RankedCat[]; // 점수 높은 순 정렬
  topPick: RankedCat; // 오늘의 원픽 (가장 좋은 운)
  watchOut: RankedCat; // 가장 조심할 운
  summary: string; // 4개 항목을 하나로 묶은 종합 총평
  match: { good: Zodiac; caution: Zodiac; goodReason: string; cautionReason: string }; // 오늘의 궁합
  mission: string; // 행운 미션 (행운 세트를 한 행동으로)
  numberUse: string; // 행운 숫자 활용법
  charm: string; // 오늘의 부적 문장
};

export function computeDetail(seed: number, luck: LuckSet): DetailReport {
  const ranked: RankedCat[] = luck.categories
    .map((c: CategoryScore) => {
      const b = band(c.score);
      return { ...c, band: b, bandTag: BAND_TAG[b], interp: CATEGORY_INTERP[c.key]?.[b] ?? '' };
    })
    .sort((a, b) => b.score - a.score);

  const topPick = ranked[0];
  const watchOut = ranked[ranked.length - 1];

  // 종합 총평 — 4개 항목 카드를 따로 보지 않아도, 리포트가 요약해준다.
  const gap = topPick.score - watchOut.score;
  const summary = pickFresh(SUMMARY_TEMPLATES, seed / 29, 'detail:summary')
    .replace('{top}', topPick.label)
    .replace('{watch}', watchOut.label)
    .replace('{gap}', String(gap));

  // 오늘의 궁합 — 잘 맞는 띠 / 조심할 띠 (서로 다르게), 근거 한 줄씩.
  const goodIdx = Math.abs(Math.trunc(seed / 5)) % ZODIACS.length;
  let cautionIdx = Math.abs(Math.trunc(seed / 37) + 6) % ZODIACS.length;
  if (cautionIdx === goodIdx) cautionIdx = (cautionIdx + 1) % ZODIACS.length;
  const goodReason = pickFresh(MATCH_GOOD_REASONS, seed / 41, 'detail:matchGood');
  const cautionReason = pickFresh(MATCH_CAUTION_REASONS, seed / 43, 'detail:matchCaution');

  const mission = pickFresh(MISSION_TEMPLATES, seed / 13, 'detail:mission')
    .replace('{time}', luck.time)
    .replace('{color}', luck.color.name)
    .replace('{dir}', luck.direction)
    .replace('{item}', luck.item)
    .replace('{food}', luck.food.name);

  const numberUse = pickFresh(NUMBER_HINTS, seed / 19, 'detail:numberUse').replace(
    '{n}',
    String(luck.number),
  );
  const charm = pickFresh(CHARMS, seed / 23, 'detail:charm');

  return {
    ranked,
    topPick,
    watchOut,
    summary,
    match: {
      good: ZODIACS[goodIdx],
      caution: ZODIACS[cautionIdx],
      goodReason,
      cautionReason,
    },
    mission,
    numberUse,
    charm,
  };
}
