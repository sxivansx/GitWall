import { type CanvasRenderingContext2D } from "canvas";

// Full-canvas Point Blank wallpaper, kept minimal. Point Blank (pointblank.club)
// is a competitive-programming / FOSS community whose mark is `<.` ... a blank ...
// `>` in emerald on black — the dot is a low period hard after the opening
// bracket, then a wide blank, then the closing bracket. The mark sits as the hero
// above the contribution grid, which keeps the standard tile size/position of
// every other theme; only the background and cell style change.

export interface PbSceneArgs {
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

// Brand emerald (#00c853) on near-black, high-contrast dim→bright ramp so busy
// days read as sharp points of light. The mark is brighter than any tile.
const BG = "#050807";
const EMPTY = "rgba(18,34,24,0.6)"; // a day with no commits
const RAMP = ["#0c4a2a", "#0e8a44", "#00c853", "#5dff9e"]; // levels 0..3
const RAMP_RGB = [
  [12, 74, 42],
  [14, 138, 68],
  [0, 200, 83],
  [93, 255, 158],
];
const MARK = "#1bff8c";
const MARK_GLOW = "rgba(40,255,150,0.55)";

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// The `<. >` mark, drawn to the official logo's proportions (measured from the
// brand asset): chevron width ≈ 0.78× its height; the dot is ≈0.5 a chevron wide,
// a low baseline period just right of `<`; then a wide blank (~1.9 chevrons) to
// `>`. Total width ≈ 4.96 chevrons. Soft glow pass then a crisp pass.
function drawMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, targetW: number) {
  const cw = targetW / 4.96;        // chevron width
  const gh = cw / 0.776;            // chevron glyph height
  const armH = gh / 2;
  const dotR = cw * 0.25;
  const gap1 = cw * 0.58;           // `<` to `.`
  const gap2 = cw * 1.88;           // `.` to `>` — the blank
  const dotCy = cy + gh * 0.30;     // low, like a period on the baseline

  let x = cx - targetW / 2;
  const lVertX = x;
  const lArmX = x + cw;
  x += cw + gap1;
  const dotCx = x + dotR;
  x += dotR * 2 + gap2;
  const rArmX = x;
  const rVertX = x + cw;

  const paint = (lineWidth: number, color: string, blur: number) => {
    ctx.save();
    if (blur > 0) {
      ctx.shadowColor = MARK_GLOW;
      ctx.shadowBlur = blur;
    }
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.beginPath(); // `<`
    ctx.moveTo(lArmX, cy - armH);
    ctx.lineTo(lVertX, cy);
    ctx.lineTo(lArmX, cy + armH);
    ctx.stroke();
    ctx.beginPath(); // `.`
    ctx.arc(dotCx, dotCy, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath(); // `>`
    ctx.moveTo(rArmX, cy - armH);
    ctx.lineTo(rVertX, cy);
    ctx.lineTo(rArmX, cy + armH);
    ctx.stroke();
    ctx.restore();
  };

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  paint(gh * 0.30, "rgba(27,255,140,0.16)", 0); // soft halo
  ctx.restore();
  paint(gh * 0.17, MARK, 20); // crisp
}

export function renderPbScene(ctx: CanvasRenderingContext2D, a: PbSceneArgs): void {
  const { width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep, cornerRadius, levels } = a;
  const scale = width / 393;

  // Standard grid geometry — identical to every other theme. Never resized.
  const gridW = numCols * cellStep - (cellStep - cellSize);
  const gridH = numRows * cellStep - (cellStep - cellSize);
  const midY = gridTop + gridH / 2;

  // 1) Terminal black background.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  // 2) Ambient screen glow pooling behind the grid.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const ambient = ctx.createRadialGradient(width / 2, midY, 0, width / 2, midY, gridW * 0.8);
  ambient.addColorStop(0, "rgba(0,200,83,0.10)");
  ambient.addColorStop(0.6, "rgba(0,160,70,0.04)");
  ambient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = ambient;
  ctx.fillRect(0, gridTop - gridH * 0.4, width, gridH * 1.8);
  ctx.restore();

  // 3) CRT scanlines, very faint, additive emerald.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(0,200,83,0.022)";
  const lineGap = Math.max(3, Math.round(4 * scale));
  for (let y = 0; y < height; y += lineGap) {
    ctx.fillRect(0, y, width, Math.max(1, Math.round(scale)));
  }
  ctx.restore();

  // 4) The hero mark, centred above the grid, clear of the lock-screen clock.
  drawMark(ctx, width / 2, height * 0.25, width * 0.46);

  // 5) The grid — your year, the glowing output. Standard size.
  for (let i = 0; i < levels.length; i++) {
    const col = i % numCols;
    const row = Math.floor(i / numCols);
    const x = gridLeft + col * cellStep;
    const y = gridTop + row * cellStep;
    const lv = levels[i];

    if (lv < 0) {
      roundRectPath(ctx, x, y, cellSize, cellSize, cornerRadius);
      ctx.fillStyle = EMPTY;
      ctx.fill();
      continue;
    }

    ctx.save();
    ctx.shadowColor = `rgba(${RAMP_RGB[lv][0]},${RAMP_RGB[lv][1]},${RAMP_RGB[lv][2]},${0.4 + lv * 0.12})`;
    ctx.shadowBlur = (2 + lv * 2) * scale;
    roundRectPath(ctx, x, y, cellSize, cellSize, cornerRadius);
    ctx.fillStyle = RAMP[lv];
    ctx.fill();
    ctx.restore();

    if (lv >= 2) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.16 * (lv - 1);
      roundRectPath(ctx, x, y, cellSize, cellSize * 0.42, cornerRadius);
      ctx.fillStyle = "#cfffe4";
      ctx.fill();
      ctx.restore();
    }
  }

  // 6) Vignette — center-weighted, so the screen glows from the middle.
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const vig = ctx.createRadialGradient(
    width / 2, height * 0.42, gridW * 0.55,
    width / 2, height * 0.42, Math.max(width, height) * 0.72
  );
  vig.addColorStop(0, "rgba(255,255,255,1)");
  vig.addColorStop(1, "rgba(10,18,12,1)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
