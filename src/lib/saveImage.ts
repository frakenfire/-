import { scoreColor } from './luck';

// PRD §7.2 + 리서치 반영 — 세로 공유 카드. 총운 점수를 크게 노출해 공유 욕구 자극.

type SaveInput = {
  icon: string;
  title: string;
  subtitle: string;
  shareLine: string;
  total: number;
  grade: string;
  tag: string;
};

function resolveScoreColor(score: number): string {
  // scoreColor 는 CSS 변수 문자열을 반환하므로 캔버스용 hex 로 매핑
  const v = scoreColor(score);
  if (v.includes('high')) return '#12b886';
  if (v.includes('mid')) return '#3182f6';
  return '#f59f00';
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
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

export async function saveResultCard(input: SaveInput): Promise<boolean> {
  try {
    const W = 720;
    const H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // 배경 (토스식 클린 그레이 캔버스)
    ctx.fillStyle = '#f2f4f6';
    ctx.fillRect(0, 0, W, H);

    // 화이트 카드
    const m = 56;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, m, m, W - m * 2, H - m * 2, 36);
    ctx.fill();

    ctx.textAlign = 'center';
    const cx = W / 2;
    const accent = resolveScoreColor(input.total);

    // 상단 라벨
    ctx.fillStyle = '#114e48';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`${input.icon}  ${input.subtitle}`, cx, H * 0.16);
    ctx.fillStyle = '#191f28';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(input.title, cx, H * 0.215);

    // 점수 링
    const ringY = H * 0.4;
    const r = 128;
    const stroke = 22;
    ctx.lineWidth = stroke;
    ctx.strokeStyle = '#f2f4f6';
    ctx.beginPath();
    ctx.arc(cx, ringY, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineCap = 'round';
    const start = -Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx, ringY, r, start, start + (input.total / 100) * Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#6b7684';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('오늘의 총운', cx, ringY - 30);
    ctx.fillStyle = accent;
    ctx.font = 'bold 92px sans-serif';
    ctx.fillText(String(input.total), cx, ringY + 34);
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(input.grade, cx, ringY + 74);

    // 태그 칩
    ctx.fillStyle = '#e7f1ef';
    const chipW = 150;
    roundRect(ctx, cx - chipW / 2, H * 0.55, chipW, 46, 23);
    ctx.fill();
    ctx.fillStyle = '#114e48';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`#${input.tag}`, cx, H * 0.55 + 31);

    // 한 문장
    ctx.fillStyle = '#191f28';
    ctx.font = 'bold 40px sans-serif';
    const lines = wrapText(ctx, input.shareLine, W - 200);
    const startY = H * 0.68;
    lines.forEach((ln, i) => ctx.fillText(ln, cx, startY + i * 58));

    // 워터마크
    ctx.fillStyle = '#8b95a1';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('내일쪽지 뽑기', cx, H - 108);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'tomorrow-note.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
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
