// 제목 줄바꿈 — 브라우저는 폭이 차는 자리에서 그냥 끊는다. 그러면
// "푹 자는 게 오늘의 / 마지막 할 일이에요" 처럼 '오늘의' 와 '마지막' 사이가 갈린다.
// 토스 제목은 뜻 단위로 끊긴다. 긴 제목만 가운데 근처의 자연스러운 자리에서 미리 나눈다.
const GOOD_END = /(게|이|가|은|는|을|를|도|면|고|서|에|에서|로|으로|까지|부터|보다|처럼|마다|요[.,!?]?)$/;
const BAD_END = /(의|할|될|같은|이런|그런|어떤|모든|새|첫|한|두|세)$/;

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
    if (/[.!?]$/.test(words[i])) score -= 6;
    else if (BAD_END.test(words[i])) score += 8;
    else if (GOOD_END.test(words[i])) score -= 3;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  if (best < 0) return text;
  return `${words.slice(0, best + 1).join(' ')}\n${words.slice(best + 1).join(' ')}`;
}
