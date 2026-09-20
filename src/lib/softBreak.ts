// 제목 줄바꿈 — 브라우저는 폭이 차는 자리에서 그냥 끊는다. 그러면
// "푹 자는 게 오늘의 / 마지막 할 일이에요" 처럼 '오늘의' 와 '마지막' 사이가 갈린다.
// 토스 제목은 뜻 단위로 끊긴다. 긴 제목만 가운데 근처의 자연스러운 자리에서 미리 나눈다.
const GOOD_END = /(게|이|가|은|는|을|를|도|면|고|서|에|에서|로|으로|까지|부터|보다|처럼|마다|요[.,!?]?)$/;
const BAD_END = /(의|할|될|같은|이런|그런|어떤|모든|새|첫|한|두|세)$/;
// 앞말에 붙는 말(의존명사 등). 이 말 '앞'에서 끊으면 "푹 자는 / 게 오늘의…" 처럼
// 한 글자가 다음 줄 머리에 혼자 떨어진다. 반대로 이 말 '뒤'에서 끊는 건 멀쩡하다 -
// 앞말과 한 덩이를 이룬 채로 줄이 끝나기 때문이다. 그래서 길이만 보고
// '한 글자 뒤에서 끊지 않는다' 로 막으면, 정작 제일 자연스러운 자리를 막게 된다.
const BIND_BACK = new Set([
  '게', '것', '수', '데', '줄', '뿐', '바', '채', '적', '지', '리',
  '때', '만큼', '대로', '뻔', '만', '척', '듯',
]);

export function softBreak(text: string, minLen = 14): string {
  if (!text || text.includes('\n') || text.length < minLen) return text;
  const words = text.split(' ');
  if (words.length < 3) return text;
  const mid = text.length / 2;
  let best = -1;
  let bestScore = Infinity;
  let pos = 0;
  for (let i = 0; i < words.length - 1; i++) {
    pos += words[i].length + (i ? 1 : 0);
    let score = Math.abs(pos - mid);
    const here = words[i];
    const bindsBack = BIND_BACK.has(here.replace(/[.,!?]$/, ''));
    if (/[.!?]$/.test(here)) score -= 6;
    else if ((here.length <= 1 && !bindsBack) || BAD_END.test(here)) score += 8; // '이 시간' 의 '이' 뒤에서 끊지 않는다
    else if (GOOD_END.test(here)) score -= 3;
    // 다음 줄 머리에 앞말에 붙는 말이 혼자 오게 두지 않는다
    if (BIND_BACK.has(words[i + 1].replace(/[.,!?]$/, ''))) score += 8;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  if (best < 0) return text;
  return `${words.slice(0, best + 1).join(' ')}\n${words.slice(best + 1).join(' ')}`;
}
