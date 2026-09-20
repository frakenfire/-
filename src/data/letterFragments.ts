import type { IconName } from '../components/Icon.tsx';
import type { Mood } from '../types/fortune.ts';

// 쪽지 요정의 편지 조각 데이터베이스.
// 인사(시간대) × 공감(기분) × 이음말 × 조언 서두 × 맺음(기분) 을 조합하고,
// 본문은 운세 variant 에서 가져와 손편지처럼 엮는다. 조합 폭이 커서 매번 달라진다.
// 톤: 다정한 해요체, 요정이 나를 지켜봐 준 느낌. 금지 표현 없음.

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export const MOODS: { key: Mood; icon: IconName; label: string }[] = [
  { key: 'good', icon: 'faceGood', label: '기분 좋아요' },
  { key: 'soso', icon: 'faceSoso', label: '그냥 그래요' },
  { key: 'tired', icon: 'faceTired', label: '좀 지쳤어요' },
  { key: 'anxious', icon: 'faceAnxious', label: '불안해요' },
  { key: 'lonely', icon: 'faceLonely', label: '외로워요' },
];

// ── 인사 (시간대별) ──

// ── 공감 (기분별) ──

// ── 이음말 (본문으로 넘어가기) ──

// ── 조언 서두 (행운/할 일 소개) ──

// ── 맺음 (기분별) ──

