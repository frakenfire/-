import type { Note, NoteColor } from '../types/fortune';

// PRD §14 — 쪽지 데이터 12개. 뽑는 재미를 위한 이름·아이콘·색상.
export const NOTES: Note[] = [
  { id: 'slowly', name: '천천히 풀림', keyword: '정리', icon: '🍃', color: 'softGreen' },
  { id: 'rise', name: '다시 올라옴', keyword: '회복', icon: '📈', color: 'softGreen' },
  { id: 'open', name: '살짝 열림', keyword: '기회', icon: '🚪', color: 'cream' },
  { id: 'saveMoney', name: '새는 돈 막기', keyword: '절약', icon: '🪙', color: 'softYellow' },
  { id: 'cleanup', name: '밀린 일 정리', keyword: '완료', icon: '🗂️', color: 'softGreen' },
  { id: 'contact', name: '가벼운 연락', keyword: '관계', icon: '💬', color: 'softPink' },
  { id: 'timing', name: '좋은 타이밍', keyword: '타이밍', icon: '⏰', color: 'cream' },
  { id: 'careful', name: '조심스러운 선택', keyword: '신중', icon: '🧭', color: 'softYellow' },
  { id: 'help', name: '뜻밖의 도움', keyword: '인연', icon: '🤝', color: 'softPink' },
  { id: 'smallWin', name: '작은 성공', keyword: '성취', icon: '🎯', color: 'softGreen' },
  { id: 'light', name: '홀가분함', keyword: '여유', icon: '🎈', color: 'cream' },
  { id: 'sticker', name: '행운 스티커', keyword: '행운', icon: '⭐', color: 'softYellow' },
  { id: 'spark', name: '반짝 아이디어', keyword: '영감', icon: '💡', color: 'softYellow' },
  { id: 'rest', name: '푹 쉬어가기', keyword: '휴식', icon: '🌿', color: 'softGreen' },
  { id: 'courage', name: '용기 한 스푼', keyword: '용기', icon: '🔥', color: 'softPink' },
  { id: 'reunion', name: '반가운 재회', keyword: '재회', icon: '🍀', color: 'softPink' },
  { id: 'focus', name: '집중의 시간', keyword: '몰입', icon: '🎧', color: 'cream' },
  { id: 'gift', name: '뜻밖의 선물', keyword: '보상', icon: '🎁', color: 'softYellow' },
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
