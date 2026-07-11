import { scoreColor } from './luck';
import { moodFromScore } from '../components/Mascot';
import { saveImageData } from './toss';
import type { Rarity } from './rarity';

// PRD §7.2 + 리서치 — 세로 공유 카드. 마스코트 + 총운 점수 + 콕 집은 한마디.
// 등급(전설/에픽)이 뜨면 카드 자체가 금박/보라 트로피가 되어 자랑을 유발한다.

type SaveInput = {
  title: string;
  subtitle: string;
  headline: string; // 기분에 맞춘 하루 설계 한 줄 (카드 주인공)
  shareLine: string;
  total: number;
  grade: string;
  tag: string;
  rarity: Rarity;
};

// 등급별 카드 트리트먼트
const TIER_STYLE: Record<Rarity['tier'], { bg: string; card: string; border: string | null; accent: string }> = {
  common: { bg: '#f2f4f6', card: '#ffffff', border: null, accent: '#333d4b' },
  rare: { bg: '#e8f1fd', card: '#f6faff', border: '#9dc3f0', accent: '#2f6fd0' },
  epic: { bg: '#efe6fc', card: '#faf6ff', border: '#c9a8ef', accent: '#7b3fd4' },
  legendary: { bg: '#f7ecc8', card: '#fffcef', border: '#e7c15a', accent: '#b8860b' },
};

function resolveScoreColor(score: number): string {
  const v = scoreColor(score);
  if (v.includes('high')) return '#12b886';
  if (v.includes('mid')) return '#3182f6';
  return '#f59f00';
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 캔버스용 마스코트 (Mascot.tsx의 단순화 버전, 점수로 표정 결정)
function drawMascot(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, score: number) {
  const mood = moodFromScore(score);
  const u = s / 200; // 200 기준 스케일
  ctx.save();
  ctx.translate(cx - s / 2, cy - s / 2);
  ctx.scale(u, u);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 배경 원
  ctx.fillStyle = '#e8f3ff';
  ctx.beginPath();
  ctx.arc(100, 100, 92, 0, Math.PI * 2);
  ctx.fill();

  // 쪽지 몸통
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#333d4b';
  ctx.lineWidth = 5;
  roundRect(ctx, 46, 66, 94, 80, 10);
  ctx.fill();
  ctx.stroke();

  // 볼
  ctx.fillStyle = '#ffc7b0';
  ctx.beginPath();
  ctx.arc(76, 126, 7, 0, Math.PI * 2);
  ctx.arc(124, 126, 7, 0, Math.PI * 2);
  ctx.fill();

  // 눈
  ctx.strokeStyle = '#333d4b';
  ctx.fillStyle = '#333d4b';
  ctx.lineWidth = 5;
  if (mood === 'grin') {
    ctx.beginPath();
    ctx.moveTo(69, 120);
    ctx.quadraticCurveTo(76, 111, 83, 120);
    ctx.moveTo(117, 120);
    ctx.quadraticCurveTo(124, 111, 131, 120);
    ctx.stroke();
  } else {
    const r = mood === 'calm' ? 4.5 : 5.5;
    ctx.beginPath();
    ctx.arc(76, 118, r, 0, Math.PI * 2);
    ctx.arc(124, 118, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 입
  ctx.beginPath();
  if (mood === 'grin') {
    ctx.moveTo(85, 130);
    ctx.quadraticCurveTo(100, 150, 115, 130);
    ctx.fillStyle = '#333d4b';
    ctx.fill();
  } else if (mood === 'calm') {
    ctx.moveTo(92, 132);
    ctx.quadraticCurveTo(100, 138, 108, 132);
    ctx.stroke();
  } else {
    ctx.moveTo(88, 130);
    ctx.quadraticCurveTo(100, 142, 112, 130);
    ctx.stroke();
  }
  ctx.restore();
}

export async function saveResultCard(input: SaveInput): Promise<boolean> {
  try {
    const W = 720;
    const H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const cx = W / 2;
    const accent = resolveScoreColor(input.total);
    const tier = TIER_STYLE[input.rarity.tier];

    // 배경 (등급 톤)
    ctx.fillStyle = tier.bg;
    ctx.fillRect(0, 0, W, H);
    // 카드 (등급 테두리)
    const m = 48;
    ctx.fillStyle = tier.card;
    roundRect(ctx, m, m, W - m * 2, H - m * 2, 36);
    ctx.fill();
    if (tier.border) {
      ctx.strokeStyle = tier.border;
      ctx.lineWidth = 6;
      roundRect(ctx, m + 3, m + 3, W - m * 2 - 6, H - m * 2 - 6, 33);
      ctx.stroke();
    }

    ctx.textAlign = 'center';

    // 등급 뱃지 (에픽 이상)
    if (input.rarity.special) {
      const label = `${input.rarity.emoji} ${input.rarity.label} · ${input.rarity.pct}`;
      ctx.font = 'bold 24px sans-serif';
      const w = ctx.measureText(label).width + 44;
      ctx.fillStyle = tier.accent;
      roundRect(ctx, cx - w / 2, 74, w, 46, 23);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, cx, 105);
    }

    // 마스코트
    drawMascot(ctx, cx, 200, 120, input.total);

    // 제목
    ctx.fillStyle = '#333d4b';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(input.subtitle, cx, 292);
    ctx.fillStyle = '#191f28';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(input.title, cx, 336);

    // 점수 링
    const ringY = 470;
    const r = 96;
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#f2f4f6';
    ctx.beginPath();
    ctx.arc(cx, ringY, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, ringY, r, -Math.PI / 2, -Math.PI / 2 + (input.total / 100) * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#6b7684';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('오늘의 총운', cx, ringY - 20);
    ctx.fillStyle = accent;
    ctx.font = 'bold 68px sans-serif';
    ctx.fillText(String(input.total), cx, ringY + 30);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(input.grade, cx, ringY + 62);

    // 콕 집은 한마디 (브랜드 박스)
    const boxX = m + 28;
    const boxW = W - (m + 28) * 2;
    const boxY = 630;
    ctx.font = 'bold 30px sans-serif';
    const lines = wrapText(ctx, input.headline, boxW - 64);
    const boxH = 96 + lines.length * 44;
    ctx.fillStyle = '#333d4b';
    roundRect(ctx, boxX, boxY, boxW, boxH, 26);
    ctx.fill();
    // 배지
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, boxX + 28, boxY + 26, 150, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#333d4b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('오늘의 한 줄', boxX + 28 + 75, boxY + 53);
    // 문구
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'left';
    lines.forEach((ln, i) => ctx.fillText(ln, boxX + 30, boxY + 108 + i * 44));
    ctx.textAlign = 'center';

    // 워터마크
    ctx.fillStyle = '#8b95a1';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('오늘쪽지 뽑기 · 오늘 하루, 쪽지 한 장', cx, H - 92);

    const dataUrl = canvas.toDataURL('image/png');
    // 저장할 때마다 파일명이 겹치지 않게 날짜+시각을 붙인다.
    const now = new Date();
    const stamp = `${now.getFullYear()}${`${now.getMonth() + 1}`.padStart(2, '0')}${`${now.getDate()}`.padStart(2, '0')}-${`${now.getHours()}`.padStart(2, '0')}${`${now.getMinutes()}`.padStart(2, '0')}`;
    // 토스 웹뷰: 공식 saveBase64Data / 그 외: 브라우저 다운로드 (adapter 내부 분기)
    return await saveImageData(dataUrl, `today-note-${stamp}.png`);
  } catch {
    return false;
  }
}
