"use client";

import type { ReactNode } from "react";

type OptionGridProps<T extends string> = {
  options: readonly T[];
  value: T | T[];
  multiple?: boolean;
  onChange: (value: T | T[]) => void;
  columns?: number;
  renderOption?: (option: T, active: boolean) => ReactNode;
  optionClassName?: string;
};

export function OptionGrid<T extends string>({
  options,
  value,
  multiple = false,
  onChange,
  columns = 2,
  renderOption,
  optionClassName = "",
}: OptionGridProps<T>) {
  const selectedList = Array.isArray(value) ? value : [value];

  return (
    <div
      className="segment-grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const active = selectedList.includes(option);

        return (
          <button
            key={option}
            type="button"
            className={`option-chip ${active ? "active" : ""} ${optionClassName}`.trim()}
            aria-pressed={active}
            onClick={() => {
              if (!multiple) {
                onChange(option);
                return;
              }

              const next = active
                ? selectedList.filter((item) => item !== option)
                : [...selectedList, option];
              onChange(next);
            }}
          >
            {renderOption ? renderOption(option, active) : option}
          </button>
        );
      })}
    </div>
  );
}
