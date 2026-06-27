import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "GitWall - Generate wallpapers from your GitHub contribution graph";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  // Authentic GitHub Classic Theme
  const bg = "#0d1117"; // GitHub dark background
  const empty = "#161b22";
  const levels = ["#0e4429", "#006d32", "#26a641", "#39d353"];

  // Create a massive grid of tiny dots using SVG
  const cols = 50;
  const rows = 90;
  const boxSize = 4;
  const gap = 2;
  const step = boxSize + gap;
  
  let rects = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Deterministic randomness for graph
      const val = (Math.sin(r * 13) * Math.cos(c * 17)) * 100;
      let color = empty;
      if (val > 80) color = levels[3];
      else if (val > 60) color = levels[2];
      else if (val > 40) color = levels[1];
      else if (val > 20) color = levels[0];

      rects += `<rect x="${c * step}" y="${r * step}" width="${boxSize}" height="${boxSize}" rx="1" fill="${color}" />`;
    }
  }

  const svgString = `<svg width="${cols * step}" height="${rows * step}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
  const base64Svg = `data:image/svg+xml;base64,${btoa(svgString)}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#050505", // Very deep dark background for the canvas
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          fontFamily: "sans-serif",
          color: "#ffffff",
          paddingTop: "50px",
        }}
      >
        {/* Title & Subtitle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              margin: 0,
              padding: 0,
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            GitWall
          </h1>
          <p
            style={{
              fontSize: "30px",
              color: "#888888",
              marginTop: "12px",
              margin: 0,
            }}
          >
            Generate wallpapers from your GitHub contribution graph
          </p>
        </div>

        {/* iPhone Mockup Container */}
        <div
          style={{
            marginTop: "40px",
            width: "330px",
            height: "680px", // Pulls it down to simulate the whole phone
            borderRadius: "48px",
            background: bg,
            border: "8px solid #222222",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            boxShadow: "0 25px 60px rgba(0,0,0,0.9)",
            overflow: "hidden",
          }}
        >
          {/* Dynamic Island */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              width: "100px",
              height: "28px",
              background: "#000000",
              borderRadius: "14px",
              zIndex: 10,
            }}
          />

          {/* Lock Screen Time */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "70px",
              marginBottom: "30px",
              zIndex: 10,
            }}
          >
            <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              Wednesday, October 28
            </div>
            <div
              style={{
                fontSize: "76px",
                fontWeight: "bold",
                color: "rgba(255,255,255,0.9)",
                marginTop: "-10px",
                letterSpacing: "-0.04em",
              }}
            >
              9:41
            </div>
          </div>

          {/* Full Screen GitHub Graph Grid as SVG Background */}
          <div
            style={{
              display: "flex",
              width: "300px",
              height: "540px",
              backgroundImage: `url(${base64Svg})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "top center",
            }}
          />
          
          {/* Bottom Bar indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              width: "120px",
              height: "4px",
              background: "rgba(255,255,255,0.8)",
              borderRadius: "2px",
              zIndex: 10,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
