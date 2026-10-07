import type { ConcernKey } from '../concerns.ts';
import partA from './partA.ts';
import partB from './partB.ts';

// 뽑은 쪽지가 오늘 무엇을 말하는가.
//
// 결과 화면에는 쪽지 이름만 떠 있었다. 고민 풀이는 달과 해 단위라 한 달 내내
// 거의 같은 화면이었고, 그래서 매일 뽑아도 뽑은 게 화면을 바꾸지 않았다.
// 쪽지 서른여섯 장 x (고민 여섯 + 고민 없이 뽑기) 마다 오늘 할 말을 따로 쓴다.
// 하루에 보이는 쪽지 여섯 장이 날마다 바뀌니 이 줄도 날마다 바뀐다.
export type NoteTodayKey = ConcernKey | 'none';

export const NOTE_TODAY: Record<string, Record<NoteTodayKey, string>> = { ...partA, ...partB };

// 고민 한 칸은 그 고민의 네 상황 누구에게나 맞게 쓴다. 그래도 맞출 수 없는
// 칸만 상황별로 덮는다. 끝난 사이가 남은 사람에게 '마음 가는 사람에게 먼저
// 연락하세요' 가 가면 헤어진 사람에게 연락하라는 말로 읽힌다.
const BY_OPTION: Record<string, Record<string, string>> = {
  'love/past': {
    courage: '하고 싶던 말을 끝까지 정리할 수 있는 날이에요. 그래서 그 사람에게 보내지 말고 메모장에 한 문장으로만 적어두면, 같은 말을 머릿속으로 되풀이하는 밤이 끝나요.',
    contact: '지난 사이 대신 지금 곁에 있는 친구와 짧게 말을 나누기 좋은 날이에요. 그래서 오늘 점심 사진 한 장에 한 줄을 붙여 친구에게 보내두면, 그 사람 생각이 날 틈이 줄어요.',
    firstStep: '지난 사이에서 한 걸음 떨어지는 첫날로 삼기 좋은 날이에요. 그래서 그 사람 대화방 알림을 오늘 꺼두면, 휴대폰이 울릴 때마다 혹시 하는 마음이 줄어요.',
  },
};

export function noteTodayOf(noteId: string, concern: ConcernKey | null, optionKey: string | null = null): string | null {
  const over = concern && optionKey ? BY_OPTION[`${concern}/${optionKey}`]?.[noteId] : undefined;
  return over ?? NOTE_TODAY[noteId]?.[concern ?? 'none'] ?? null;
}
