import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import type { SpidermanVariant } from "./spiderman";

// Full-canvas Spider-Man wallpaper — "The Lenses". The hero motif is the mask
// eyes: two big angular lenses with a black web-line border, watching from the
// dark in the top third. Below them your contribution year is the readable grid,
// kept at the standard tile size/position of every other theme (only background
// and cell style change). Each suit restyles the lenses and the palette: classic
// = glossy white, Miles = red-rimmed + venom spark, symbiote = inverted black
// lenses with white fangs, Spider-Verse = halftone + chromatic print.

const TAU = Math.PI * 2;

export interface SpidermanSceneArgs {
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
  variant: SpidermanVariant;
}

type Treatment = "classic" | "miles" | "noir" | "verse";

interface Grade {
  bgTop: string;
  bgBot: string;
  empty: string;
  emptyEdge: string; // faint border on empty cells so the grid reads
  ramp: [string, string, string, string];
  rampRGB: [number, number, number][];
  accent: string;
  accentRGB: string; // "r,g,b" for halos/dew
  cityRGB: string; // faded skyline silhouette "r,g,b"
  windowRGB: string; // lit windows "r,g,b"
  treatment: Treatment;
}

const GRADES: Record<SpidermanVariant, Grade> = {
  classic: {
    bgTop: "#0e1426", bgBot: "#070a14",
    empty: "rgba(38,50,90,0.6)", emptyEdge: "rgba(120,140,200,0.14)",
    ramp: ["#9c1a2e", "#cf1f3c", "#f23048", "#ff5e74"],
    rampRGB: [[156, 26, 46], [207, 31, 60], [242, 48, 72], [255, 94, 116]],
    accent: "#5d7bd6", accentRGB: "93,123,214",
    cityRGB: "24,34,66", windowRGB: "255,196,120",
    treatment: "classic",
  },
  miles: {
    bgTop: "#0e0c1e", bgBot: "#080611",
    empty: "rgba(52,44,92,0.62)", emptyEdge: "rgba(130,120,210,0.14)",
    ramp: ["#27349e", "#3a7bf0", "#33beff", "#9ee6ff"],
    rampRGB: [[39, 52, 158], [58, 123, 240], [51, 190, 255], [158, 230, 255]],
    accent: "#36c8ff", accentRGB: "54,200,255",
    cityRGB: "30,26,62", windowRGB: "90,200,255",
    treatment: "miles",
  },
  symbiote: {
    bgTop: "#0a090d", bgBot: "#040305",
    empty: "rgba(46,48,60,0.92)", emptyEdge: "rgba(150,154,176,0.18)",
    ramp: ["#6e7488", "#959bb6", "#c8cfe6", "#ffffff"],
    rampRGB: [[110, 116, 136], [149, 155, 182], [200, 207, 230], [255, 255, 255]],
    accent: "#d8d9e2", accentRGB: "216,217,226",
    cityRGB: "26,27,33", windowRGB: "210,212,222",
    treatment: "noir",
  },
  verse: {
    bgTop: "#160a28", bgBot: "#0a0512",
    empty: "rgba(64,38,92,0.6)", emptyEdge: "rgba(180,120,220,0.16)",
    ramp: ["#5a24a0", "#8a2bd0", "#bb33e2", "#ecd23a"],
    rampRGB: [[90, 36, 160], [138, 43, 208], [187, 51, 226], [236, 210, 58]],
    accent: "#1fd6ff", accentRGB: "31,214,255",
    cityRGB: "42,22,60", windowRGB: "255,226,90",
    treatment: "verse",
  },
};

function lighten([r, g, b]: [number, number, number], t: number): string {
  return `${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)}`;
}

