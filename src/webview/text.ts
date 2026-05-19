// VSArcade — Pixel text helpers (shared across runtime and game renderers)

import { PIXEL_FONT } from "./pixel-font";

export const GLYPH_WIDTH = 6;
export const GLYPH_HEIGHT = 5;

export function measurePixelText(text: string, scale = 2): number {
  return String(text).length * GLYPH_WIDTH * scale;
}

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale = 2,
  color = "#f5f5f5",
): void {
  const upper = String(text).toUpperCase();
  ctx.fillStyle = color;
  let cursorX = x;
  for (const char of upper) {
    const glyph = PIXEL_FONT[char] ?? PIXEL_FONT[" "];
    for (let row = 0; row < glyph.length; row += 1) {
      const line = glyph[row];
      for (let col = 0; col < line.length; col += 1) {
        if (line[col] !== "1") {
          continue;
        }
        ctx.fillRect(cursorX + col * scale, y + row * scale, scale, scale);
      }
    }
    cursorX += GLYPH_WIDTH * scale;
  }
}

export function wrapPixelText(text: string, maxWidth: number, scale = 2): string[] {
  const words = String(text)
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || measurePixelText(candidate, scale) <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

export function drawCenteredLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  startY: number,
  scale: number,
  color: string,
  maxWidth: number,
): void {
  const lineHeight = (GLYPH_HEIGHT + 2) * scale;
  lines.forEach((line, index) => {
    const width = measurePixelText(line, scale);
    const x = Math.max(Math.floor((maxWidth - width) / 2), 8);
    drawPixelText(ctx, line, x, startY + index * lineHeight, scale, color);
  });
}
