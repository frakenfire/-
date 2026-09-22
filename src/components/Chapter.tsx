import type { ReactNode } from 'react';

type Props = {
  title: string;
  /** 이 덩이에 뭐가 들었는지 한 줄로 */
  hint: string;
  children: ReactNode;
};

// 결과 화면의 큰 덩이.
//
// 전에는 접었다 펴는 덩이(Fold)였다. 흰 카드를 여덟 장 세워두면 어디까지가
// 결론이고 어디부터가 근거인지 안 보여서 접어뒀는데, 접으니 답의 절반이
// 숨었다. '왜 그렇게 해야 하나' 가 접힘 안에 들어가 있었다.
//
// 대신 제목으로 나눈다. 네 덩이가 순서대로 읽히면 접을 이유가 없다.
//   지금 어떻게 하면 될까요 → 왜 그렇게 해야 할까요
//   → 시기별로는 이렇게 → 다양한 관점에서 본 나의 사주
export function Chapter({ title, hint, children }: Props) {
  return (
    <section className="chap">
      <p className="chap__title">{title}</p>
      <p className="chap__hint">{hint}</p>
      <div className="chap__body">{children}</div>
    </section>
  );
}
