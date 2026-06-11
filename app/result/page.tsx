"use client";

import { toPng } from "html-to-image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppScaffold } from "@/components/AppScaffold";
import { ResultCard } from "@/components/ResultCard";
import { isPreviewMode, previewSeatRecords } from "@/lib/preview-data";
import type { ResultData, SeatRecordSummary } from "@/lib/types";

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [history, setHistory] = useState<SeatRecordSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextRecordId = searchParams.get("id");
    if (!nextRecordId) {
      if (isPreviewMode) {
        setResult(previewSeatRecords[0].result);
        setHistory(previewSeatRecords);
      } else {
        router.replace("/records");
      }
      return;
    }
    const recordId = nextRecordId;

    let active = true;

    async function loadRecord() {
      try {
        const [recordResponse, listResponse] = await Promise.all([
          fetch(`/api/seat-records?id=${encodeURIComponent(recordId)}`, { cache: "no-store" }),
          fetch("/api/seat-records", { cache: "no-store" }),
        ]);

        const recordData = (await recordResponse.json()) as { error?: string; record?: SeatRecordSummary };
        const listData = (await listResponse.json()) as { error?: string; records?: SeatRecordSummary[] };

        if (!recordResponse.ok || !recordData.record) {
          throw new Error(recordData.error || "读取结果失败。");
        }

        if (!active) return;

        setResult(recordData.record.result);
        setHistory(listData.records ?? []);
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "读取结果失败。");
        }
      }
    }

    void loadRecord();
    return () => {
      active = false;
    };
  }, [router, searchParams]);

  async function handleSaveImage() {
    if (!cardRef.current || !result) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `seat-luck-compass-${result.id}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setSaving(false);
    }
  }

  if (!result) return null;

  return (
    <AppScaffold
      title="今日座位建议"
      subtitle="座位仪轨 · 结果建议"
      ornamentedTitle
      activeNav="compass"
      leftSlot={
        <Link href="/environment" className="paper-icon-button" aria-label="返回环境页">
          ‹
        </Link>
      }
    >
      {error ? (
        <div className="rounded-[18px] bg-[rgba(247,225,217,0.72)] px-4 py-3 text-sm text-[#8f5c4a]">{error}</div>
      ) : null}

      <section className="paper-panel paper-result-preface mt-2 px-5 py-4">
        <div>
          <div className="paper-result-preface-label">开盘摘要</div>
          <p className="paper-result-preface-copy">根据个人状态与场域节奏，以下结果更偏向稳局、控节奏与观全场的思路。</p>
        </div>
        <span className="paper-pill-button">宫廷金线方案</span>
      </section>

      <section className="paper-summary-strip paper-summary-strip-3 paper-result-summary-strip mt-4">
        <div className="paper-summary-item">
          <strong>{result.recommendedSeat}</strong>
          <span>当前推荐方位</span>
        </div>
        <div className="paper-summary-item">
          <strong>{result.input.mood}</strong>
          <span>当前状态</span>
        </div>
        <div className="paper-summary-item">
          <strong>{result.input.goal}</strong>
          <span>今日目的</span>
        </div>
      </section>

      <div ref={cardRef}>
        <ResultCard result={result} />
      </div>

      <div className="mt-6">
        <button type="button" className="paper-primary-cta" onClick={handleSaveImage} disabled={saving}>
          {saving ? "生成中..." : "保存本次结果 ✦"}
        </button>
      </div>

      <div className="mt-3">
        <Link href="/form" className="paper-secondary-cta">
          重新测算
        </Link>
      </div>

      <section className="paper-panel mt-6 px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="paper-panel-title text-[28px]">最近记录</div>
          <Link href="/records" className="paper-small-link">
            全部记录 ›
          </Link>
        </div>
        <div className="paper-record-list">
          {history.slice(0, 3).map((item) => (
            <button
              key={item.id}
              type="button"
              className="paper-record-item w-full text-left"
              onClick={() => {
                setResult(item.result);
                router.replace(`/result?id=${item.id}`);
              }}
            >
              <div className="paper-avatar-inner !h-[72px] !w-[72px] !text-[22px]">{item.result.recommendedSeat.slice(0, 2)}</div>
              <div className="min-w-0 flex-1">
                <div className="paper-panel-title text-[24px]">{item.result.recommendedSeat}</div>
                <div className="mt-1 text-[18px] text-[#6f6459]">{item.result.openingReminder}</div>
                <div className="mt-1 text-sm text-[#a29483]">{formatShortDate(item.createdAt)}</div>
              </div>
              <div className="paper-record-badge">{item.result.input.mood}</div>
            </button>
          ))}
        </div>
      </section>
    </AppScaffold>
  );
}
