"use client";

import { PaperCompass } from "@/components/PaperCompass";
import { PaperIcon } from "@/components/PaperIcon";
import { MountainCloudDecoration } from "@/components/MountainCloudDecoration";
import { SeatMapSvg } from "@/components/SeatMapSvg";
import type { ResultData } from "@/lib/types";

type ResultCardProps = {
  result: ResultData;
};

function mapRecommendedDirection(recommendedSeat: string) {
  if (recommendedSeat.includes("西北")) return "西北";
  if (recommendedSeat.includes("偏北")) return "西侧偏北";
  if (recommendedSeat.includes("东北")) return "东北";
  if (recommendedSeat.includes("东南")) return "东南";
  if (recommendedSeat.includes("西南")) return "西南";
  return null;
}

const summaryRows = [
  { key: "preferred", icon: "thumb", title: "优先位置" },
  { key: "avoid", icon: "ban", title: "避开位置" },
  { key: "mood", icon: "leaf", title: "状态提醒" },
  { key: "limit", icon: "shield", title: "边界建议" },
] as const;

export function ResultCard({ result }: ResultCardProps) {
  const highlightDirection = mapRecommendedDirection(result.recommendedSeat);
  const highlightedSeat = result.recommendedSeat.includes("西")
    ? "north-east"
    : result.recommendedSeat.includes("东南")
      ? "south-east"
      : result.recommendedSeat.includes("东北")
        ? "north-west"
        : "east-north";

  const rowContent = {
    preferred: `${result.recommendedSeat} / 视野较开阔`,
    avoid: result.discouragedSeat,
    mood: result.openingReminder,
    limit: result.stopLossReminder,
  } as const;
  const notes = [
    { label: "今日状态", value: result.todayState },
    { label: "推荐理由", value: result.reason },
    { label: "现场观察", value: result.sceneReading },
    { label: "传统讲究", value: result.traditionalNote },
    { label: "民俗提醒", value: result.folkReminder },
  ] as const;

  return (
    <div className="space-y-5">
      <section className="paper-scenery paper-hero paper-result-stage">
        <MountainCloudDecoration className="paper-result-landscape paper-result-landscape-left" />
        <MountainCloudDecoration className="paper-result-landscape paper-result-landscape-right" />
        <PaperCompass size="lg" highlightedDirection={highlightDirection} className="paper-result-compass" />
      </section>

      <section className="paper-panel paper-result-banner">
        <div className="paper-result-emblem">
          <div className="paper-result-emblem-inner"><PaperIcon name="compass" /></div>
        </div>
        <div className="paper-result-main">
          <div className="paper-result-kicker">推荐方位：</div>
          <div className="paper-result-banner-title mt-2">{result.recommendedSeat}</div>
          <p className="paper-result-banner-copy">{result.openingAdvice || "适合保持观察与节奏控制"}</p>
        </div>
        <span className="paper-pill-button paper-result-reference">仅供参考</span>
      </section>

      <section className="paper-result-summary-list">
        {summaryRows.map((row) => (
          <div key={row.key} className="paper-panel paper-result-summary-item">
            <div className="paper-summary-icon"><PaperIcon name={row.icon} /></div>
            <div className="paper-result-summary-copy">
              <div className="paper-panel-title text-[24px]">{row.title}</div>
              <div className="paper-result-row-copy">{rowContent[row.key]}</div>
            </div>
            <div className="paper-result-arrow">›</div>
          </div>
        ))}
      </section>

      <section className="paper-panel px-5 py-5">
        <div className="grid grid-cols-[110px_1fr] items-center gap-4">
          <div>
            <div className="paper-panel-title text-[24px]">环境示意</div>
            <p className="paper-fine-text mt-2">俯视示意图</p>
          </div>
          <div className="paper-seat-diagram">
            <SeatMapSvg highlightedSeat={highlightedSeat} className="paper-seatmap-svg" />
          </div>
        </div>
      </section>

      <section className="paper-panel px-5 py-5">
        <div className="paper-panel-title text-[24px]">文字解释</div>
        <div className="paper-result-note-grid">
          {notes.map((note) => (
            <div key={note.label} className="paper-result-note">
              <div className="paper-result-note-label">{note.label}</div>
              <p className="paper-result-note-copy">{note.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
