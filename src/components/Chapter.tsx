import type { ReactNode } from 'react';
import { Sentences } from './Sentences.tsx';

type Props = {
  title: string;
  /** 이 덩이에 뭐가 들었는지 한 줄로. 홈의 '이 답은 이렇게 나와요' 만 쓴다 */
  hint?: string;
  /** 접어 둔다. 답이 아니라 근거와 재미처럼, 더 볼 사람만 여는 덩이 */
  fold?: boolean;
  children: ReactNode;
};

// 결과 화면의 큰 덩이.
//
// 답(오늘 풀이, 할 것, 미룰 것, 앞으로 기대할 것과 조심할 것)은 덩이 없이 카드로
// 바로 선다. 사주 근거와 재미 칸은 접어 둔다. 전부 펼쳐 두니 답을 받으러 온 사람이
// 화면을 한참 내려도 끝이 안 보인다는 말을 들었다(사장님).
export function Chapter({ title, hint, fold = false, children }: Props) {
  if (fold) {
    return (
      <details className="chap chap--fold">
        <summary className="chap__title">{title}</summary>
        <div className="chap__body">{children}</div>
      </details>
    );
  }
  return (
    <section className="chap">
      <p className="chap__title">{title}</p>
      {hint ? <Sentences className="chap__hint" text={hint} /> : null}
      <div className="chap__body">{children}</div>
    </section>
  );
}
