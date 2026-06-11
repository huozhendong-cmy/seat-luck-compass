"use client";

type MountainCloudDecorationProps = {
  className?: string;
};

export function MountainCloudDecoration({ className = "" }: MountainCloudDecorationProps) {
  return (
    <svg viewBox="0 0 430 240" aria-hidden="true" className={className}>
      <g opacity="0.22">
        <path d="M28 170c28-40 48-62 64-62 18 0 32 18 54 56 20-30 36-44 46-44 14 0 28 16 52 50" className="paper-deco-mountain" />
        <path d="M236 184c26-34 48-52 66-52 19 0 31 12 56 44 22-22 38-32 50-32 10 0 20 8 32 24" className="paper-deco-mountain soft" />
      </g>
      <g opacity="0.3">
        <path d="M40 108h72c8 0 14-6 14-14 0-8-6-14-14-14 0-12-10-22-22-22-8 0-15 4-19 11-4-3-9-5-15-5-12 0-22 10-22 22v2" className="paper-deco-cloud" />
        <path d="M288 78h90c8 0 14-6 14-14s-6-14-14-14c0-12-10-22-22-22-8 0-15 4-19 11-4-3-9-5-15-5-12 0-22 10-22 22v2" className="paper-deco-cloud" />
      </g>
    </svg>
  );
}
