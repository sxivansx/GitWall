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
  // Authentic GitHub Classic Theme
  const bg = "#0d1117"; // GitHub dark background
  const empty = "#161b22";
  const levels = ["#0e4429", "#006d32", "#26a641", "#39d353"];

  // Generate a random-looking but deterministic GitHub graph pattern
  // to fill the entire screen of the iPhone
  const boxes = Array.from({ length: 600 }).map((_, i) => {
    // 65% chance of being empty, 35% chance of having a contribution
    const val = (Math.sin(i * 13) * Math.cos(i * 17)) * 100;
    
    if (val > 80) return levels[3];
    if (val > 60) return levels[2];
    if (val > 40) return levels[1];
    if (val > 20) return levels[0];
    return empty;
  });

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
            Generate iPhone wallpapers from your GitHub contribution graph
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
              marginBottom: "20px",
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

          {/* Full Screen GitHub Graph Grid */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "3px",
              padding: "0 12px", // Tight padding to edge
              justifyContent: "flex-start",
              width: "100%",
              height: "100%",
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
          
          {/* Bottom Gradient Fade to make it look like a wallpaper */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "150px",
              background: "linear-gradient(to bottom, rgba(13,17,23,0) 0%, rgba(13,17,23,1) 100%)",
              zIndex: 5,
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
