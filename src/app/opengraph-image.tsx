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
  // Using the vibrant 'Sunset' theme to make it look incredibly cool
  const bg = "#1a1a2e";
  const levels = ["#16213e", "#e94560", "#f27121", "#e9724c", "#ffc857"];

  // Generate a deterministic pattern for the phone's grid
  const boxes = Array.from({ length: 300 }).map((_, i) => {
    // Creating a wave-like pattern of contributions
    const val = Math.sin(i / 5) * Math.cos(i / 10);
    let level = 0;
    if (val > 0.8) level = 4;
    else if (val > 0.4) level = 3;
    else if (val > 0) level = 2;
    else if (val > -0.5) level = 1;
    
    return levels[level];
  });

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0d0d0d", // Deep dark background
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          fontFamily: "sans-serif",
          color: "#ffffff",
          paddingTop: "60px",
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
            }}
          >
            GitWall
          </h1>
          <p
            style={{
              fontSize: "32px",
              color: "#888888",
              marginTop: "16px",
              margin: 0,
            }}
          >
            Generate iPhone wallpapers from your GitHub contribution graph
          </p>
        </div>

        {/* iPhone Mockup Container */}
        <div
          style={{
            marginTop: "50px",
            width: "320px",
            height: "650px", // Pushes off the bottom of the image slightly for a cool effect
            borderRadius: "48px",
            background: bg,
            border: "8px solid #222222",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
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

          {/* GitHub Graph Grid inside the phone */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              padding: "0 16px",
              marginTop: "30px",
              justifyContent: "center",
              width: "100%",
            }}
          >
            {boxes.map((color, i) => (
              <div
                key={i}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  background: color,
                }}
              />
            ))}
          </div>

          {/* Bottom Bar indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              width: "120px",
              height: "4px",
              background: "rgba(255,255,255,0.8)",
              borderRadius: "2px",
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
