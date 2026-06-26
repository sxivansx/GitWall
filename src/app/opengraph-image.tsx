import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "GitWall - Generate iPhone wallpapers from your GitHub contribution graph";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const levels = ["#161C23", "#023A16", "#196E2D", "#2CA044", "#39d353"];

  // Generate a deterministic pattern for the background grid
  const boxes = Array.from({ length: 400 }).map((_, i) => {
    // Pseudo-random but deterministic index based on position
    const colorIndex = (Math.sin(i) * 10000) % 5;
    const absIndex = Math.floor(Math.abs(colorIndex));
    return levels[absIndex];
  });

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0C1116",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#ffffff",
          position: "relative",
        }}
      >
        {/* Background decorative grid */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            position: "absolute",
            top: -50,
            left: -50,
            opacity: 0.25,
            flexWrap: "wrap",
            width: "1300px",
          }}
        >
          {boxes.map((color, i) => (
            <div
              key={i}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: color,
              }}
            />
          ))}
        </div>

        {/* Foreground Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10,
            background: "rgba(12, 17, 22, 0.8)",
            padding: "60px 80px",
            borderRadius: "30px",
            border: "1px solid #30363d",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          }}
        >
          <h1
            style={{
              fontSize: "110px",
              fontWeight: "bold",
              margin: 0,
              padding: 0,
              letterSpacing: "-0.05em",
            }}
          >
            GitWall
          </h1>
          <p
            style={{
              fontSize: "42px",
              color: "#8b949e",
              marginTop: "20px",
              textAlign: "center",
              maxWidth: "800px",
              lineHeight: 1.4,
            }}
          >
            Generate beautiful iPhone wallpapers from your GitHub contribution graph
          </p>

          <div style={{ display: "flex", marginTop: "50px", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: levels[0],
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: levels[1],
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: levels[2],
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: levels[3],
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: levels[4],
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
