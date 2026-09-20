import { useState } from 'react';
import { AdBadge } from './AdNotice.tsx';
import { Icon } from './Icon.tsx';
import { CONCERNS, type ConcernKey } from '../data/concerns.ts';

type Props = {
  /** 지금 보고 있는 고민. 목록에서 뺀다 */
  current: ConcernKey;
  /** 오늘 이미 열어둔 고민들. 광고를 다시 보게 하지 않는다 */
  unlocked: string[];
  /** 광고를 보여주고 열렸는지 돌려준다 */
  onUnlock: (key: ConcernKey) => Promise<boolean>;
  /** 이미 열린 고민으로 바로 간다 */
  onOpen: (key: ConcernKey) => void;
};

// 광고를 어디에 두느냐.
//
// 결과를 보기 전에 막으면 그 자리에서 나간다. 본문 중간에 끼우면 읽던 흐름이
// 끊기고 어디까지가 내 사주고 어디부터가 광고인지 헷갈린다. 둘 다 이 앱이
// 팔려고 하는 신뢰를 깎는다.
//
// 그래서 광고는 딱 한 자리에만 둔다 — 결과를 끝까지 본 사람이 '이건 봤고,
// 다른 것도 궁금한데' 하는 지점. 받을 걸 다 받은 뒤에 더 받겠냐고 묻는 것이다.
// 여기서 여는 건 계산이 이미 끝나 있는 다른 고민의 답 한 벌이라, 광고 하나에
// 돌려주는 값이 분명하다.
//
// 지키는 선 셋.
//  - 본문은 전부 무료다. 사주 계산은 이 앱의 본질이라 값을 매기지 않는다
//  - 광고임을 배지로 적는다. 눌러야 아는 광고는 안 만든다
//  - 한 번 연 고민은 그날 다시 묻지 않는다. 같은 값에 두 번 받으면 통행료다
export function MoreConcerns({ current, unlocked, onUnlock, onOpen }: Props) {
  const [busy, setBusy] = useState<ConcernKey | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const rest = CONCERNS.filter((c) => c.key !== current);

  async function tap(key: ConcernKey) {
    if (busy) return;
    if (unlocked.includes(key)) {
      onOpen(key);
      return;
    }
    setBusy(key);
    setFailed(null);
    try {
      const ok = await onUnlock(key);
      if (!ok) setFailed('광고를 끝까지 봐야 열려요');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="sec-card">
      <p className="cat4__head">다른 고민도 궁금하면</p>
      <p className="more__lead">
        같은 명식으로 답만 다시 계산해요. 지금 보신 내용은 그대로 있어요.
      </p>
      <ul className="more">
        {rest.map((c) => {
          const open = unlocked.includes(c.key);
          return (
            <li key={c.key}>
              <button
                type="button"
                className="more__row"
                disabled={busy !== null}
                onClick={() => tap(c.key)}
              >
                <span className="more__icon" aria-hidden>
                  <Icon name={c.icon} size={22} />
                </span>
                <span className="more__body">
                  <span className="more__label">{c.label}</span>
                  <span className="more__hook">{c.hook}</span>
                </span>
                {open ? (
                  <span className="more__open">보기</span>
                ) : (
                  <AdBadge label="광고" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {failed ? <p className="more__warn">{failed}</p> : null}
    </div>
  );
}
