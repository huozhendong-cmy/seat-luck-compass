"use client";

import { toPng } from "html-to-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { SectionHeading } from "@/components/SectionHeading";
import { getCurrentResult, getHistory } from "@/lib/storage";
import type { ResultData } from "@/lib/types";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [history, setHistory] = useState<ResultData[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = getCurrentResult();
    if (!current) {
      router.replace("/");
      return;
    }

    setResult(current);
    setHistory(getHistory());
  }, [router]);

  async function handleSaveImage() {
    if (!cardRef.current || !result) {
      return;
    }

    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `seat-luck-compass-${result.id}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setSaving(false);
    }
  }

  if (!result) {
    return null;
  }

  return (
    <main className="page-wrap space-y-6">
      <div className="topbar fade-up">
        <div className="brand-mark">
          <div className="brand-seal" />
          <div className="brand-meta">
            <strong>Result Card</strong>
            <span>最终页 · 可保存分享图</span>
          </div>
        </div>
      </div>

      <SectionHeading
        eyebrow="Result"
        title="你的今日建议卡"
        description="这一页会把传统讲究、现场观察和今日状态放在一起解释，重点还是先坐稳、再进入状态。"
      />

      <div ref={cardRef}>
        <ResultCard result={result} />
      </div>

      <div className="control-bar">
        <button
          type="button"
          className="button-primary h-14 text-sm"
          onClick={handleSaveImage}
          disabled={saving}
        >
          {saving ? "生成中..." : "生成分享图"}
        </button>
        <Link href="/form" className="button-secondary h-14 text-sm">
          再测一次
        </Link>
      </div>

      <div className="flex items-center justify-center gap-4 text-center text-[12px] text-[rgba(101,112,105,0.78)]">
        <Link href="/notice" className="underline decoration-[rgba(129,101,58,0.22)] underline-offset-4">
          查看使用说明
        </Link>
        <Link href="/privacy" className="underline decoration-[rgba(129,101,58,0.22)] underline-offset-4">
          查看隐私说明
        </Link>
      </div>

      <section className="glass-panel rounded-[30px] px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="history-heading">
            <strong>Recent Records</strong>
            <h2 className="display-font mt-2 text-[28px] text-[var(--text)]">最近 5 次测试</h2>
          </div>
          <div className="text-xs text-[rgba(101,112,105,0.72)]">保存在本机浏览器</div>
        </div>

        <div className="space-y-3">
          {history.map((item) => (
            <button
              key={item.id}
              type="button"
              className="history-card"
              onClick={() => setResult(item)}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm text-[var(--text)]">
                  {item.input.zodiac} · {item.input.mood} · 推荐 {item.recommendedSeat}
                </div>
                <div className="text-xs text-[rgba(101,112,105,0.68)]">{formatShortDate(item.createdAt)}</div>
              </div>
              <p className="text-sm leading-6 text-[var(--muted)]">{item.openingReminder}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