function softBlob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Faded night-city skyline — the familiar Spider-Man backdrop. Buildings rise
// from `baseY` up toward `topY`, emerging from the dark with sparse lit windows.
// Deterministic (sin-hashed) so it's stable per render.
function drawSkyline(ctx: CanvasRenderingContext2D, width: number, baseY: number, topY: number, g: Grade, scale: number, intensity: number) {
  ctx.save();
  let x = -30 * scale;
  let i = 0;
  while (x < width + 30) {
    const w = (44 + (Math.sin(i * 12.9) * 0.5 + 0.5) * 62) * scale;
    const hFrac = 0.3 + (Math.sin(i * 7.3 + 1.1) * 0.5 + 0.5) * 0.68;
    const by = baseY - (baseY - topY) * hFrac;
    const grad = ctx.createLinearGradient(0, by, 0, baseY);
    grad.addColorStop(0, `rgba(${g.cityRGB},${0.15 * intensity})`);
    grad.addColorStop(1, `rgba(${g.cityRGB},${0.85 * intensity})`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, by, w, baseY - by);
    // Lit windows — sparse, in tidy stacks (reads as a building, not noise),
    // brighter toward the base, kept clear of the very bottom near the grid.
    const cols = Math.max(2, Math.floor(w / (16 * scale)));
    const rows = Math.floor((baseY - by - 22 * scale) / (20 * scale));
    for (let cxi = 0; cxi < cols; cxi++) {
      for (let ry = 0; ry < rows; ry++) {
        if (((cxi * 31 + ry * 17 + i * 13) % 5) > 1) continue; // sparse but stacked
        const wx = x + 8 * scale + cxi * (16 * scale);
        const wy = by + 13 * scale + ry * (20 * scale);
        const f = (wy - by) / Math.max(1, baseY - by);
        ctx.globalAlpha = (0.22 + f * 0.45) * intensity;
        ctx.fillStyle = `rgb(${g.windowRGB})`;
        ctx.fillRect(wx, wy, 3 * scale, 4 * scale);
      }
    }
    ctx.globalAlpha = 1;
    x += w + 5 * scale;
    i++;
  }
  ctx.restore();
}

// Build one lens path in a local frame (inner edge at x=0, vertical centre y=0),
// x growing in `mirror` direction, scaled by `s` about the lens centre.
function lensPath(ctx: CanvasRenderingContext2D, W: number, H: number, mirror: number, s: number) {
  const cxl = mirror * 0.5 * W;
  const P = (fx: number, fy: number): [number, number] => {
    const x = mirror * fx * W, y = fy * H;
    return [cxl + (x - cxl) * s, y * s];
  };
  // Classic comic mask lens (matched to the user's reference): a bold almond with
  // the inner-top corner rising high toward the centre, an arched brow, and a
  // sharp tip swept down-and-OUTWARD at the outer-lower corner. The two lenses
  // nearly meet at the top centre and splay apart toward their outer tips.
  // Traced from the user's reference: a bold eye that is tall and full on the
  // INNER side near the centre and tapers to a sharp point at the OUTER end (the
  // temple), sweeping out and slightly down. High arched brow on top, rounded
  // inner edge facing the nose. The two eyes' inner ends sit close to the centre.
  const c = (fx: number, fy: number) => P(fx, fy);
  const outerTip = P(0.72, -0.47); // sharp point at the temple, swept up and out
  const innerTop = P(0.09, 0.01);  // inner-top corner, near the centre
  const innerBot = P(0.22, 0.42);  // inner-bottom
  ctx.beginPath();
  ctx.moveTo(innerTop[0], innerTop[1]);
  let a = c(0.53, -0.27), b = c(0.47, -0.19);
  ctx.bezierCurveTo(a[0], a[1], b[0], b[1], outerTip[0], outerTip[1]);  // brow → sharp outer tip
  a = c(0.74, 0.34); b = c(0.39, 0.55);
  ctx.bezierCurveTo(a[0], a[1], b[0], b[1], innerBot[0], innerBot[1]);  // lower lid → inner-bottom
  a = c(-0.02, 0.22); b = c(-0.04, 0.09);
  ctx.bezierCurveTo(a[0], a[1], b[0], b[1], innerTop[0], innerTop[1]);  // inner edge → back to top
  ctx.closePath();
}

