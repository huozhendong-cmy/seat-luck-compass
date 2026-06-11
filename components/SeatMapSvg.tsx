"use client";

type SeatMapSvgProps = {
  highlightedSeat?: "north-east" | "north-west" | "east-north" | "east-south" | "south-east" | "south-west" | "west-north" | "west-south";
  className?: string;
};

const seats = [
  { key: "north-west", x: 96, y: 50, rotate: 0 },
  { key: "north-east", x: 286, y: 50, rotate: 0 },
  { key: "west-north", x: 42, y: 120, rotate: -90 },
  { key: "west-south", x: 42, y: 216, rotate: -90 },
  { key: "east-north", x: 340, y: 120, rotate: 90 },
  { key: "east-south", x: 340, y: 216, rotate: 90 },
  { key: "south-west", x: 96, y: 286, rotate: 0 },
  { key: "south-east", x: 286, y: 286, rotate: 0 },
] as const;

export function SeatMapSvg({ highlightedSeat = "north-east", className = "" }: SeatMapSvgProps) {
  return (
    <svg viewBox="0 0 384 336" aria-hidden="true" className={className}>
      <rect x="18" y="18" width="348" height="300" rx="8" className="seatmap-frame" />
      <path d="M160 18h64v22" className="seatmap-door" />
      <rect x="42" y="28" width="44" height="10" className="seatmap-window" />
      <rect x="298" y="28" width="44" height="10" className="seatmap-window" />
      <rect x="26" y="86" width="10" height="54" className="seatmap-window" />

      <rect x="98" y="100" width="188" height="134" rx="18" className="seatmap-table" />

      {seats.map((seat) => (
        <rect
          key={seat.key}
          x={seat.x}
          y={seat.y}
          width="34"
          height="48"
          rx="8"
          transform={seat.rotate ? `rotate(${seat.rotate} ${seat.x + 17} ${seat.y + 24})` : undefined}
          className={seat.key === highlightedSeat ? "seatmap-chair active" : "seatmap-chair"}
        />
      ))}

      <g className="seatmap-flower">
        <circle cx="332" cy="72" r="12" />
        <path d="M332 54v36M314 72h36M320 60l24 24M344 60l-24 24" />
      </g>
    </svg>
  );
}
