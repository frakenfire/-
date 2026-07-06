import { AppLayout } from '../components/AppLayout';
import { FortuneTypeButton } from '../components/FortuneTypeButton';
import { Mascot } from '../components/Mascot';
import { FORTUNE_TYPES } from '../data/fortuneTypes';
import { HOME } from '../data/copy';
import type { FortuneType } from '../types/fortune';

function todayLabel(): string {
  const d = new Date();
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${week})`;
}

// 시간대별 인사 — 매번 조금 다른 첫인상 (매일 보고 싶게)
function greeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return '좋은 아침이에요 ☀️';
  if (h >= 11 && h < 17) return '오후도 잘 버티고 있죠? 🍀';
  if (h >= 17 && h < 22) return '오늘도 수고했어요 🌙';
  return '늦은 밤까지 애썼어요 ✨';
}

type Props = {
  streak: number;
  onSelect: (t: FortuneType) => void;
};

// PRD §5.1 + 리텐션 — 스트릭 배지 + 시간대 인사 + 진입 즉시 운세 선택.
export function HomeScreen({ streak, onSelect }: Props) {
  return (
    <AppLayout>
      <div className="home-hero">
        <div className="home-hero__top">
          <div>
            <div className="pill-row">
              <span className="date-pill">{todayLabel()}</span>
              {streak >= 2 ? (
                <span className="streak-pill">🔥 {streak}일째 쪽지</span>
              ) : (
                <span className="streak-pill streak-pill--new">🌱 오늘의 첫 쪽지</span>
              )}
            </div>
            <h1 className="h1">{HOME.title}</h1>
          </div>
          <Mascot size={84} score={streak >= 3 ? 90 : 80} />
        </div>
        <p className="home-hero__sub">
          {greeting()}
          <br />
          쪽지 한 장에 <b>총운 점수</b>부터 <b>행운 세트</b>까지 쏙.
          <br />
          오늘은 뭐가 궁금해요?
        </p>
      </div>

      <div className="menu-list">
        {FORTUNE_TYPES.map((meta) => (
          <FortuneTypeButton key={meta.key} meta={meta} onClick={() => onSelect(meta.key)} />
        ))}
      </div>
    </AppLayout>
  );
}