function drawLens(ctx: CanvasRenderingContext2D, originX: number, cy: number, W: number, H: number, mirror: number, g: Grade, scale: number) {
  ctx.save();
  ctx.translate(originX, cy);
  // No rotation — the lens shape carries its own tilt, and zero rotation keeps the
  // two lenses a perfect mirror pair.

  // verse: chromatic ghosts under the white face.
  if (g.treatment === "verse") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(mirror * -5 * scale, 0); lensPath(ctx, W, H, mirror, 1); ctx.fillStyle = "rgba(31,214,255,0.6)"; ctx.fill();
    ctx.translate(mirror * 10 * scale, 0); lensPath(ctx, W, H, mirror, 1); ctx.fillStyle = "rgba(255,45,106,0.6)"; ctx.fill();
    ctx.restore();
  }

  // white face (per-treatment gradient)
  lensPath(ctx, W, H, mirror, 1);
  let face: CanvasGradient;
  if (g.treatment === "miles") {
    face = ctx.createLinearGradient(0, 0, mirror * W, 0);
    face.addColorStop(0, "#ffffff");
    face.addColorStop(0.62, "#eef2fb");
    face.addColorStop(1, "#ff2d52");
  } else {
    face = ctx.createLinearGradient(0, -H / 2, 0, H / 2);
    face.addColorStop(0, "#ffffff");
    face.addColorStop(0.6, "#f4f7fc");
    face.addColorStop(1, "#dde6f2");
  }
  ctx.fillStyle = face;
  ctx.fill();

  // verse: halftone overprint clipped to the lens
  if (g.treatment === "verse") {
    const pat = halftonePattern(ctx, 9 * scale, 1.7 * scale, "rgba(120,40,160,0.9)");
    if (pat) {
      ctx.save();
      lensPath(ctx, W, H, mirror, 1);
      ctx.clip();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = pat;
      ctx.fillRect(-W, -H, W * 2, H * 2);
      ctx.restore();
    }
  }

  // Gloss, clipped inside the lens. Two faint concentric ribs only — no scratchy
  // radial spokes (they read as dust). The lens is mostly a clean reflective face.
  ctx.save();
  lensPath(ctx, W, H, mirror, 1);
  ctx.clip();
  ctx.strokeStyle = "rgba(70,80,100,0.1)";
  ctx.lineWidth = 1.3 * scale;
  ctx.lineJoin = "round";
  for (const s of [0.66, 0.36]) {
    lensPath(ctx, W, H, mirror, s);
    ctx.stroke();
  }
  // soft specular sheen across the upper-outer lobe
  ctx.globalCompositeOperation = "lighter";
  softBlob(ctx, mirror * 0.52 * W, -H * 0.24, W * 0.42, "255,255,255", 0.32);
  ctx.restore();

  // inner thin rib just inside the rim
  lensPath(ctx, W, H, mirror, 0.9);
  ctx.strokeStyle = "rgba(10,10,12,0.5)";
  ctx.lineWidth = 2.5 * scale;
  ctx.lineJoin = "round";
  ctx.stroke();

  // outer black keyline (on top for a crisp edge)
  lensPath(ctx, W, H, mirror, 1);
  if (g.treatment === "verse") {
    // print-misalign fringe
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(mirror * -1.5 * scale, 0); lensPath(ctx, W, H, mirror, 1);
    ctx.strokeStyle = "rgba(31,214,255,0.5)"; ctx.lineWidth = 7 * scale; ctx.lineJoin = "round"; ctx.stroke();
    ctx.restore();
    lensPath(ctx, W, H, mirror, 1);
  }
  ctx.strokeStyle = "#0a0a0c";
  ctx.lineWidth = 7 * scale;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
}

function halftonePattern(ctx: CanvasRenderingContext2D, spacing: number, radius: number, color: string) {
  const tile = createCanvas(spacing, spacing * 2);
  const t = tile.getContext("2d");
  t.fillStyle = color;
  t.beginPath(); t.arc(spacing / 2, spacing / 2, radius, 0, TAU); t.fill();
  t.beginPath(); t.arc(0, spacing * 1.5, radius, 0, TAU); t.fill();
  t.beginPath(); t.arc(spacing, spacing * 1.5, radius, 0, TAU); t.fill();
  return ctx.createPattern(tile, "repeat");
}

