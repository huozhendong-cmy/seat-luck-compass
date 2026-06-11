"use client";

import type { ReactElement } from "react";

type PaperIconName =
  | "compass"
  | "image"
  | "history"
  | "upload"
  | "shield"
  | "chat"
  | "thumb"
  | "ban"
  | "leaf"
  | "sun"
  | "window"
  | "people"
  | "home"
  | "record"
  | "user"
  | "eye"
  | "corner"
  | "target"
  | "door";

type PaperIconProps = {
  name: PaperIconName;
  className?: string;
};

export function PaperIcon({ name, className = "" }: PaperIconProps) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons: Record<PaperIconName, ReactElement> = {
    compass: (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="1.2" />
        <path d="M14.8 9.2 13 14l-4.8 1.8L10 11z" />
      </svg>
    ),
    image: (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="14" rx="2.5" />
        <circle cx="9" cy="10" r="1.4" />
        <path d="m7 16 3.5-3.5 2.6 2.6 2.4-2.4L18 15.2" />
      </svg>
    ),
    history: (
      <svg {...common}>
        <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
        <path d="M4.5 5.7v3.7h3.7" />
        <path d="M12 8.3v4.3l3 1.8" />
      </svg>
    ),
    upload: (
      <svg {...common}>
        <path d="M7.5 17.5h9a3.5 3.5 0 0 0 .4-7A5.5 5.5 0 0 0 6.7 9.4 3.7 3.7 0 0 0 7.5 17.5Z" />
        <path d="m12 14.2 0-6" />
        <path d="m9.5 10.7 2.5-2.5 2.5 2.5" />
      </svg>
    ),
    shield: (
      <svg {...common}>
        <path d="M12 3.8 18 6v4.8c0 4-2.2 6.7-6 9.4-3.8-2.7-6-5.4-6-9.4V6z" />
      </svg>
    ),
    chat: (
      <svg {...common}>
        <path d="M6 17.5 4.6 20l-.2-3A6.7 6.7 0 0 1 3 13c0-3.9 4-7 9-7s9 3.1 9 7-4 7-9 7a11 11 0 0 1-6-.5Z" />
        <path d="M9 12h.01M12 12h.01M15 12h.01" />
      </svg>
    ),
    thumb: (
      <svg {...common}>
        <path d="M8.5 10.5 11 5.3a1.7 1.7 0 0 1 3 1.2v3.5h3.2a1.8 1.8 0 0 1 1.8 2.2l-1.2 5a2 2 0 0 1-1.9 1.5H8.5" />
        <path d="M5 10.5h3.5v8H5z" />
      </svg>
    ),
    ban: (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.4 15.6 7.2-7.2" />
      </svg>
    ),
    leaf: (
      <svg {...common}>
        <path d="M18.5 6.5c-5.7-.4-10.2 2.8-11.4 7.7-.5 2 0 4.1 1.2 5.8 5.2-.6 8.8-4.2 10-9.3.2-1.4.3-2.8.2-4.2Z" />
        <path d="M8.5 17.5c2-2.2 3.8-3.8 6.8-5.6" />
      </svg>
    ),
    sun: (
      <svg {...common}>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.7v2.1M12 18.2v2.1M20.3 12h-2.1M5.8 12H3.7M17.9 6.1 16.4 7.6M7.6 16.4l-1.5 1.5M17.9 17.9l-1.5-1.5M7.6 7.6 6.1 6.1" />
      </svg>
    ),
    window: (
      <svg {...common}>
        <rect x="5" y="4.5" width="14" height="15" rx="1.5" />
        <path d="M12 4.5v15M5 12h14" />
      </svg>
    ),
    people: (
      <svg {...common}>
        <circle cx="9" cy="9" r="2.3" />
        <circle cx="15.8" cy="10.2" r="1.9" />
        <path d="M5.7 17.6c.7-2.4 2.5-3.6 5.3-3.6s4.6 1.2 5.3 3.6" />
        <path d="M14.3 17.1c.5-1.6 1.8-2.5 3.7-2.5 1 0 1.9.2 2.7.7" />
      </svg>
    ),
    home: (
      <svg {...common}>
        <path d="m4.5 10 7.5-6 7.5 6" />
        <path d="M6.3 9.2V19h11.4V9.2" />
      </svg>
    ),
    record: (
      <svg {...common}>
        <path d="M7 5.5h10M7 10h10M7 14.5h10M5 5.5h.01M5 10h.01M5 14.5h.01" />
        <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="2.5" />
      </svg>
    ),
    user: (
      <svg {...common}>
        <circle cx="12" cy="8.7" r="3.1" />
        <path d="M5.6 18.3c1.2-2.6 3.3-4 6.4-4 3.1 0 5.2 1.4 6.4 4" />
      </svg>
    ),
    eye: (
      <svg {...common}>
        <path d="M2.8 12s3.5-5 9.2-5 9.2 5 9.2 5-3.5 5-9.2 5-9.2-5-9.2-5Z" />
        <circle cx="12" cy="12" r="2.3" />
      </svg>
    ),
    corner: (
      <svg {...common}>
        <path d="M8 8H5v3M16 8h3v3M8 16H5v-3M16 16h3v-3" />
      </svg>
    ),
    target: (
      <svg {...common}>
        <circle cx="12" cy="12" r="5.7" />
        <path d="M12 3.8v3M12 17.2v3M20.2 12h-3M6.8 12h-3" />
        <circle cx="12" cy="12" r="1.8" />
      </svg>
    ),
    door: (
      <svg {...common}>
        <path d="M7 4.8h10v14.4H7z" />
        <path d="M11.5 12h.01" />
        <path d="M17 4.8 20 7v12H7" />
      </svg>
    ),
  };

  return <span className={`inline-flex h-[1em] w-[1em] ${className}`.trim()}>{icons[name]}</span>;
}
