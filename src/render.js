const { createCanvas, registerFont } = require("canvas");
const { getTheme } = require("./themes");
const { getDevice } = require("./devices");
const path = require("path");

const fontsDir = path.join(process.cwd(), "fonts");
registerFont(path.join(fontsDir, "Inter-Regular.ttf"), { family: "Inter" });
registerFont(path.join(fontsDir, "Inter-Bold.ttf"), { family: "Inter", weight: "bold" });

function getContributionLevel(count) {
  if (count === 0) return -1;
  if (count <= 3) return 0;
  if (count <= 6) return 1;
  if (count <= 9) return 2;
  return 3;
}

function renderWallpaper(calendar, options = {}) {
  const { theme: themeName = "classic", device: deviceName = "iphone14", stats = true, user = "", customWidth, customHeight } = options;

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

  // Draw cells
  for (let i = 0; i < recentDays.length; i++) {
    const col = i % numCols;
    const row = Math.floor(i / numCols);
    const x = gridLeft + col * cellStep;
    const y = gridTop + row * cellStep;
    const level = getContributionLevel(recentDays[i].contributionCount);
    ctx.fillStyle = level === -1 ? theme.empty : theme.levels[level];
    roundRect(ctx, x, y, cellSize, cellSize, cornerRadius);
  }

  // Bottom text — minimal, centered
  const gridBottom = gridTop + numRows * cellStep - cellGap;
  const bottomMid = gridBottom + Math.round(75 * scale);

  ctx.textAlign = "center";

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
  ctx.fillText("gitwall.dev", width / 2, height - Math.round(28 * scale));
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";

  return canvas.toBuffer("image/png");
}

function calculateStreak(weeks) {
  const allDays = [];
  for (let w = weeks.length - 1; w >= 0; w--) {
    const days = weeks[w].contributionDays;
    for (let d = days.length - 1; d >= 0; d--) {
      allDays.push(days[d]);
    }
  }

  let start = 0;
  if (allDays.length > 0 && allDays[0].contributionCount === 0) {
    start = 1;
  }

  let streak = 0;
  for (let i = start; i < allDays.length; i++) {
    if (allDays[i].contributionCount > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

module.exports = { renderWallpaper };
