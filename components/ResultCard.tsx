"use client";

import type { ResultData } from "@/lib/types";

type ResultCardProps = {
  result: ResultData;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ResultCard({ result }: ResultCardProps) {
  const traditionalNote = result.traditionalNote ?? result.reason;
  const sceneReading = result.sceneReading ?? result.reason;
  const todayAvoid = result.todayAvoid ?? `今天宜先避开${result.discouragedSeat}。`;
  const folkReminder = result.folkReminder ?? `可把 ${result.luckyColor} 当作今日顺手色，提醒自己先稳住节奏。`;
  const totalScore = result.totalScore ?? 0;
  const scoreItems = result.scoreItems ?? [];

  return (
    <div className="result-card px-5 pb-5 pt-6">
      <div className="space-y-6">
        <div className="result-hero">
          <div className="eyebrow justify-center">Today Seat Compass</div>
          <div className="mt-4">
            <div className="compass-core">
              <div className="compass-orbit" />
            </div>
          </div>
          <h2>今日座位罗盘</h2>
          <p>把今天的状态、环境和节奏收进一张卡里，先坐稳，再进入状态。</p>
        </div>

        <div className="result-focus-grid">
          <div className="focus-block">
            <strong>推荐座位</strong>
            <div className="focus-value">{result.recommendedSeat}</div>
            <div className="focus-copy">优先从更稳、更不容易被打断的位置坐起。</div>
          </div>
          <div className="focus-block">
            <strong>不建议座位</strong>
            <div className="focus-value text-[22px] leading-[1.25]">{result.discouragedSeat}</div>
            <div className="focus-copy">先避开容易让节奏变乱的方向和强干扰位。</div>
          </div>
        </div>

        <div className="result-badge-row">
          <div className="result-badge">
            综合评分 <b>{totalScore}</b>
          </div>
          <div className="result-badge">
            今日状态 <b>{result.input.mood}</b>
          </div>
          <div className="result-badge">
            幸运色 <b>{result.luckyColor}</b>
          </div>
          <div className="result-badge">
            今日目的 <b>{result.input.goal}</b>
          </div>
          <div className="result-badge">
            时间 <b>{formatDate(result.createdAt)}</b>
          </div>
        </div>

        <div className="result-section">
          <strong>今日状态</strong>
          <p>{result.todayState}</p>
        </div>

        <div className="result-section">
          <strong>传统讲究</strong>
          <p>{traditionalNote}</p>
        </div>

        <div className="result-section">
          <strong>现场观察</strong>
          <p>{sceneReading}</p>
        </div>

        <div className="result-section">
          <strong>推荐理由</strong>
          <p>{result.reason}</p>
        </div>

        <div className="result-section">
          <strong>今日宜避</strong>
          <p>{todayAvoid}</p>
        </div>

        <div className="result-section">
          <strong>入场建议</strong>
          <p>{result.openingAdvice}</p>
        </div>

        {scoreItems.length > 0 ? (
          <div className="result-section">
            <strong>评分依据</strong>
            <div className="mt-2 space-y-3">
              {scoreItems.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-[var(--text)]">{item.label}</div>
                    <div className="text-[12px] leading-6 text-[var(--muted)]">{item.note}</div>
                  </div>
                  <div className="rounded-full border border-[rgba(129,101,58,0.14)] bg-[rgba(255,255,255,0.76)] px-3 py-1 text-[13px] font-semibold text-[var(--green)]">
                    {item.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="result-section">
          <strong>民俗提醒</strong>
          <p>{folkReminder}</p>
        </div>

        <div className="result-section">
          <strong>收手提醒</strong>
          <p>{result.stopLossReminder}</p>
        </div>

        <div className="result-section">
          <strong>一句提醒</strong>
          <p>{result.openingReminder}</p>
        </div>

        <div className="result-section">
          <strong>测试档案</strong>
          <p>
            生肖 {result.input.zodiac} · {result.input.birthMonth} 月 · 节奏边界{" "}
            {result.input.budgetOption === "自定义" ? result.input.customBudget || "自定义" : result.input.budgetOption}
          </p>
          <p>
            门口 {result.input.doorPosition} · 窗户 {result.input.windowPosition} · 灯光 {result.input.light} · 环境{" "}
            {result.input.noise}
          </p>
        </div>

        <p className="tiny-disclaimer">
          仅供娱乐和状态提醒，不构成任何结果承诺
        </p>
      </div>
    </div>
  );
}
