import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 20% 18%, rgba(255,255,255,0.86), transparent 28%), linear-gradient(180deg, #fbf7f1 0%, #f2e7d6 100%)",
          color: "#31584a",
          position: "relative",
          fontFamily: '"PingFang SC", "Noto Sans SC", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 42,
            borderRadius: 80,
            border: "8px solid rgba(179, 146, 89, 0.46)",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.55)",
          }}
        />
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: 9999,
            border: "12px solid #31584a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: "rgba(255, 251, 245, 0.72)",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 12,
              height: 180,
              background: "#b39259",
              borderRadius: 9999,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 180,
              height: 12,
              background: "#b39259",
              borderRadius: 9999,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 64, lineHeight: 1 }}>兔</div>
            <div
              style={{
                fontSize: 28,
                letterSpacing: "0.18em",
                color: "#6c5a3a",
              }}
            >
              罗盘
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
