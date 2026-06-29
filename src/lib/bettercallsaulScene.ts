import { type CanvasRenderingContext2D, Image } from "canvas";
import fs from "fs";
import path from "path";

export interface BetterCallSaulSceneArgs {
  width: number;
  height: number;
  gridLeft: number;
  gridTop: number;
  numCols: number;
  numRows: number;
  cellSize: number;
  cellStep: number;
  cornerRadius: number;
  levels: number[];
}

const BG_YELLOW = "#ffcc00";
const TEXT_RED = "#c9302c";
const TEXT_BLACK = "#111111";

const RAMP = ["#d9534f", "#c9302c", "#9c201c", "#111111"];
const EMPTY = "rgba(17, 17, 17, 0.1)";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Scales of justice removed
export function renderBetterCallSaulScene(ctx: CanvasRenderingContext2D, a: BetterCallSaulSceneArgs): void {
  const { width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep, cornerRadius, levels } = a;
  const scale = width / 393;

  // Background
  ctx.fillStyle = BG_YELLOW;
  ctx.fillRect(0, 0, width, height);

  // Halftone/Dot pattern overlay (subtle)
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  const dotStep = 10 * scale;
  for(let x = 0; x < width; x += dotStep) {
    for(let y = 0; y < height; y += dotStep) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Top Banner "IN LEGAL TROUBLE?"
  ctx.save();
  ctx.translate(width / 2, height * 0.05);
  ctx.rotate(-5 * Math.PI / 180);
  ctx.fillStyle = TEXT_BLACK;
  ctx.fillRect(-150 * scale, -20 * scale, 300 * scale, 40 * scale);
  ctx.fillStyle = BG_YELLOW;
  ctx.font = `bold ${Math.round(20 * scale)}px Inter`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("IN LEGAL TROUBLE?", 0, 0);
  ctx.restore();

  // Top Text Graphic (from user uploaded image)
  try {
    const textBuf = fs.readFileSync(path.join(process.cwd(), "public", "bcs_text.png"));
    const textImg = new Image();
    textImg.src = textBuf;
    ctx.save();
    const tw = 280 * scale; // perfect size for the cleanly cropped logo
    const th = tw * (textImg.height / textImg.width);
    ctx.drawImage(textImg, width / 2 - tw / 2, height * 0.11, tw, th);
    ctx.restore();
  } catch (e) {
    console.error("Missing bcs_text.png", e);
  }

  // Text removed as per user request

  // Saul Goodman silhouette (from user upload)
  try {
    const saulBuf = fs.readFileSync(path.join(process.cwd(), "public", "saul2.png"));
    const saulImg = new Image();
    saulImg.src = saulBuf;
    ctx.save();
    ctx.globalAlpha = 0.12; // very very low transparency
    // Draw centered beneath the grid, scaled down slightly
    const imgW = 300 * scale;
    const imgH = imgW * (saulImg.height / saulImg.width);
    ctx.drawImage(saulImg, width / 2 - imgW / 2, height * 0.45, imgW, imgH);
    ctx.restore();
  } catch (e) {
    console.error("Missing saul2.png", e);
  }

  // The Grid
  ctx.save();
  for (let i = 0; i < levels.length; i++) {
    const col = i % numCols;
    const row = Math.floor(i / numCols);
    const x = gridLeft + col * cellStep;
    const y = gridTop + row * cellStep;
    const lv = levels[i];

    if (lv < 0) {
      roundRect(ctx, x, y, cellSize, cellSize, cornerRadius);
      ctx.fillStyle = EMPTY;
      ctx.fill();
    } else {
      roundRect(ctx, x, y, cellSize, cellSize, cornerRadius);
      ctx.fillStyle = RAMP[lv];
      ctx.fill();
    }
  }
  ctx.restore();

  // Bottom red bar
  ctx.fillStyle = TEXT_RED;
  ctx.fillRect(0, height - 35 * scale, width, 35 * scale);
  ctx.fillStyle = BG_YELLOW;
  ctx.font = `bold ${Math.round(12 * scale)}px Inter`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("(505) 503-4455 • SE HABLA ESPANOL", width / 2, height - 17 * scale);
}
