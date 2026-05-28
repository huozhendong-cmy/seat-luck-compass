"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/SectionHeading";
import type { KieImageResult } from "@/lib/types";

const sizeOptions = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;

export default function GeneratePage() {
  const [prompt, setPrompt] = useState(
    "一张高级感的中式会客区座位海报，深色背景，金色细节，安静、稳重、舒展的空间氛围",
  );
  const [size, setSize] = useState<(typeof sizeOptions)[number]>("1:1");
  const [isEnhance, setIsEnhance] = useState(false);
  const [taskId, setTaskId] = useState("");
  const [result, setResult] = useState<KieImageResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    let active = true;

    async function poll() {
      try {
        const response = await fetch(`/api/kie-image/status?taskId=${encodeURIComponent(taskId)}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as KieImageResult | { error: string };

        if (!response.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "查询任务状态失败。");
        }

        if (!active) {
          return;
        }

        setResult(data);

        if (data.status === "SUCCESS" || data.status === "GENERATE_FAILED" || data.status === "CREATE_TASK_FAILED" || data.status === "FAILED") {
          setLoading(false);
          return;
        }

        window.setTimeout(poll, 2500);
      } catch (pollError) {
        if (!active) {
          return;
        }

        setError(
          pollError instanceof Error ? pollError.message : "查询任务状态失败。",
        );
        setLoading(false);
      }
    }

    poll();

    return () => {
      active = false;
    };
  }, [taskId]);

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("请先输入图片提示词。");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/kie-image/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          size,
          isEnhance,
        }),
      });

      const data = (await response.json()) as { taskId?: string; error?: string };

      if (!response.ok || !data.taskId) {
        throw new Error(data.error || "创建图片任务失败。");
      }

      setTaskId(data.taskId);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "创建图片任务失败。",
      );
      setLoading(false);
    }
  }

  const failed =
    result?.status === "GENERATE_FAILED" ||
    result?.status === "CREATE_TASK_FAILED" ||
    result?.status === "FAILED";

  return (
    <main className="page-wrap space-y-6">
      <div className="topbar fade-up">
        <div className="brand-mark">
          <div className="brand-seal" />
          <div className="brand-meta">
            <strong>Kie Image</strong>
            <span>提示词生成图片 · 回传到 H5</span>
          </div>
        </div>
      </div>

      <SectionHeading
        eyebrow="Prompt To Image"
        title="生成空间风格图"
        description="输入你想要的画面提示词，服务端会调用 Kie 图片接口异步生成，并把结果直接回传到当前 H5 页面里。"
      />

      <section className="glass-panel rounded-[32px] px-4 py-5">
        <div className="info-strip">
          <div className="info-chip">
            <strong>适合什么</strong>
            <span>适合生成座位海报、空间氛围图、会客区示意图、风格参考图。当前这版先做提示词生成，后续再接参考图编辑。</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="field-shell">
            <div className="field-label">图片提示词</div>
            <div className="field-caption">建议写清楚空间类型、材质、光线、构图、氛围和纵横比例意图。</div>
            <textarea
              className="min-h-[170px] w-full rounded-[18px] border border-[rgba(215,188,122,0.15)] bg-[rgba(255,255,255,0.035)] px-4 py-4 text-[15px] leading-8 text-[var(--text)] outline-none focus:border-[rgba(215,188,122,0.44)] focus:shadow-[0_0_0_3px_rgba(215,188,122,0.08)]"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="例如：一张高级感的中式包间座位海报，黑金配色，靠墙主位，柔和侧光，俯视轻透视构图，适合手机分享图"
            />
          </div>

          <div className="field-shell">
            <div className="field-label">画幅比例</div>
            <div className="field-caption">竖版更适合 H5 分享图，方图更适合封面和卡片。</div>
            <div className="segment-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              {sizeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`option-chip ${size === option ? "active" : ""}`}
                  onClick={() => setSize(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="field-shell">
            <div className="field-label">增强提示</div>
            <div className="field-caption">打开后会让 Kie 做额外提示词增强，但生成时间可能略长一点。</div>
            <button
              type="button"
              className={`option-chip w-full ${isEnhance ? "active" : ""}`}
              onClick={() => setIsEnhance((prev) => !prev)}
            >
              {isEnhance ? "已开启提示词增强" : "保持原始提示词"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[22px] border border-[rgba(227,161,93,0.26)] bg-[rgba(227,161,93,0.08)] px-4 py-4 text-sm leading-7 text-[#f5d2b0]">
          {error}
        </div>
      ) : null}

      <div className="control-bar">
        <Link href="/" className="button-secondary h-14 text-sm">
          返回首页
        </Link>
        <button
          type="button"
          className="button-primary h-14 text-sm disabled:cursor-not-allowed disabled:opacity-45"
          disabled={loading}
          onClick={handleGenerate}
        >
          {loading ? "生成中..." : "开始生成"}
        </button>
      </div>

      {taskId ? (
        <section className="glass-panel rounded-[32px] px-4 py-5">
          <div className="result-badge-row">
            <div className="result-badge">
              Task ID <b>{taskId}</b>
            </div>
            <div className="result-badge">
              当前状态 <b>{result?.status ?? "GENERATING"}</b>
            </div>
            {result?.progress ? (
              <div className="result-badge">
                进度 <b>{result.progress}</b>
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-4 result-section">
              <strong>任务处理中</strong>
              <p>图片任务已创建，页面会自动轮询 Kie 状态并在完成后展示结果。</p>
            </div>
          ) : null}

          {failed ? (
            <div className="mt-4 result-section">
              <strong>生成失败</strong>
              <p>{result?.errorMessage || "任务没有成功完成，可以稍后重试或换一版提示词。"}</p>
            </div>
          ) : null}

          {result?.status === "SUCCESS" && result.imageUrls.length > 0 ? (
            <div className="mt-4 space-y-4">
              <div className="result-section">
                <strong>生成完成</strong>
                <p>{result.prompt || prompt}</p>
              </div>
              <div className="grid gap-4">
                {result.imageUrls.map((imageUrl, index) => (
                  <div key={imageUrl} className="overflow-hidden rounded-[24px] border border-[rgba(215,188,122,0.12)] bg-[rgba(255,255,255,0.03)] p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`Kie 生成图片 ${index + 1}`}
                      className="w-full rounded-[18px] object-cover"
                    />
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="button-secondary mt-3 h-12 w-full text-sm"
                    >
                      打开原图
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
