const THEMES = {
  classic: {
    name: "Classic",
    background: "#0d1117",
    empty: "#161b22",
    levels: ["#0e4429", "#006d32", "#26a641", "#39d353"],
    text: "#c9d1d9",
    subtext: "#8b949e",
  },
  light: {
    name: "Light",
    background: "#ffffff",
    empty: "#ebedf0",
    levels: ["#9be9a8", "#40c463", "#30a14e", "#216e39"],
    text: "#24292f",
    subtext: "#57606a",
  },
  dracula: {
    name: "Dracula",
    background: "#282a36",
    empty: "#44475a",
    levels: ["#6272a4", "#bd93f9", "#ff79c6", "#50fa7b"],
    text: "#f8f8f2",
    subtext: "#6272a4",
  },
  nord: {
    name: "Nord",
    background: "#2e3440",
    empty: "#3b4252",
    levels: ["#5e81ac", "#81a1c1", "#88c0d0", "#8fbcbb"],
    text: "#eceff4",
    subtext: "#d8dee9",
  },
  ocean: {
    name: "Ocean",
    background: "#0a192f",
    empty: "#112240",
    levels: ["#1d3461", "#1f5f8b", "#00b4d8", "#90e0ef"],
    text: "#ccd6f6",
    subtext: "#8892b0",
  },
  sunset: {
    name: "Sunset",
    background: "#1a1a2e",
    empty: "#16213e",
    levels: ["#e94560", "#f27121", "#e9724c", "#ffc857"],
    text: "#eee2dc",
    subtext: "#bab2b5",
  },
  mono: {
    name: "Mono",
    background: "#000000",
    empty: "#1a1a1a",
    levels: ["#404040", "#737373", "#a6a6a6", "#d9d9d9"],
    text: "#ffffff",
    subtext: "#999999",
  },
};

function getTheme(name) {
  return THEMES[name] || THEMES.classic;
}

module.exports = { THEMES, getTheme };
