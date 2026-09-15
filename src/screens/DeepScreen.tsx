import { AppLayout } from '../components/AppLayout.tsx';
import { Disclaimer } from '../components/Disclaimer.tsx';
import { DeepSections } from '../components/DeepSections.tsx';
import { findConcern, type ConcernKey } from '../data/concerns.ts';
import type { DeepRead } from '../lib/deepRead.ts';
import type { TimingRead } from '../lib/timing.ts';

type Props = {
  concernKey: ConcernKey;
  read: DeepRead;
  timing: TimingRead;
  userName: string | null;
  busy: boolean;
  onShare: () => void;
  onCopy: () => void;
  onBack: () => void;
};

// 상담만 따로 볼 때의 화면. 홈의 '더 해보기' 에서 들어온다.
// 쪽지를 뽑는 본 흐름에서는 같은 내용이 결과 화면 안에 들어간다.
export function DeepScreen({ concernKey, read, timing, userName, busy, onShare, onCopy, onBack }: Props) {
  const concern = findConcern(concernKey);
  return (
    <AppLayout
      onBack={onBack}
      title={concern.resultTitle}
      bottom={
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onShare}>
          친구한테 보내기
        </button>
      }
    >
      <DeepSections concernKey={concernKey} read={read} timing={timing} userName={userName} />

      <div className="share-row">
        <button type="button" className="btn btn--primary share-row__btn" disabled={busy} onClick={onShare}>
          카톡·메시지로 보내기
        </button>
        <button type="button" className="btn btn--secondary share-row__btn" disabled={busy} onClick={onCopy}>
          복사하기
        </button>
      </div>

      <Disclaimer />
    </AppLayout>
  );
}
