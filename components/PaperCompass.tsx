"use client";

type PaperCompassProps = {
  size?: "sm" | "md" | "lg" | "xl";
  highlightedDirection?: string | null;
  className?: string;
  showPalm?: boolean;
  showDirections?: boolean;
  showBranches?: boolean;
  showCoreDots?: boolean;
};

const directions = [
  { label: "南", angle: -90, x: 215, y: 32 },
  { label: "西南", angle: -45, x: 339, y: 83 },
  { label: "西", angle: 0, x: 390, y: 215 },
  { label: "西北", angle: 45, x: 338, y: 345 },
  { label: "北", angle: 90, x: 215, y: 398 },
  { label: "东北", angle: 135, x: 88, y: 345 },
  { label: "东", angle: 180, x: 40, y: 215 },
  { label: "东南", angle: 225, x: 88, y: 83 },
] as const;

const trigramSets = ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"] as const;
const earthlyBranches = [
  { label: "午", x: 215, y: 88 },
  { label: "未", x: 272, y: 102 },
  { label: "申", x: 318, y: 148 },
  { label: "酉", x: 333, y: 215 },
  { label: "戌", x: 316, y: 281 },
  { label: "亥", x: 270, y: 328 },
  { label: "子", x: 215, y: 343 },
  { label: "丑", x: 160, y: 328 },
  { label: "寅", x: 114, y: 282 },
  { label: "卯", x: 98, y: 215 },
  { label: "辰", x: 114, y: 148 },
  { label: "巳", x: 160, y: 102 },
] as const;

function PalmGlyph() {
  return (
    <path
      d="M230 183.5c7.2 0 13 5.8 13 13v52.7h6.1v-78.1c0-7.7 6.2-13.9 13.9-13.9s13.9 6.2 13.9 13.9v79.6h6.2v-58.2c0-7.5 6-13.5 13.5-13.5 7.5 0 13.5 6 13.5 13.5v77.8h6.2v-58.6c0-7.2 5.8-13 13-13s13 5.8 13 13v85.4c0 34.7-16 56.6-43.2 66.7-18.2 6.7-37.3 7.2-56.3 2.1-17-4.6-32.2-13.8-43.7-27.5l-23.1-27.9c-8.5-10-7.2-24.9 2.8-33.4 10-8.5 24.9-7.2 33.4 2.8l17.5 20.5v-87.3c0-7.2 5.8-13 13-13Z"
      fill="currentColor"
      transform="translate(-20 -14) scale(0.95)"
    />
  );
}

function highlightPath(label: string | null) {
  switch (label) {
    case "西北":
      return "M215 215 L353 274 A160 160 0 0 1 286 359 Z";
    case "西侧偏北":
      return "M215 215 L365 266 A164 164 0 0 1 286 360 Z";
    case "东北":
      return "M215 215 L143 356 A160 160 0 0 1 76 286 Z";
    case "东南":
      return "M215 215 L76 144 A160 160 0 0 1 144 76 Z";
    case "西南":
      return "M215 215 L287 72 A160 160 0 0 1 356 143 Z";
    default:
      return "";
  }
}

export function PaperCompass({
  size = "lg",
  highlightedDirection = null,
  className = "",
  showPalm = true,
  showDirections = true,
  showBranches = true,
  showCoreDots = true,
}: PaperCompassProps) {
  const highlight = highlightPath(highlightedDirection);

  return (
    <div className={`paper-compass paper-compass-${size} ${className}`.trim()}>
      <svg viewBox="0 0 430 430" aria-hidden="true" className="paper-compass-svg">
        <defs>
          <radialGradient id="paperCenterDisc" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.84)" />
            <stop offset="100%" stopColor="rgba(228,217,196,0.96)" />
          </radialGradient>
          <linearGradient id="paperGoldRing" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#D0A45B" />
            <stop offset="100%" stopColor="#9F7130" />
          </linearGradient>
          <linearGradient id="paperHighlight" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(246,232,194,0.16)" />
            <stop offset="55%" stopColor="rgba(226,188,109,0.30)" />
            <stop offset="100%" stopColor="rgba(212,159,58,0.52)" />
          </linearGradient>
        </defs>

        <circle cx="215" cy="215" r="186" className="paper-compass-ring paper-compass-ring-outer" />
        <circle cx="215" cy="215" r="172" className="paper-compass-ring paper-compass-ring-hairline" />
        <circle cx="215" cy="215" r="152" className="paper-compass-ring" />
        <circle cx="215" cy="215" r="132" className="paper-compass-ring paper-compass-ring-hairline" />
        <circle cx="215" cy="215" r="112" className="paper-compass-ring" />
        <circle cx="215" cy="215" r="72" className="paper-compass-ring" />

        {highlight ? <path d={highlight} fill="url(#paperHighlight)" className="paper-compass-sector" /> : null}

        {Array.from({ length: 8 }, (_, index) => (
          <line
            key={`line-${index}`}
            x1="215"
            y1="29"
            x2="215"
            y2="401"
            className="paper-compass-axis"
            transform={`rotate(${index * 45} 215 215)`}
          />
        ))}

        {Array.from({ length: 16 }, (_, index) => (
          <circle
            key={`dot-${index}`}
            cx="215"
            cy={32}
            r={index % 2 === 0 ? 4.3 : 2.4}
            className="paper-compass-star"
            transform={`rotate(${index * 22.5} 215 215)`}
          />
        ))}

        {Array.from({ length: 24 }, (_, index) => (
          <line
            key={`tick-${index}`}
            x1="215"
            y1={40}
            x2="215"
            y2={index % 2 === 0 ? 58 : 51}
            className="paper-compass-tick"
            transform={`rotate(${index * 15} 215 215)`}
          />
        ))}

        {trigramSets.map((glyph, index) => (
          <text
            key={`glyph-${glyph}`}
            x="215"
            y="83"
            className="paper-compass-glyph"
            textAnchor="middle"
            transform={`rotate(${index * 45} 215 215)`}
          >
            {glyph}
          </text>
        ))}

        {showBranches
          ? earthlyBranches.map((branch) => (
              <text
                key={branch.label}
                x={branch.x}
                y={branch.y}
                textAnchor="middle"
                className="paper-compass-branch"
              >
                {branch.label}
              </text>
            ))
          : null}

        {showDirections
          ? directions.map((direction) => (
              <text
                key={direction.label}
                x={direction.x}
                y={direction.y}
                textAnchor="middle"
                className={`paper-compass-direction-text ${highlightedDirection === direction.label ? "active" : ""}`}
              >
                {direction.label}
              </text>
            ))
          : null}

        <circle cx="215" cy="215" r="60" fill="url(#paperGoldRing)" />
        <circle cx="215" cy="215" r="50.5" fill="url(#paperCenterDisc)" stroke="rgba(255,255,255,0.8)" strokeWidth="3" />
        {showCoreDots
          ? Array.from({ length: 12 }, (_, index) => (
              <circle
                key={`core-dot-${index}`}
                cx="215"
                cy="154"
                r="2.9"
                className="paper-compass-core-dot"
                transform={`rotate(${index * 30} 215 215)`}
              />
            ))
          : null}
        {showPalm ? (
          <g className="paper-compass-palm">
            <PalmGlyph />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
