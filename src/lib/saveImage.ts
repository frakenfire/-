// PRD §7.2 — 결과 카드 저장하기. Canvas 로 세로 공유 카드를 그려 PNG 저장.

type SaveInput = {
  icon: string;
  title: string;
  subtitle: string;
  shareLine: string;
};

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

    // 크림 배경
    ctx.fillStyle = '#fff8ed';
    ctx.fillRect(0, 0, W, H);

    // 쪽지 카드 (흰색, 점선 테두리 느낌)
    const m = 64;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#114e48';
    ctx.lineWidth = 3;
    roundRect(ctx, m, m, W - m * 2, H - m * 2, 32);
    ctx.fill();
    ctx.setLineDash([10, 10]);
    roundRect(ctx, m + 16, m + 16, W - m * 2 - 32, H - m * 2 - 32, 24);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'center';

    // 아이콘
    ctx.font = '110px sans-serif';
    ctx.fillText(input.icon, W / 2, H * 0.28);

    // 제목 / 부제
    ctx.fillStyle = '#114e48';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(input.subtitle, W / 2, H * 0.36);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(input.title, W / 2, H * 0.43);

    // 한 문장
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 42px sans-serif';
    const lines = wrapText(ctx, input.shareLine, W - 220);
    const startY = H * 0.56;
    lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * 62));

    // 워터마크
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('내일쪽지 뽑기', W / 2, H - 120);

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
