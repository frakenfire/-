import { useEffect, useState } from 'react';
import { dayPartOf, type DayPart } from './dayPart.ts';

// 지금이 하루의 어느 토막인지를 화면이 계속 따라가게 한다.
//
// 토막을 그릴 때 한 번만 재고 끝내면, 미니앱을 켜둔 채 시간이 흐르는 동안
// 화면은 계속 처음 잰 값을 말한다. 두 시에 열어두고 일곱 시에 다시 보면
// 아직도 '오후' 라고 인사한다. 토스는 미니앱을 바로 안 내리고 살려두므로
// 이건 드문 일이 아니다. 실제로 '오후가 아닌데 자꾸 오후라고 나온다' 는
// 말을 들었다.
//
// 앱이 다시 보일 때와, 켜둔 채 경계를 넘길 때 두 경우를 다 본다.
// 값이 그대로면 setState 를 안 불러서 헛 렌더는 안 난다.
const 한_번씩_보는_간격 = 60_000;

export type Clock = { part: DayPart; at: Date };

export function useDayPart(): Clock {
  const [clock, setClock] = useState<Clock>(() => ({ part: dayPartOf(), at: new Date() }));
  useEffect(() => {
    // 시가 바뀔 때마다 새로 담는다. 토막만 보고 갈아끼우면 모자란다 -
    // 행운의 시간은 7·13·15·19시에서 갈리는데 그 셋은 다 '오후' 안에 있어서
    // 토막은 그대로다. 경계는 전부 정각이라 시 단위면 다 잡힌다.
    const tick = () => {
      const now = new Date();
      const part = dayPartOf(now);
      setClock((cur) => (cur.part === part && cur.at.getHours() === now.getHours() ? cur : { part, at: now }));
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    const id = window.setInterval(tick, 한_번씩_보는_간격);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(id);
    };
  }, []);
  return clock;
}
