// 아이콘 — 검증된 라이브러리(Lucide)를 쓴다.
//
// 처음엔 여기서 48개 아이콘의 좌표를 손으로 찍었다. 대조표로 렌더해 보니 여섯 개가
// 상자·막대사탕·향수병·연필로 읽혀 다시 그려야 했고, 나머지도 굵기와 균형이 고르지
// 않았다. AI 가 만든 화면의 표시 목록에는 "모델이 직접 그린 아이콘 SVG" 가 따로 한
// 항목으로 올라 있다. 좌표를 찍는 대신 이름만 고른다.
//
// 이름 체계(IconName)는 그대로 둔다. 쓰는 쪽은 바뀌지 않는다.
import type { LucideIcon } from 'lucide-react';
import {
  Heart, Moon, Bell, Lock, Calendar, Sunrise, Coins, Briefcase, TriangleAlert, Star,
  TreeDeciduous, Leaf, Sun, Lamp, Mountain, Wheat, Sword, Gem, Waves, Droplet,
  Feather, TrendingUp, DoorOpen, Wallet, ClipboardCheck, MessageCircle, Clock, Compass,
  Link, Target, Cloud, Sticker, Lightbulb, Flame, Clover, Headphones, Gift,
  Soup, Users, MessageCircleHeart, HeartHandshake, House, Flower2, UserRound,
  Smile, Meh, Annoyed, Frown, HeartCrack,
} from 'lucide-react';

export type IconName =
  | 'heart' | 'moon' | 'bell' | 'lock' | 'calendar' | 'sunrise' | 'coin' | 'briefcase'
  | 'alert' | 'star' | 'tree' | 'leaf' | 'sun' | 'candle' | 'mountain' | 'field'
  | 'blade' | 'gem' | 'wave' | 'drop' | 'feather' | 'trendUp' | 'door' | 'wallet'
  | 'checklist' | 'chat' | 'clock' | 'compass' | 'link' | 'target' | 'balloon'
  | 'sparkle' | 'bulb' | 'flame' | 'clover' | 'headphone' | 'gift' | 'bowl' | 'users'
  | 'heartSpark' | 'heartPair' | 'home' | 'flower' | 'faceGood' | 'faceSoso'
  | 'faceTired' | 'faceAnxious' | 'faceLonely' | 'person';

const ICONS: Record<IconName, LucideIcon> = {
  heart: Heart, moon: Moon, bell: Bell, lock: Lock, calendar: Calendar, sunrise: Sunrise,
  coin: Coins, briefcase: Briefcase, alert: TriangleAlert, star: Star,
  // 일간 10종
  tree: TreeDeciduous, leaf: Leaf, sun: Sun, candle: Lamp, mountain: Mountain, field: Wheat,
  blade: Sword, gem: Gem, wave: Waves, drop: Droplet,
  // 쪽지 18종
  feather: Feather, trendUp: TrendingUp, door: DoorOpen, wallet: Wallet, checklist: ClipboardCheck,
  chat: MessageCircle, clock: Clock, compass: Compass, link: Link, target: Target,
  balloon: Cloud, sparkle: Sticker, bulb: Lightbulb, flame: Flame, clover: Clover,
  headphone: Headphones, gift: Gift,
  // 음식 · 관계 · 기분
  bowl: Soup, users: Users, heartSpark: MessageCircleHeart, heartPair: HeartHandshake,
  home: House, flower: Flower2, person: UserRound,
  faceGood: Smile, faceSoso: Meh, faceTired: Annoyed, faceAnxious: Frown, faceLonely: HeartCrack,
};

type Props = { name: IconName; size?: number };

export function Icon({ name, size = 22 }: Props) {
  const Glyph = ICONS[name];
  return <Glyph size={size} strokeWidth={1.8} absoluteStrokeWidth aria-hidden focusable="false" />;
}
