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
  const { theme: themeName = "classic", device: deviceName = "iphone14", stats = true, user = "" } = options;

  const theme = getTheme(themeName);
  const device = getDevice(deviceName);
  const { width, height } = device;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, width, height);

  const weeks = calendar.weeks;
  const totalContributions = calendar.totalContributions;

  // Grid layout calculations
  const numWeeks = weeks.length; // typically 52-53
  const daysPerWeek = 7;

  // Scale everything relative to device width
  const scale = width / 1170;
  const cellSize = Math.floor(12 * scale);
  const cellGap = Math.floor(3 * scale);
  const cellStep = cellSize + cellGap;
  const cornerRadius = Math.floor(2.5 * scale);

  const gridWidth = numWeeks * cellStep - cellGap;
  const gridHeight = daysPerWeek * cellStep - cellGap;

  // Center the grid, shifted up to leave room for stats at bottom
  const gridX = Math.floor((width - gridWidth) / 2);
  const gridY = Math.floor(height * 0.38);

  // Draw month labels
  ctx.fillStyle = theme.subtext;
  ctx.font = `${Math.floor(14 * scale)}px Inter`;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const firstDay = weeks[w].contributionDays[0];
    if (!firstDay) continue;
    const month = new Date(firstDay.date).getMonth();
    if (month !== lastMonth) {
      lastMonth = month;
      const x = gridX + w * cellStep;
      ctx.fillText(months[month], x, gridY - Math.floor(10 * scale));
    }
  }

  // Draw contribution cells
  for (let w = 0; w < weeks.length; w++) {
    const days = weeks[w].contributionDays;
    for (let d = 0; d < days.length; d++) {
      const day = days[d];
      const level = getContributionLevel(day.contributionCount);
      ctx.fillStyle = level === -1 ? theme.empty : theme.levels[level];

      const x = gridX + w * cellStep;
      const y = gridY + d * cellStep;

      // Rounded rectangle
      roundRect(ctx, x, y, cellSize, cellSize, cornerRadius);
    }
  }

  // Username title
  if (user) {
    ctx.fillStyle = theme.text;
    ctx.font = `bold ${Math.floor(28 * scale)}px Inter`;
    ctx.textAlign = "center";
    ctx.fillText(`@${user}`, width / 2, gridY - Math.floor(50 * scale));
    ctx.textAlign = "left";
  }

  // Stats section below graph
  if (stats) {
    const statsY = gridY + gridHeight + Math.floor(60 * scale);

    ctx.fillStyle = theme.text;
    ctx.font = `bold ${Math.floor(42 * scale)}px Inter`;
    ctx.textAlign = "center";
    ctx.fillText(`${totalContributions.toLocaleString()}`, width / 2, statsY);

    ctx.fillStyle = theme.subtext;
    ctx.font = `${Math.floor(16 * scale)}px Inter`;
    ctx.fillText("contributions in the last year", width / 2, statsY + Math.floor(30 * scale));

    // Current streak and today's contributions
    const today = weeks[weeks.length - 1]?.contributionDays;
    const todayCount = today?.[today.length - 1]?.contributionCount ?? 0;
    const streak = calculateStreak(weeks);

    const statSpacing = Math.floor(200 * scale);
    const statRowY = statsY + Math.floor(90 * scale);

    // Today
    ctx.fillStyle = theme.text;
    ctx.font = `bold ${Math.floor(28 * scale)}px Inter`;
    ctx.fillText(`${todayCount}`, width / 2 - statSpacing / 2, statRowY);
    ctx.fillStyle = theme.subtext;
    ctx.font = `${Math.floor(14 * scale)}px Inter`;
    ctx.fillText("today", width / 2 - statSpacing / 2, statRowY + Math.floor(22 * scale));

    // Streak
    ctx.fillStyle = theme.text;
    ctx.font = `bold ${Math.floor(28 * scale)}px Inter`;
    ctx.fillText(`${streak}`, width / 2 + statSpacing / 2, statRowY);
    ctx.fillStyle = theme.subtext;
    ctx.font = `${Math.floor(14 * scale)}px Inter`;
    ctx.fillText("day streak", width / 2 + statSpacing / 2, statRowY + Math.floor(22 * scale));

    ctx.textAlign = "left";
  }

  // Legend at bottom
  const legendY = height - Math.floor(80 * scale);
  const legendCellSize = Math.floor(10 * scale);
  const legendGap = Math.floor(4 * scale);
  const legendItems = [theme.empty, ...theme.levels];
  const legendWidth = legendItems.length * (legendCellSize + legendGap) - legendGap;
  const legendStartX = (width - legendWidth - Math.floor(80 * scale)) / 2;

  ctx.fillStyle = theme.subtext;
  ctx.font = `${Math.floor(12 * scale)}px Inter`;
  ctx.fillText("Less", legendStartX, legendY + legendCellSize / 2 + 4 * scale);

  const cellsStartX = legendStartX + Math.floor(40 * scale);
  for (let i = 0; i < legendItems.length; i++) {
    ctx.fillStyle = legendItems[i];
    roundRect(ctx, cellsStartX + i * (legendCellSize + legendGap), legendY, legendCellSize, legendCellSize, Math.floor(2 * scale));
  }

  ctx.fillStyle = theme.subtext;
  ctx.fillText("More", cellsStartX + legendItems.length * (legendCellSize + legendGap) + Math.floor(4 * scale), legendY + legendCellSize / 2 + 4 * scale);

  // Watermark
  ctx.fillStyle = theme.subtext;
  ctx.font = `${Math.floor(11 * scale)}px Inter`;
  ctx.textAlign = "center";
  ctx.fillText("GitWall", width / 2, height - Math.floor(30 * scale));
  ctx.textAlign = "left";

  return canvas.toBuffer("image/png");
}

function calculateStreak(weeks) {
  let streak = 0;
  // Flatten all days in reverse chronological order
  const allDays = [];
  for (let w = weeks.length - 1; w >= 0; w--) {
    const days = weeks[w].contributionDays;
    for (let d = days.length - 1; d >= 0; d--) {
      allDays.push(days[d]);
    }
  }

  // Skip today if it has 0 (day might not be over)
  let start = 0;
  if (allDays.length > 0 && allDays[0].contributionCount === 0) {
    start = 1;
  }

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
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

module.exports = { renderWallpaper };
