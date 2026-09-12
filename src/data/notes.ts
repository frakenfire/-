import type { Note, NoteColor } from '../types/fortune.ts';

// 쪽지 36장. 뽑는 재미를 위한 이름·아이콘·색상. 이름은 아이도 아는 말로.
export const NOTES: Note[] = [
  { id: 'slowly', name: '천천히 풀림', keyword: '정리', icon: 'feather', color: 'softGreen' },
  { id: 'rise', name: '다시 올라옴', keyword: '회복', icon: 'trendUp', color: 'softGreen' },
  { id: 'open', name: '살짝 열림', keyword: '기회', icon: 'door', color: 'cream' },
  { id: 'saveMoney', name: '새는 돈 막기', keyword: '절약', icon: 'wallet', color: 'softYellow' },
  { id: 'cleanup', name: '밀린 일 정리', keyword: '완료', icon: 'checklist', color: 'softGreen' },
  { id: 'contact', name: '가벼운 연락', keyword: '관계', icon: 'chat', color: 'softPink' },
  { id: 'timing', name: '좋은 타이밍', keyword: '타이밍', icon: 'clock', color: 'cream' },
  { id: 'careful', name: '조심스러운 선택', keyword: '신중', icon: 'compass', color: 'softYellow' },
  { id: 'help', name: '뜻밖의 도움', keyword: '인연', icon: 'link', color: 'softPink' },
  { id: 'smallWin', name: '작은 성공', keyword: '성취', icon: 'target', color: 'softGreen' },
  { id: 'light', name: '홀가분함', keyword: '여유', icon: 'balloon', color: 'cream' },
  { id: 'sticker', name: '행운 스티커', keyword: '행운', icon: 'sparkle', color: 'softYellow' },
  { id: 'spark', name: '반짝 아이디어', keyword: '영감', icon: 'bulb', color: 'softYellow' },
  { id: 'rest', name: '푹 쉬어가기', keyword: '휴식', icon: 'leaf', color: 'softGreen' },
  { id: 'courage', name: '용기 한 스푼', keyword: '용기', icon: 'flame', color: 'softPink' },
  { id: 'reunion', name: '반가운 재회', keyword: '재회', icon: 'clover', color: 'softPink' },
  { id: 'focus', name: '집중의 시간', keyword: '몰입', icon: 'headphone', color: 'cream' },
  { id: 'gift', name: '뜻밖의 선물', keyword: '보상', icon: 'gift', color: 'softYellow' },
  { id: 'deepBreath', name: '숨 한 번 고르기', keyword: '여유', icon: 'balloon', color: 'cream' },
  { id: 'firstStep', name: '첫걸음 떼기', keyword: '시작', icon: 'sunrise', color: 'softYellow' },
  { id: 'kindWord', name: '다정한 말 한마디', keyword: '관계', icon: 'heartSpark', color: 'softPink' },
  { id: 'luckyCoin', name: '굴러온 동전', keyword: '행운', icon: 'coin', color: 'softYellow' },
  { id: 'quietDay', name: '조용한 하루', keyword: '휴식', icon: 'moon', color: 'cream' },
  { id: 'bigSmile', name: '크게 웃기', keyword: '기분', icon: 'faceGood', color: 'softPink' },
  { id: 'sunnyMind', name: '맑은 마음', keyword: '정리', icon: 'sun', color: 'softYellow' },
  { id: 'newRoad', name: '새 길 찾기', keyword: '기회', icon: 'mountain', color: 'softGreen' },
  { id: 'warmHome', name: '포근한 집', keyword: '휴식', icon: 'home', color: 'cream' },
  { id: 'goodNews', name: '반가운 소식', keyword: '소식', icon: 'bell', color: 'softPink' },
  { id: 'sharpEye', name: '눈 크게 뜨기', keyword: '관찰', icon: 'gem', color: 'softGreen' },
  { id: 'teamUp', name: '같이 하기', keyword: '협력', icon: 'users', color: 'softGreen' },
  { id: 'letGo', name: '놓아주기', keyword: '정리', icon: 'drop', color: 'cream' },
  { id: 'flowerDay', name: '꽃 피는 날', keyword: '기쁨', icon: 'flower', color: 'softPink' },
  { id: 'steadyStep', name: '한 걸음씩', keyword: '꾸준함', icon: 'field', color: 'softGreen' },
  { id: 'braveNo', name: '아니라고 말하기', keyword: '용기', icon: 'blade', color: 'softYellow' },
  { id: 'lockIn', name: '마음 단단히', keyword: '안정', icon: 'lock', color: 'cream' },
  { id: 'tinyJoy', name: '작은 기쁨', keyword: '행복', icon: 'bowl', color: 'softYellow' },
];

export const NOTE_COLOR_CLASS: Record<NoteColor, string> = {
  softGreen: 'note--green',
  cream: 'note--cream',
  softYellow: 'note--yellow',
  softPink: 'note--pink',
};

export function findNote(id: string): Note | undefined {
  return NOTES.find((n) => n.id === id);
}
