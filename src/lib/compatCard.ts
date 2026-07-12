import { saveImageData } from './toss';
import type { CompatResult, CompatVibe } from './compat';

// 친구 궁합 결과 이미지 카드 — 인스타 스토리 규격(9:16).
// 이 카테고리 바이럴의 핵심 표면: "우리 궁합 90점" 카드를 스크린샷해 스토리에 올린다.

const CARD_FONT = "'Pretendard Variable', Pretendard, sans-serif";

type CompatCardInput = {
  modeLabel: string; // '띠' | '별자리'
  me: { emoji: string; label: string };
  friend: { emoji: string; label: string };
  result: CompatResult;
};

// vibe 별 배경/포인트 톤 (앱 화면과 동일 계열)
const VIBE_STYLE: Record<CompatVibe, { bg: string; card: string; accent: string; badge: string }> = {
  twin: { bg: '#ffe9f0', card: '#ffffff', accent: '#e64980', badge: '#ffd0e0' },
  harmony: { bg: '#e8f3ff', card: '#ffffff', accent: '#1b64da', badge: '#cfe4ff' },
  steady: { bg: '#f2f4f6', card: '#ffffff', accent: '#4e5968', badge: '#e5e8eb' },
  spark: { bg: '#fff4cc', card: '#ffffff', accent: '#d9820b', badge: '#ffe8a3' },
};

function scoreHex(score: number): string {
  if (score >= 85) return '#12b886';
  if (score >= 73) return '#3182f6';
  return '#f59f00';
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of [...text]) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function saveCompatCard(input: CompatCardInput): Promise<boolean> {
  try {
    try {
      await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
    } catch {
      /* 폰트 API 없으면 진행 */
    }
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const cx = W / 2;
    const { result, me, friend, modeLabel } = input;
    const style = VIBE_STYLE[result.vibe];
    const scoreColor = scoreHex(result.score);

    // 배경
    ctx.fillStyle = style.bg;
    ctx.fillRect(0, 0, W, H);

    // 카드
    const m = 72;
    const cardY = 150;
    const cardH = H - cardY - 150;
    ctx.fillStyle = style.card;
    roundRect(ctx, m, cardY, W - m * 2, cardH, 56);
    ctx.fill();

    ctx.textAlign = 'center';

    // 상단 배지
    ctx.fillStyle = style.accent;
    ctx.font = `bold 40px ${CARD_FONT}`;
    ctx.fillText(`💗 오늘의 ${modeLabel} 궁합`, cx, cardY + 110);

    // 나 × 상대 (이모지 크게)
    const emojiY = cardY + 300;
    ctx.font = `130px ${CARD_FONT}`;
    ctx.fillText(me.emoji, cx - 190, emojiY);
    ctx.fillText(friend.emoji, cx + 190, emojiY);
    ctx.fillStyle = '#8b95a1';
    ctx.font = `bold 64px ${CARD_FONT}`;
    ctx.fillText('×', cx, emojiY - 30);
    // 이름
    ctx.fillStyle = '#333d4b';
    ctx.font = `bold 40px ${CARD_FONT}`;
    ctx.fillText(me.label, cx - 190, emojiY + 90);
    ctx.fillText(friend.label, cx + 190, emojiY + 90);

    // 점수 (초대형) — 숫자 + '점' 을 한 그룹으로 가운데 정렬(겹침 방지)
    const scoreY = cardY + 620;
    const scoreStr = String(result.score);
    ctx.font = `bold 260px ${CARD_FONT}`;
    const numW = ctx.measureText(scoreStr).width;
    ctx.font = `bold 56px ${CARD_FONT}`;
    const unitW = ctx.measureText('점').width;
    const gap = 20;
    const groupStart = cx - (numW + gap + unitW) / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = scoreColor;
    ctx.font = `bold 260px ${CARD_FONT}`;
    ctx.fillText(scoreStr, groupStart, scoreY);
    ctx.fillStyle = '#8b95a1';
    ctx.font = `bold 56px ${CARD_FONT}`;
    ctx.fillText('점', groupStart + numW + gap, scoreY);
    ctx.textAlign = 'center';

    // 커플 유형 배지
    const badgeY = scoreY + 90;
    ctx.font = `bold 44px ${CARD_FONT}`;
    const bw = ctx.measureText(result.archetype).width + 90;
    ctx.fillStyle = style.badge;
    roundRect(ctx, cx - bw / 2, badgeY, bw, 84, 42);
    ctx.fill();
    ctx.fillStyle = style.accent;
    ctx.fillText(result.archetype, cx, badgeY + 58);

    // 오행 상성 (띠 궁합만) — 목/화/토/금/수 + 상생·상극·비화
    if (result.elements) {
      ctx.fillStyle = '#4e5968';
      ctx.font = `bold 36px ${CARD_FONT}`;
      ctx.fillText(
        `${result.elements.aKo} × ${result.elements.bKo} · ${result.elements.flowKo}`,
        cx,
        badgeY + 150,
      );
    }

    // 헤드라인
    ctx.fillStyle = '#191f28';
    ctx.font = `bold 52px ${CARD_FONT}`;
    const hlLines = wrapText(ctx, result.headline, W - m * 2 - 120);
    let hy = badgeY + (result.elements ? 240 : 190);
    hlLines.forEach((ln) => {
      ctx.fillText(ln, cx, hy);
      hy += 68;
    });

    // 3개 미니 점수 (케미/대화/갈등)
    const catY = hy + 60;
    const catW = (W - m * 2 - 120) / 3;
    const catStartX = m + 60 + catW / 2;
    result.categories.slice(0, 3).forEach((c, i) => {
      const x = catStartX + i * catW;
      ctx.fillStyle = '#6b7684';
      ctx.font = `bold 34px ${CARD_FONT}`;
      ctx.fillText(`${c.emoji} ${c.label}`, x, catY);
      ctx.fillStyle = scoreHex(c.score);
      ctx.font = `bold 60px ${CARD_FONT}`;
      ctx.fillText(String(c.score), x, catY + 74);
    });

    // 워터마크 + 초대 문구
    ctx.fillStyle = style.accent;
    ctx.font = `bold 40px ${CARD_FONT}`;
    ctx.fillText('너도 우리 궁합 봐봐 👀', cx, cardY + cardH - 120);
    ctx.fillStyle = '#8b95a1';
    ctx.font = `bold 34px ${CARD_FONT}`;
    ctx.fillText('오늘쪽지 뽑기 · 친구 궁합', cx, cardY + cardH - 60);

    const dataUrl = canvas.toDataURL('image/png');
    const now = new Date();
    const stamp = `${now.getFullYear()}${`${now.getMonth() + 1}`.padStart(2, '0')}${`${now.getDate()}`.padStart(2, '0')}-${`${now.getHours()}`.padStart(2, '0')}${`${now.getMinutes()}`.padStart(2, '0')}`;
    return await saveImageData(dataUrl, `today-note-compat-${stamp}.png`);
  } catch {
    return false;
  }
}
