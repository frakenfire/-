import { AppLayout } from '../components/AppLayout';
import { FortuneTypeButton } from '../components/FortuneTypeButton';
import { Mascot } from '../components/Mascot';
import { FORTUNE_TYPES } from '../data/fortuneTypes';
import { HOME } from '../data/copy';
import type { FortuneType } from '../types/fortune';

function todayLabel(): string {
  const d = new Date();
  const week = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${week}) · 오늘의 쪽지`;
}

// PRD §5.1 + UX 개선 — 홈에서 바로 운세를 고르게(탭 최소화) + 받는 가치 노출.
// 진입 직후 광고/바텀시트 없음.
export function HomeScreen({ onSelect }: { onSelect: (t: FortuneType) => void }) {
  return (
    <AppLayout>
      <div className="home-hero">
        <div className="home-hero__top">
          <div>
            <span className="date-pill">{todayLabel()}</span>
            <h1 className="h1">{HOME.title}</h1>
          </div>
          <Mascot size={84} />
        </div>
        <p className="home-hero__sub">
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
