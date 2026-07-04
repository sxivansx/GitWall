import { createCanvas, registerFont, type CanvasRenderingContext2D } from "canvas";
import path from "path";
import { getTheme } from "./themes";
import { getDevice } from "./devices";
import { getContributionLevel, calculateStreak } from "./lib/contributions";
import { drawMinecraftCell } from "./lib/minecraft";
import { drawOnePieceCell } from "./lib/onepiece";
import type { OnePieceVariant } from "./lib/onepiece";
import { drawIronmanCell } from "./lib/ironman";
import type { IronmanVariant } from "./lib/ironman";
import type { AttackOnTitanVariant } from "./lib/attackontitan";
import { renderAotScene } from "./lib/aotScene";
import { renderGotScene } from "./lib/gotScene";
import { GAMEOFTHRONES_WORDS, type GameOfThronesVariant } from "./lib/gameofthrones";
import { renderSpidermanScene } from "./lib/spidermanScene";
import { type SpidermanVariant } from "./lib/spiderman";
import { renderPbScene } from "./lib/pbScene";
import { renderPokemonScene } from "./lib/pokemonScene";
import { type PokemonVariant } from "./lib/pokemon";
import { renderBreakingBadScene } from "./lib/breakingbadScene";
import { renderBetterCallSaulScene } from "./lib/bettercallsaulScene";
import type { ContributionCalendar } from "./github";

const fontsDir = path.join(process.cwd(), "fonts");
registerFont(path.join(fontsDir, "Inter-Regular.ttf"), { family: "Inter" });
registerFont(path.join(fontsDir, "Inter-Bold.ttf"), { family: "Inter", weight: "bold" });
// Cinzel: an open-source Trajan-style Roman serif used for the Game of Thrones
// house mottos, evoking the show's inscriptional title lettering. Registered under
// both bold and default weight (same file on purpose) so `bold ...px Cinzel` and a
// plain `Cinzel` request both resolve to this TTF.
registerFont(path.join(fontsDir, "Cinzel.ttf"), { family: "Cinzel", weight: "bold" });
registerFont(path.join(fontsDir, "Cinzel.ttf"), { family: "Cinzel" });
// JetBrains Mono: the terminal typeface for the Point Blank theme's shell prompt.
registerFont(path.join(fontsDir, "JetBrainsMono-Regular.ttf"), { family: "JetBrains Mono" });
registerFont(path.join(fontsDir, "JetBrainsMono-Bold.ttf"), { family: "JetBrains Mono", weight: "bold" });
// Damion: thick brush script for Better Call Saul
registerFont(path.join(fontsDir, "Damion-Regular.ttf"), { family: "Damion" });

// The product's own domain, baked into every wallpaper as a watermark.
export const WATERMARK = "gitwall.space";

export type CellShape = "box" | "circle";

export interface RenderOptions {
  theme?: string;
  device?: string;
  stats?: boolean;
  user?: string;
  shape?: CellShape;
  customWidth?: number;
  customHeight?: number;
}

