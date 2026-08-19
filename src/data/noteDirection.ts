// 쪽지의 방향 — 뽑은 쪽지가 결과를 실제로 바꾸게 하는 장치.
//
// 왜 필요한가:
//   19장 중 하나를 고르게 해놓고, 그 선택이 결과의 한 줄만 바꿨다.
//   유저 입장에선 뒷면이 다 똑같은 셔플이라 '고른' 느낌이 없다.
//   게다가 쪽지는 "한 걸음 내딛기 좋은 날" 인데 본문은 "루틴만 지켜도 남는 장사" 라고
//   말하는 일이 생겼다. 두 처방이 부딪히면 유저는 뭘 하라는 건지 모른다.
//
// 그래서 쪽지마다 방향을 선언하고, 본문 변주도 같은 잣대로 분류해
// 쪽지와 반대되는 변주는 후보에서 뺀다. 고른 쪽지가 결과의 결을 정하게 된다.

/** push = 나서라 / hold = 쉬어가라 / any = 어느 쪽이든 어울림 */
export type NoteDirection = 'push' | 'hold' | 'any';

export const NOTE_DIRECTION: Record<string, NoteDirection> = {
  slowly: 'hold', // 천천히 풀림
  rise: 'push', // 다시 올라옴
  open: 'push', // 살짝 열림
  saveMoney: 'hold', // 새는 돈 막기
  cleanup: 'push', // 밀린 일 정리
  contact: 'push', // 가벼운 연락
  timing: 'push', // 좋은 타이밍
  careful: 'hold', // 조심스러운 선택
  help: 'any', // 뜻밖의 도움
  smallWin: 'push', // 작은 성공
  light: 'hold', // 홀가분함
  sticker: 'any', // 행운 스티커
  spark: 'push', // 반짝 아이디어
  rest: 'hold', // 푹 쉬어가기
  courage: 'push', // 용기 한 스푼
  reunion: 'any', // 반가운 재회
  focus: 'hold', // 집중의 시간 — 벌리지 않고 하나로 좁히는 쪽
  gift: 'any', // 뜻밖의 선물
};

// 본문 변주를 같은 잣대로 나누는 어휘. 손으로 42개를 태깅하면 문장이 늘 때마다 어긋나므로,
// 표현에서 방향을 읽는다. 규칙이 고정돼 있어 결과는 여전히 결정적이다.
const PUSH_WORDS =
  /내딛|밀어붙|시작해|도전|먼저 (연락|말|손)|움직이|잡으|나서|꺼내|던져|시도|질러|뛰어들|열어/;
const HOLD_WORDS =
  /쉬어|미루|천천히|기다|참|늦추|접어|아끼|줄이|비우|가만|무리하지|서두르지|루틴|평소처럼|그대로|지키/;

/** 문장 뭉치에서 방향을 읽는다. 양쪽 다 걸리거나 아무것도 안 걸리면 'any'. */
export function directionOfText(text: string): NoteDirection {
  const push = PUSH_WORDS.test(text);
  const hold = HOLD_WORDS.test(text);
  if (push === hold) return 'any';
  return push ? 'push' : 'hold';
}

/** 쪽지 방향과 정면으로 부딪히는가 */
export function conflicts(note: NoteDirection, body: NoteDirection): boolean {
  if (note === 'any' || body === 'any') return false;
  return note !== body;
}
