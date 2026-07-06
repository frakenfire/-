import { AppLayout } from '../components/AppLayout';
import { BottomAction } from '../components/BottomAction';
import { HOME } from '../data/copy';

// PRD §5.1 — 홈. 진입 직후 광고/바텀시트 없음.
export function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <AppLayout
      bottom={
        <BottomAction onClick={onStart} ariaLabel="내일쪽지 뽑기 시작">
          {HOME.cta}
        </BottomAction>
      }
    >
      <div className="center-hero">
        <div className="note-illust" aria-hidden>
          📩
        </div>
        <h1 className="h1">{HOME.title}</h1>
        <p className="lead">{HOME.lead}</p>
      </div>
    </AppLayout>
  );
}
