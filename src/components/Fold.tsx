import { useState, type ReactNode } from 'react';

type Props = {
  title: string;
  /** 접혀 있을 때 안에 뭐가 들었는지 한 줄로 */
  hint: string;
  /** 처음부터 펴둘 것인가 */
  open?: boolean;
  children: ReactNode;
};

// 접었다 펴는 덩이.
//
// 흰 카드를 여덟 장 세워두면 어디까지가 결론이고 어디부터가 근거인지 안 보인다.
// 위에서 답을 다 받고, 더 볼 사람만 열어보게 한다. 닫혀 있어도 안에 뭐가 있는지는
// 한 줄로 말해줘야 '내용이 사라졌나' 가 안 생긴다.
export function Fold({ title, hint, open = false, children }: Props) {
  const [on, setOn] = useState(open);
  return (
    <section className={`fold${on ? ' fold--on' : ''}`}>
      <button type="button" className="fold__head" aria-expanded={on} onClick={() => setOn((v) => !v)}>
        <span className="fold__text">
          <span className="fold__title">{title}</span>
          <span className="fold__hint">{hint}</span>
        </span>
        <span className="fold__chev" aria-hidden>
          {on ? '접기' : '보기'}
        </span>
      </button>
      {on ? <div className="fold__body">{children}</div> : null}
    </section>
  );
}