export function renderWallpaper(
  calendar: ContributionCalendar,
  options: RenderOptions = {}
): Buffer {
  const {
    theme: themeName = "classic",
    device: deviceName = "iphone14",
    stats = true,
    user = "",
    shape = "box",
    customWidth,
    customHeight,
  } = options;

  const theme = getTheme(themeName);
  let width, height;
  if (customWidth && customHeight) {
    width = customWidth;
    height = customHeight;
  } else {
    const device = getDevice(deviceName);
    width = device.width;
    height = device.height;
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.antialias = "subpixel";
  ctx.patternQuality = "best";
  ctx.quality = "best";

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);

  const weeks = calendar.weeks;
  const totalContributions = calendar.totalContributions;

  // Flatten all days chronologically (oldest → newest)
  const allDays = [];
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      allDays.push(day);
    }
  }

  // Scale relative to 393×852 reference (iPhone 16 logical dimensions)
  // This matches the SVG mockup exactly: 24px cells, 5px gap, 40px margins
  const scale = width / 393;
  const cellSize = Math.round(24 * scale);
  const cellGap = Math.round(5 * scale);
  const cellStep = cellSize + cellGap;
  const cornerRadius = 2.5 * scale;

  // Grid starts at ~36% of screen height to clear the iOS lock screen clock
  const paddingH = Math.round(40 * scale);
  const gridTop = Math.round(height * 0.36);
  const bottomAreaH = Math.round(149 * scale);
  const gridAvailW = width - 2 * paddingH;
  const gridAvailH = height - gridTop - bottomAreaH;

  // Flat day-grid: days flow left-to-right, top-to-bottom (like reading text)
  // This fills the screen naturally and produces the large-cell aesthetic
  const numCols = Math.floor((gridAvailW + cellGap) / cellStep);
  const numRows = Math.floor((gridAvailH + cellGap) / cellStep);
  const totalCells = numCols * numRows;

  // Center the grid horizontally
  const gridActualW = numCols * cellStep - cellGap;
  const gridLeft = Math.floor((width - gridActualW) / 2);

  // Show the most recent N days
  const recentDays = allDays.slice(-totalCells);

  // Draw cells. Attack on Titan and Game of Thrones each take over the whole
  // canvas (no per-cell tiles); Minecraft/One Piece draw pixel-art per cell;
  // everything else draws a solid box/circle. Pixel art needs antialiasing off so
  // block edges stay crisp — it's restored before the text below.
  const isAttackOnTitan = theme.style === "attackontitan";
  const isGot = theme.style === "gameofthrones";
  const isSpiderman = theme.style === "spiderman";
  const isPointBlank = theme.style === "pointblank";
  const isPokemon = theme.style === "pokemon";
  const isBreakingBad = theme.style === "breakingbad";
  const isBetterCallSaul = theme.style === "bettercallsaul";

  if (isAttackOnTitan) {
    // Attack on Titan takes over the whole canvas: the grid becomes the Wall
    // and the hero (Colossal Titan / Wings of Freedom) is painted on top.
    const levels = recentDays.map((d) => getContributionLevel(d.contributionCount));
    renderAotScene(ctx, {
      width, height, gridLeft, gridTop, numCols, numRows,
      cellSize, cellStep, cornerRadius, levels,
      variant: theme.variant as AttackOnTitanVariant,
    });
  } else if (isGot) {
    const levels = recentDays.map((d) => getContributionLevel(d.contributionCount));
    renderGotScene(ctx, {
      width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep,
      cornerRadius, levels, variant: theme.variant as GameOfThronesVariant,
    });
  } else if (isSpiderman) {
    const levels = recentDays.map((d) => getContributionLevel(d.contributionCount));
    renderSpidermanScene(ctx, {
      width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep,
      cornerRadius, levels, variant: theme.variant as SpidermanVariant,
    });
  } else if (isPointBlank) {
    const levels = recentDays.map((d) => getContributionLevel(d.contributionCount));
    renderPbScene(ctx, {
      width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep,
      cornerRadius, levels,
    });
  } else if (isPokemon) {
    const levels = recentDays.map((d) => getContributionLevel(d.contributionCount));
    renderPokemonScene(ctx, {
      width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep,
      cornerRadius, levels, variant: theme.variant as PokemonVariant,
    });
  } else if (isBreakingBad) {
    const levels = recentDays.map((d) => getContributionLevel(d.contributionCount));
    renderBreakingBadScene(ctx, {
      width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep,
      cornerRadius, levels,
    });
  } else if (isBetterCallSaul) {
    const levels = recentDays.map((d) => getContributionLevel(d.contributionCount));
    renderBetterCallSaulScene(ctx, {
      width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep,
      cornerRadius, levels,
    });
  } else {
    const isMinecraft = theme.style === "minecraft";
    const isOnePiece = theme.style === "onepiece";
    const isIronman = theme.style === "ironman";
    const isPixelArt = isMinecraft || isOnePiece || isIronman;
    if (isPixelArt) ctx.antialias = "none";
    for (let i = 0; i < recentDays.length; i++) {
      const col = i % numCols;
      const row = Math.floor(i / numCols);
      const x = gridLeft + col * cellStep;
      const y = gridTop + row * cellStep;
      const level = getContributionLevel(recentDays[i].contributionCount);
      const seed = (col + row * 3) % 8;
      if (isMinecraft) {
        drawMinecraftCell(ctx, x, y, cellSize, level, theme.variant as import("./lib/minecraft").MinecraftVariant, seed);
      } else if (isOnePiece) {
        drawOnePieceCell(ctx, x, y, cellSize, level, theme.variant as OnePieceVariant, seed);
      } else if (isIronman) {
        drawIronmanCell(ctx, x, y, cellSize, level, theme.variant as IronmanVariant, seed);
      } else {
        ctx.fillStyle = level === -1 ? theme.empty : theme.levels[level];
        drawCell(ctx, x, y, cellSize, cornerRadius, shape);
      }
    }
    if (isPixelArt) ctx.antialias = "subpixel";
  }

  // Bottom text — minimal, centered
  const gridBottom = gridTop + numRows * cellStep - cellGap;
  const bottomMid = gridBottom + Math.round(75 * scale);

  ctx.textAlign = "center";

  // Game of Thrones houses carry their words as a letter-spaced motto above the
  // username, in the house's own accent colour.
  if (isGot) {
    const words = GAMEOFTHRONES_WORDS[theme.variant as GameOfThronesVariant];
    if (words) {
      ctx.save();
      ctx.fillStyle = theme.text;
      ctx.font = `bold ${Math.round(15 * scale)}px Cinzel`;
      try {
        (ctx as unknown as { letterSpacing: string }).letterSpacing = `${Math.round(4 * scale)}px`;
      } catch {
        /* letterSpacing unsupported */
      }
      ctx.fillText(words.toUpperCase(), width / 2, bottomMid - Math.round(40 * scale));
      try {
        (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
      } catch {
        /* letterSpacing unsupported */
      }
      ctx.restore();
    }
  }

  // Point Blank's wordmark, two-toned like the official lockup — "Point" in the
  // brand emerald, "Blank" muted, in the terminal typeface.
  if (isPointBlank) {
    ctx.save();
    ctx.font = `bold ${Math.round(16 * scale)}px "JetBrains Mono"`;
    ctx.textAlign = "left";
    const p1 = "Point ";
    const p2 = "Blank";
    const w1 = ctx.measureText(p1).width;
    const w2 = ctx.measureText(p2).width;
    const startX = width / 2 - (w1 + w2) / 2;
    const wy = bottomMid - Math.round(40 * scale);
    ctx.fillStyle = theme.levels[2];
    ctx.fillText(p1, startX, wy);
    ctx.fillStyle = "#7f8f84";
    ctx.fillText(p2, startX + w1, wy);
    ctx.restore();
    ctx.textAlign = "center";
  }

  if (user) {
    ctx.fillStyle = theme.text;
    ctx.font = `bold ${Math.round(13 * scale)}px Inter`;
    ctx.fillText(`@${user}`, width / 2, bottomMid);
  }

  if (stats) {
    const streak = calculateStreak(weeks);
    ctx.fillStyle = theme.subtext;
    ctx.font = `${Math.round(11 * scale)}px Inter`;
    const statY = user ? bottomMid + Math.round(20 * scale) : bottomMid;
    ctx.fillText(
      `${totalContributions.toLocaleString()} contributions · ${streak}d streak`,
      width / 2,
      statY
    );
  }

  // Watermark
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = theme.subtext;
  ctx.font = `${Math.round(10 * scale)}px Inter`;
  ctx.fillText(WATERMARK, width / 2, height - Math.round(28 * scale));
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";

  return canvas.toBuffer("image/png");
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
  shape: CellShape
) {
  ctx.beginPath();
  if (shape === "circle") {
    const r = size / 2;
    ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  } else {
    ctx.roundRect(x, y, size, size, radius);
  }
  ctx.fill();
}
