// 행운 반쪽 — 친구에게 건네는 짧은 한마디.
//
// 봉투에는 이 목록의 번호만 실어 보낸다. 보낸 사람의 점수·고민·생년월일은
// 한 글자도 안 나간다. 받은 사람이 보는 건 아래 문장 하나뿐이다.
// 서버가 없으니 번호가 곧 내용이다. 번호를 바꾸거나 지우면 이미 보낸
// 봉투가 엉뚱한 말을 하게 되므로, 고칠 때는 뒤에 새로 붙인다.

export type Gift = { id: number; line: string };

const GIFTS: Gift[] = [
  { id: 1, line: '오늘 좋은 일이 하나쯤 생기길 바라요.' },
  { id: 2, line: '네가 웃는 하루였으면 좋겠어.' },
  { id: 3, line: '작은 행운 하나 놓고 갈게.' },
  { id: 4, line: '오늘은 너한테 운이 따라줬으면 해.' },
  { id: 5, line: '바쁘더라도 밥은 꼭 챙겨 먹어.' },
  { id: 6, line: '요즘 많이 애쓴 거 알아. 오늘만큼은 조금 편히 쉬었으면 좋겠다.' },
  { id: 7, line: '기다리던 연락이 오늘 오면 좋겠다.' },
  { id: 8, line: '오늘 하루는 생각보다 잘 풀릴 거야.' },
  { id: 9, line: '네 편이 되어줄 사람이 여기 있어.' },
  { id: 10, line: '퇴근길에 좋아하는 거 하나 사 먹어.' },
  { id: 11, line: '오늘은 걱정을 조금 내려놔도 괜찮아.' },
  { id: 12, line: '생각나서 보냈어. 오늘도 별일 없이 잘 지내.' },
];

export function findGift(id: number): Gift | null {
  return GIFTS.find((g) => g.id === id) ?? null;
}

/**
 * 오늘 고를 수 있는 세 장. 날짜로 고정해서, 같은 날 다시 열어도 같은 세 장이다.
 * 매번 바뀌면 '아까 그 말' 을 다시 못 찾는다.
 */
export function giftChoices(dateKey: string): Gift[] {
  let h = 0;
  for (const ch of dateKey) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const start = h % GIFTS.length;
  // 이웃한 번호끼리는 말투가 비슷하다. 넷씩 건너뛰어 세 장이 서로 다르게 읽히게 한다.
  return [0, 4, 8].map((k) => GIFTS[(start + k) % GIFTS.length]);
}

/**
 * 받은 링크에서 봉투 번호를 읽는다. 없거나 모르는 번호면 null.
 *
 * 토스 공유 링크가 웹뷰를 어떤 모양으로 여는지(경로·쿼리·해시)는 기기와
 * 버전마다 확인되지 않았다. 그래서 세 군데를 다 본다.
 *   /gift?m=3   #/gift?m=3   ?gift=3
 */
export function readGiftId(loc: { pathname: string; search: string; hash: string }): number | null {
  const fromQuery = (q: string, key: string) => {
    const v = new URLSearchParams(q).get(key);
    return v && /^\d{1,3}$/.test(v) ? Number(v) : null;
  };
  let id: number | null = null;
  if (/\/gift\/?$/.test(loc.pathname)) id = fromQuery(loc.search, 'm');
  if (id === null && loc.hash.startsWith('#/gift')) {
    const q = loc.hash.indexOf('?');
    if (q >= 0) id = fromQuery(loc.hash.slice(q), 'm');
  }
  if (id === null) id = fromQuery(loc.search, 'gift');
  return id !== null && findGift(id) ? id : null;
}

/**
 * 단톡방으로 나가는 글. 링크는 shareMessage 가 붙인다.
 * 한마디는 여기 안 적는다. 미리 읽히면 봉투를 열 이유가 없다.
 */
export function buildGiftShareText(): string {
  return [
    `오늘의 마음 한장에서 행운의 한마디가 도착했어요.`,
    ``,
    `봉투를 열면 짧은 한마디가 나와요.`,
    `열어보고 너도 오늘 쪽지 한 장 뽑아봐.`,
  ].join('\n');
}
