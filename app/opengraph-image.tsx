import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "linear-gradient(135deg, #fbf7f1 0%, #f5ede1 60%, #efe6d8 100%)",
          color: "#24342d",
          fontFamily: '"PingFang SC", "Noto Sans CJK SC", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 40,
            borderRadius: 36,
            border: "1px solid rgba(129,101,58,0.14)",
            background:
              "linear-gradient(180deg, rgba(255,253,249,0.96), rgba(250,243,232,0.98))",
            display: "flex",
            padding: "48px 56px",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "58%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  fontSize: 22,
                  letterSpacing: 6,
                  color: "#846437",
                }}
              >
                TODAY SEAT COMPASS
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 78,
                  fontWeight: 700,
                  lineHeight: 1.04,
                  gap: 6,
                }}
              >
                <span>今日</span>
                <span>座位罗盘</span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 32,
                  lineHeight: 1.6,
                  color: "#5f6d65",
                  gap: 2,
                }}
              >
                <span>入场前测一测，生成你的今日推荐座位、</span>
                <span>状态提醒与环境建议卡。</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 18 }}>
              {[
                ["综合评分", "84"],
                ["推荐座位", "靠墙位"],
                ["提醒重点", "先稳住节奏"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    minWidth: 160,
                    padding: "18px 22px",
                    borderRadius: 24,
                    border: "1px solid rgba(129,101,58,0.12)",
                    background: "rgba(255,255,255,0.72)",
                  }}
                >
                  <div style={{ fontSize: 18, color: "#846437" }}>{label}</div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              width: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: 9999,
                border: "1px solid rgba(129,101,58,0.16)",
                background:
                  "radial-gradient(circle at center, rgba(228,210,175,0.45), transparent 44%), radial-gradient(circle at center, rgba(223,233,227,0.95), transparent 74%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 4,
                  height: 92,
                  background: "#856739",
                  borderRadius: 999,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: 92,
                  height: 4,
                  background: "#856739",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
