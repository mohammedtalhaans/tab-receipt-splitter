import { config } from '../../lib/config.ts';
import type { Currency, SplitResult } from '../../types/index.ts';
import { formatMoney } from '../../lib/money.ts';
const palette = { shell: '#0B0B0C', paper: '#F5F0E6', ink: '#151515', orange: '#FF5A1F', muted: '#6B685F', line: '#D7D0C4', green: '#B7F56A' };
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {

  if (ctx.measureText(text).width <= maxWidth) return text;

  const chars = Array.from(text);
  while (chars.length && ctx.measureText(`${chars.join('')}…`).width > maxWidth) chars.pop();

  return `${chars.join('')}…`;
}
function twoLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const chars = Array.from(text);
  let end = 1;
  while (end < chars.length && ctx.measureText(chars.slice(0, end + 1).join('')).width <= maxWidth) end++;
  const candidate = chars.slice(0, end).join('');
  const space = candidate.lastIndexOf(' ');
  if (space > candidate.length / 2 && ctx.measureText(chars.slice(space).join('').trim()).width <= maxWidth) end = space;
  return [chars.slice(0, end).join('').trim(), fitText(ctx, chars.slice(end).join('').trim(), maxWidth)];
}
/** Purely local export. Only summary amounts, never receipt imagery or item details. */
export async function createShareImage(label: string, currency: Currency, split: SplitResult): Promise<Blob> {

  if (!split.reconciled) throw new Error('Check the total before creating an image.');

  await document.fonts?.ready;

  const width = 1080;
  // Reserve breathing room after the final participant divider and before the footer.
  const height = Math.max(1350, 830 + split.people.length * 112);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser can’t create an image. You can still copy the summary.');

  const sans = '"Manrope Variable", Manrope, sans-serif';
  const mono = '"IBM Plex Mono", monospace';

  ctx.fillStyle = palette.shell;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = palette.paper;
  ctx.fillRect(62, 170, 956, height - 280);
  // A real path, not a texture/photo: thermal tear across the foot of the paper.

  ctx.beginPath();
  ctx.moveTo(62, height - 110);
  for (let x = 62; x < 1018; x += 24) {
    ctx.lineTo(x + 12, height - 98);
    ctx.lineTo(Math.min(x + 24, 1018), height - 110);
  }
  ctx.closePath();
  ctx.fill();

  ctx.font = `800 58px ${sans}`;
  ctx.fillText(config.brand, 65, 105);
  const brandWidth = ctx.measureText(config.brand).width;
  ctx.fillStyle = palette.orange;
  ctx.fillText('.', 65 + brandWidth + 2, 105);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#B1ADA6';
  ctx.font = `500 20px ${mono}`;
  ctx.fillText('GOOD NIGHTS. FAIR SPLITS.', 1015, 93);
  ctx.textAlign = 'left';

  ctx.fillStyle = palette.muted;
  ctx.font = `500 22px ${mono}`;
  ctx.fillText('THE GOOD KIND OF PAPERWORK', 124, 239);

  ctx.fillStyle = palette.ink;
  const title = label.trim() || 'Dinner with friends';
  let titleSize = 32;
  do { ctx.font = `700 ${titleSize}px ${sans}`; if (ctx.measureText(title).width <= 1640) break; titleSize--; } while (titleSize > 24);
  const titleLines = twoLines(ctx, title, 832);
  titleLines.forEach((line, index) => ctx.fillText(line, 124, titleLines.length === 1 ? 300 : 282 + index * 40));

  let fontSize = 116;
  const amount = formatMoney(split.total, currency);
  do {
    ctx.font = `800 ${fontSize}px ${sans}`;
    if (ctx.measureText(amount).width <= 820) break;
    fontSize -= 4;
  } while (fontSize > 48);

  ctx.fillText(amount, 116, 437);
  ctx.fillStyle = palette.orange;
  ctx.font = `800 65px ${sans}`;
  ctx.fillText('sorted.', 121, 516);

  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 2;
  ctx.setLineDash([9, 8]);
  ctx.beginPath();
  ctx.moveTo(124, 558);
  ctx.lineTo(956, 558);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = palette.muted;
  ctx.font = `500 18px ${mono}`;
  ctx.fillText(`${split.people.length} ${split.people.length === 1 ? 'PERSON' : 'PEOPLE'}`, 124, 603);
  ctx.textAlign = 'right';
  ctx.fillText(`${currency} · EXACT TO THE CENT`, 956, 603);
  ctx.textAlign = 'left';

  let y = 681;

  split.people.forEach(person => {

    ctx.fillStyle = palette.ink;
    let nameSize = 31;
    do { ctx.font = `600 ${nameSize}px ${sans}`; if (ctx.measureText(person.participant.name).width <= 880) break; nameSize--; } while (nameSize > 24);
    const nameLines = twoLines(ctx, person.participant.name, 450);
    nameLines.forEach((line, index) => ctx.fillText(line, 124, nameLines.length === 1 ? y : y - 15 + index * 35));

    ctx.textAlign = 'right';
    const personAmount = formatMoney(person.total, currency);
    let personAmountSize = 37;
    do { ctx.font = `800 ${personAmountSize}px ${sans}`; if (ctx.measureText(personAmount).width <= 338) break; personAmountSize--; } while (personAmountSize > 20);
    ctx.fillText(personAmount, 956, y);
    ctx.textAlign = 'left';

    ctx.strokeStyle = palette.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(124, y + 35);
    ctx.lineTo(956, y + 35);
    ctx.stroke();
    y += 112;

  });

  const footerY = height - 164;
  ctx.fillStyle = palette.ink;
  ctx.font = `600 21px ${sans}`;
  ctx.fillText('Every cent accounted for.', 124, footerY);
  ctx.textAlign = 'right';
  ctx.fillStyle = palette.muted;
  ctx.font = `500 18px ${mono}`;
  ctx.fillText('NO AWKWARD MATHS.', 956, footerY);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#B1ADA6';
  ctx.font = `500 20px ${sans}`;
  ctx.fillText(`Free & open source  ·  Split with ${config.brand}`, 540, height - 39);

  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    canvas.width = 1;
    canvas.height = 1;
    if (blob) resolve(blob); else reject(new Error('Image export didn’t finish. Try copying the summary instead.'));
  }, 'image/png'));
}