export function renderSpidermanScene(ctx: CanvasRenderingContext2D, a: SpidermanSceneArgs): void {
  const { width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep, cornerRadius, levels } = a;
  const g = GRADES[a.variant];
  const scale = width / 393;
  const gridW = numCols * cellStep - (cellStep - cellSize);
  const gridH = numRows * cellStep - (cellStep - cellSize);

  // 1) Night-sky background.
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, g.bgTop);
  bg.addColorStop(1, g.bgBot);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Faded familiar backdrop — the night-city skyline rising behind the lenses.
  // Much fainter on the monochrome suit, where it has no colour to read against.
  drawSkyline(ctx, width, gridTop, height * 0.12, g, scale, g.treatment === "noir" ? 0.4 : 1);

  // Lens geometry — large hero eyes, anchored above the grid.
  const lensCy = height * 0.265;
  const lensW = width * 0.36;
  const lensH = lensW * 0.82;
  const gap = width * 0.05;

  // classic: faint implied-red suit glow behind the lenses.
  if (g.treatment === "classic") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    softBlob(ctx, width / 2, lensCy + lensH * 0.1, width * 0.55, "207,31,60", 0.07);
    ctx.restore();
  }

  // 2) Hero halo so the lenses feel lit, not pasted.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  softBlob(ctx, width / 2, lensCy, width * 0.5, g.accentRGB, 0.07);
  ctx.restore();

  // Fade the very top so the skyline doesn't fight the lock-screen clock.
  const topFade = ctx.createLinearGradient(0, 0, 0, height * 0.2);
  topFade.addColorStop(0, g.bgTop);
  topFade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = topFade;
  ctx.fillRect(0, 0, width, height * 0.2);
  ctx.restore();

  // 4) The lenses.
  drawLens(ctx, width / 2 + gap / 2, lensCy, lensW, lensH, 1, g, scale);
  drawLens(ctx, width / 2 - gap / 2, lensCy, lensW, lensH, -1, g, scale);

  // Miles: a single clean cyan venom spark arcing between the inner tips.
  if (g.treatment === "miles") {
    drawSpark(ctx, width / 2, lensCy + lensH * 0.2, lensW * 0.5, g.accent, scale);
  }

  // 5) The grid — your year, the readable hero. Standard size.
  for (let i = 0; i < levels.length; i++) {
    const col = i % numCols;
    const row = Math.floor(i / numCols);
    const x = gridLeft + col * cellStep;
    const y = gridTop + row * cellStep;
    const lv = levels[i];
    if (lv < 0) {
      roundRectPath(ctx, x, y, cellSize, cellSize, cornerRadius);
      ctx.fillStyle = g.empty;
      ctx.fill();
      // faint border so the grid structure reads even where cells are empty
      ctx.strokeStyle = g.emptyEdge;
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
      continue;
    }
    const rgb = g.rampRGB[lv];
    const rgbStr = `${rgb[0]},${rgb[1]},${rgb[2]}`;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    softBlob(ctx, x + cellSize / 2, y + cellSize / 2, cellSize * (0.4 + lv * 0.08), rgbStr, 0.03 + lv * 0.018);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = `rgba(${rgbStr},${0.35 + lv * 0.08})`;
    ctx.shadowBlur = (1 + lv * 1) * scale;
    roundRectPath(ctx, x, y, cellSize, cellSize, cornerRadius);
    ctx.fillStyle = g.ramp[lv];
    ctx.fill();
    ctx.restore();
    if (lv >= 1) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.12 + (lv - 1) * 0.08;
      roundRectPath(ctx, x, y, cellSize, cellSize * 0.4, cornerRadius);
      ctx.fillStyle = `rgb(${lighten(rgb, 0.45)})`;
      ctx.fill();
      ctx.restore();
    }
    if (lv === 3) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      softBlob(ctx, x + cellSize / 2, y + cellSize / 2, cellSize * 0.2, lighten(rgb, 0.5), 0.3);
      ctx.restore();
    }
  }

  // 7) Vignette — center-weighted on the grid.
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const vig = ctx.createRadialGradient(width / 2, gridTop + gridH / 2, gridW * 0.5, width / 2, gridTop + gridH / 2, Math.max(width, height) * 0.72);
  vig.addColorStop(0, "rgba(255,255,255,1)");
  vig.addColorStop(1, "rgba(12,14,22,1)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// A single clean energized arc (Miles).
function drawSpark(ctx: CanvasRenderingContext2D, cx: number, cy: number, span: number, color: string, scale: number) {
  const pts: [number, number][] = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = cx + (t - 0.5) * span;
    const y = cy + Math.sin(t * Math.PI) * -span * 0.12 + Math.sin(i * 9.3) * span * 0.04;
    pts.push([x, y]);
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12 * scale;
  ctx.lineWidth = 2.4 * scale;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.shadowBlur = 4 * scale;
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.stroke();
  ctx.restore();
}

// Small picker thumbnail: the lenses on the suit background.
export function drawSpidermanThumb(ctx: CanvasRenderingContext2D, variant: SpidermanVariant, S: number) {
  const g = GRADES[variant];
  ctx.fillStyle = g.bgBot;
  ctx.fillRect(0, 0, S, S);
  const lw = S * 0.36;
  const lh = lw * 0.82;
  const gp = S * 0.05;
  drawLens(ctx, S / 2 + gp / 2, S * 0.42, lw, lh, 1, g, S / 393 * 3);
  drawLens(ctx, S / 2 - gp / 2, S * 0.42, lw, lh, -1, g, S / 393 * 3);
  const cell = S * 0.15;
  const g2 = S * 0.04;
  const totalW = 4 * cell + 3 * g2;
  const x0 = (S - totalW) / 2;
  const y0 = S - cell - S * 0.06;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = g.ramp[i];
    ctx.beginPath();
    ctx.roundRect(x0 + i * (cell + g2), y0, cell, cell, cell * 0.2);
    ctx.fill();
  }
}
