"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { trackEvent } from "@/lib/analytics";
import { getProfileDraft } from "@/lib/storage";
import type {
  EnvironmentDraft,
  KiePosterResult,
  ProfileDraft,
  SeatLayoutMarkup,
  SeatZoneMarkup,
} from "@/lib/types";

type SeatPosterStudioProps = {
  embedded?: boolean;
  environment?: EnvironmentDraft | null;
};

const maxUploadBytes = 8 * 1024 * 1024;
const supportedFileTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

function verdictLabel(verdict: SeatZoneMarkup["verdict"]) {
  if (verdict === "recommended") {
    return "推荐位";
  }

  if (verdict === "secondary") {
    return "次选位";
  }

  return "避开位";
}

function verdictClass(verdict: SeatZoneMarkup["verdict"]) {
  if (verdict === "recommended") {
    return "border-[rgba(122,101,52,0.22)] bg-[rgba(228,210,175,0.36)] text-[#2f4f44]";
  }

  if (verdict === "secondary") {
    return "border-[rgba(103,142,136,0.24)] bg-[rgba(214,229,226,0.62)] text-[#31584a]";
  }

  return "border-[rgba(179,120,97,0.24)] bg-[rgba(246,224,216,0.82)] text-[#875947]";
}

function isPosterFinished(result: KiePosterResult) {
  return (
    result.state === "success" ||
    result.state === "fail" ||
    result.imageUrls.length > 0
  );
}

function posterStateLabel(result: KiePosterResult | null) {
  if (!result) {
    return "generating";
  }

  if (result.imageUrls.length > 0 && result.state !== "fail") {
    return "success";
  }

  return result.state;
}

export function SeatPosterStudio({
  embedded = false,
  environment = null,
}: SeatPosterStudioProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const posterFinishRef = useRef<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [markup, setMarkup] = useState<SeatLayoutMarkup | null>(null);
  const [profile, setProfile] = useState<ProfileDraft | null>(null);
  const [posterTaskId, setPosterTaskId] = useState("");
  const [posterResult, setPosterResult] = useState<KiePosterResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [posterLoading, setPosterLoading] = useState(false);

  const fileLabel = useMemo(() => {
    if (!file) {
      return "上传一张真实座位图，系统会直接生成推荐海报";
    }

    return `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }, [file]);

  function handleSelectedFile(nextFile: File | null) {
    setMarkup(null);
    setPosterResult(null);
    setPosterTaskId("");
    setError("");
    setImageDataUrl("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!nextFile) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    if (!supportedFileTypes.includes(nextFile.type)) {
      setFile(null);
      setPreviewUrl("");
      setError("请上传 PNG、JPG、WEBP 或 GIF 图片。");
      return;
    }

    if (nextFile.size > maxUploadBytes) {
      setFile(null);
      setPreviewUrl("");
      setError("图片请尽量控制在 8MB 以内，方便移动端更稳定地生成。");
      return;
    }

    setFile(nextFile);

    if (nextFile) {
      setPreviewUrl(URL.createObjectURL(nextFile));
    } else {
      setPreviewUrl("");
    }
  }

  useEffect(() => {
    setProfile(getProfileDraft());
  }, []);

  useEffect(() => {
    if (!posterTaskId) {
      posterFinishRef.current = "";
      return;
    }

    let active = true;
    let attempts = 0;

    async function pollPoster() {
      try {
        attempts += 1;
        const response = await fetch(
          `/api/kie-poster/status?taskId=${encodeURIComponent(posterTaskId)}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as KiePosterResult | { error: string };

        if (!response.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "查询海报任务失败。");
        }

        if (!active) {
          return;
        }

        setPosterResult(data);

        if (isPosterFinished(data)) {
          setPosterLoading(false);
          return;
        }

        if (attempts >= 48) {
          setError("海报生成比平时更慢一些，你可以稍后回来查看，或先使用文字建议卡。");
          setPosterLoading(false);
          return;
        }

        window.setTimeout(pollPoster, 2500);
      } catch (posterError) {
        if (!active) {
          return;
        }

        setError(
          posterError instanceof Error ? posterError.message : "查询海报任务失败。",
        );
        setPosterLoading(false);
      }
    }

    pollPoster();

    return () => {
      active = false;
    };
  }, [posterTaskId]);

  useEffect(() => {
    if (!posterTaskId || !posterResult) {
      return;
    }

    const finishKey = `${posterTaskId}:${posterResult.state}:${posterResult.imageUrls.join(",")}`;

    if (posterFinishRef.current === finishKey) {
      return;
    }

    if (posterResult.imageUrls.length > 0 && posterResult.state !== "fail") {
      posterFinishRef.current = finishKey;
      trackEvent({
        eventName: "poster_generate_success",
        metadata: {
          taskId: posterTaskId,
          imageCount: posterResult.imageUrls.length,
          progress: posterResult.progress ?? null,
        },
      });
      return;
    }

    if (posterResult.state === "fail") {
      posterFinishRef.current = finishKey;
      trackEvent({
        eventName: "poster_generate_fail",
        metadata: {
          taskId: posterTaskId,
          failMsg: posterResult.failMsg ?? "unknown",
        },
      });
    }
  }, [posterResult, posterTaskId]);

  async function handleAnalyze() {
    if (!file) {
      setError("请先上传一张座位图片。");
      return;
    }

    setLoading(true);
    setError("");
    setMarkup(null);
    trackEvent({
      eventName: "image_analysis_start",
      metadata: {
        fileSize: file.size,
        embedded,
      },
    });

    try {
      const nextImageDataUrl = await toDataUrl(file);
      setImageDataUrl(nextImageDataUrl);
      const response = await fetch("/api/seat-image-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageDataUrl: nextImageDataUrl }),
      });

      const data = (await response.json()) as
        | { markup: SeatLayoutMarkup }
        | { error: string };

      if (!response.ok || !("markup" in data)) {
        throw new Error("error" in data ? data.error : "标注失败，请稍后再试。");
      }

      setMarkup(data.markup);
      trackEvent({
        eventName: "image_analysis_success",
        metadata: {
          zoneCount: data.markup.zones.length,
          confidence: data.markup.confidence,
        },
      });
    } catch (requestError) {
      trackEvent({
        eventName: "image_analysis_fail",
        metadata: {
          message: requestError instanceof Error ? requestError.message : "unknown",
        },
      });
      setError(
        requestError instanceof Error ? requestError.message : "标注失败，请稍后再试。",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePoster() {
    if (!file) {
      setError("请先上传一张座位图片。");
      return;
    }

    setPosterLoading(true);
    setPosterResult(null);
    setError("");
    posterFinishRef.current = "";
    trackEvent({
      eventName: "poster_generate_start",
      metadata: {
        embedded,
        hasMarkup: Boolean(markup),
        mood: profile?.mood ?? null,
        goal: profile?.goal ?? null,
      },
    });

    try {
      const nextImageDataUrl = imageDataUrl || (await toDataUrl(file));
      setImageDataUrl(nextImageDataUrl);

      const response = await fetch("/api/kie-poster/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageDataUrl: nextImageDataUrl,
          markup,
          profile,
          environment,
        }),
      });

      const data = (await response.json()) as { taskId?: string; error?: string };

      if (!response.ok || !data.taskId) {
        throw new Error(data.error || "海报任务创建失败。");
      }

      setPosterTaskId(data.taskId);
    } catch (posterError) {
      trackEvent({
        eventName: "poster_generate_fail",
        metadata: {
          taskId: posterTaskId || null,
          failMsg: posterError instanceof Error ? posterError.message : "create_failed",
        },
      });
      setError(
        posterError instanceof Error ? posterError.message : "海报任务创建失败。",
      );
      setPosterLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <>
          <div className="topbar fade-up">
            <div className="brand-mark">
              <div className="brand-seal" />
              <div className="brand-meta">
                <strong>Seat Markup</strong>
                <span>上传原图 · 自动标识落座区域</span>
              </div>
            </div>
          </div>

          <SectionHeading
            eyebrow="Seat Image"
            title="上传座位图标识"
            description="上传真实的座位照片后，可以直接生成像示例那样的推荐海报；如果你还想先看区域判断，也可以单独做原图标识。"
          />
        </>
      ) : (
        <section className="space-y-3">
          <div className="eyebrow">Seat Poster</div>
          <h2 className="display-font text-[34px] leading-none tracking-[0.03em] text-[var(--text)]">
            上传环境图做海报
          </h2>
          <p className="max-w-[32ch] text-[15px] leading-7 text-[var(--muted)]">
            在这一步直接把环境照片传上来，系统会结合你前面填过的状态信息，生成推荐座位海报。
          </p>
        </section>
      )}

      <section className="glass-panel rounded-[32px] px-4 py-5">
        <div className="info-strip">
          <div className="info-chip">
            <strong>输出形式</strong>
            <span>可以直接生成成品推荐海报，也可以先看带框和标签的原图标注结果。</span>
          </div>
          <div className="info-chip">
            <strong>判断依据</strong>
            <span>只看靠墙感、入口/通道干扰、采光、视线和稳定感，不讲结果承诺。</span>
          </div>
          {profile ? (
            <div className="info-chip">
              <strong>当前保留资料</strong>
              <span>
                生肖 {profile.zodiac} · {profile.birthMonth} 月 · 状态 {profile.mood} · 目的 {profile.goal}
              </span>
            </div>
          ) : (
            <div className="info-chip">
              <strong>当前保留资料</strong>
              <span>还没有前置资料，建议先去填写基础信息，这样后面的推荐海报会把生肖和状态一起带上。</span>
            </div>
          )}
          {environment ? (
            <div className="info-chip">
              <strong>当前环境判断</strong>
              <span>
                门口 {environment.doorPosition} · 窗位 {environment.windowPosition} · 灯光 {environment.light} ·
                环境 {environment.noise}
              </span>
            </div>
          ) : null}
          <div className="info-chip">
            <strong>上传与隐私</strong>
            <span>
              图片仅用于本次空间分析与海报生成，请尽量不要上传包含人脸、联系方式或其他隐私信息的照片。
              <Link
                href="/privacy"
                className="ml-2 underline decoration-[rgba(129,101,58,0.22)] underline-offset-4"
              >
                查看完整说明
              </Link>
            </span>
          </div>
        </div>

        <div className="field-shell">
          <div className="field-label">上传原始座位图</div>
          <div className="field-caption">建议拍到桌子、椅子、门口、窗边和主要通道，画面越完整，海报判断越稳。</div>
          <div
            className="flex min-h-[180px] cursor-pointer items-center justify-center rounded-[22px] border border-[rgba(129,101,58,0.1)] bg-[rgba(255,255,255,0.68)] px-4 py-5 text-center transition hover:border-[rgba(129,101,58,0.24)]"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => handleSelectedFile(event.target.files?.[0] ?? null)}
            />
            {previewUrl ? (
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="座位原图预览"
                  className="mx-auto max-h-[320px] rounded-[18px] border border-[rgba(129,101,58,0.1)] object-contain"
                />
                <p className="text-sm leading-7 text-[var(--muted)]">{fileLabel}</p>
              </div>
            ) : (
              <div>
                <div className="display-font text-[28px] text-[var(--green)]">上传座位图</div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{fileLabel}</p>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-3">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="block w-full rounded-[16px] border border-[rgba(129,101,58,0.12)] bg-[rgba(255,255,255,0.82)] px-3 py-3 text-sm text-[var(--muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(223,233,227,0.92)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#31584a]"
              onChange={(event) => handleSelectedFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs leading-6 text-[rgba(101,112,105,0.72)]">
              如果上面的上传区域点了没反应，就直接用这个系统文件选择器。建议图片控制在 8MB 内。
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[22px] border border-[rgba(179,120,97,0.2)] bg-[rgba(246,224,216,0.75)] px-4 py-4 text-sm leading-7 text-[#875947]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[22px] border border-[rgba(103,142,136,0.18)] bg-[rgba(214,229,226,0.68)] px-4 py-4 text-sm leading-7 text-[#31584a]">
          正在调用 Kie 做座位区域分析，通常需要 10 到 20 秒。如果超时，页面会直接提示你重试。
        </div>
      ) : null}

      {error ? (
        <section className="result-section">
          <strong>服务繁忙时的替代方式</strong>
          <p>
            如果图片生成暂时较慢，你可以先使用当前流程里的文字建议卡，先看推荐座位、评分依据和状态提醒，再决定要不要继续生成海报。
          </p>
          <div className="mt-4">
            {embedded ? (
              <p className="text-sm leading-7 text-[var(--muted)]">
                当前页面上方已经有“生成结果卡”按钮，可以先用它查看文字版建议。
              </p>
            ) : (
              <Link href="/form" className="button-secondary h-12 text-sm">
                返回基础流程
              </Link>
            )}
          </div>
        </section>
      ) : null}

      <div className="control-bar">
        {!embedded ? (
          <Link href="/" className="button-secondary h-14 text-sm">
            返回首页
          </Link>
        ) : (
          <Link href="/form" className="button-secondary h-14 text-sm">
            修改前置信息
          </Link>
        )}
        <button
          type="button"
          className="button-primary h-14 text-sm disabled:cursor-not-allowed disabled:opacity-45"
          disabled={posterLoading}
          onClick={handleGeneratePoster}
        >
          {posterLoading ? "生成海报中..." : "直接生成推荐海报"}
        </button>
      </div>

      <button
        type="button"
        className="button-secondary h-12 w-full text-sm disabled:cursor-not-allowed disabled:opacity-45"
        disabled={loading}
        onClick={handleAnalyze}
      >
        {loading ? "标识中..." : "先做原图标识"}
      </button>

      <div className="flex items-center justify-center gap-4 text-center text-[12px] text-[rgba(101,112,105,0.78)]">
        <Link href="/notice" className="underline decoration-[rgba(129,101,58,0.22)] underline-offset-4">
          如何拍得更容易识别
        </Link>
        <Link href="/privacy" className="underline decoration-[rgba(129,101,58,0.22)] underline-offset-4">
          图片与隐私说明
        </Link>
      </div>

      {markup && previewUrl ? (
        <section className="glass-panel rounded-[32px] px-4 py-5">
          <div className="mb-5">
            <div className="eyebrow">Markup Result</div>
            <h2 className="display-font mt-3 text-[30px] text-[var(--text)]">原图标注结果</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{markup.sceneSummary}</p>
          </div>

          <div className="result-badge-row">
            <div className="result-badge">
              可读度 <b>{markup.confidence}</b>
            </div>
            <div className="result-badge">
              结论 <b>{markup.recommendationSummary}</b>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[26px] border border-[rgba(129,101,58,0.1)] bg-[rgba(255,255,255,0.62)] p-3">
            <div className="relative overflow-hidden rounded-[18px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="标注中的座位图" className="block w-full object-contain" />

              {markup.zones.map((zone, index) => (
                <div
                  key={zone.id}
                  className={`absolute rounded-[16px] border-2 ${verdictClass(zone.verdict)}`}
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${zone.width}%`,
                    height: `${zone.height}%`,
                  }}
                >
                  <div className="absolute left-1.5 top-1.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-[rgba(255,255,255,0.42)] bg-[rgba(255,251,245,0.9)] px-2 text-xs font-semibold text-[var(--green)]">
                    {index + 1}
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 rounded-[12px] bg-[rgba(255,251,245,0.9)] px-2 py-1 text-[11px] leading-5 text-[var(--text)]">
                    {zone.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {markup.zones.map((zone, index) => (
              <div key={zone.id} className="result-section">
                <strong>
                  {index + 1}. {verdictLabel(zone.verdict)} · {zone.label}
                </strong>
                <p>{zone.reason}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 result-section">
            <strong>快速提醒</strong>
            <div className="space-y-2 text-[14px] leading-8 text-[var(--text)]">
              {markup.quickTips.map((tip) => (
                <p key={tip}>{tip}</p>
              ))}
            </div>
          </div>

          <div className="mt-5 control-bar">
            <Link href="/form" className="button-secondary h-14 text-sm">
              修改前置信息
            </Link>
            <button
              type="button"
              className="button-primary h-14 text-sm disabled:cursor-not-allowed disabled:opacity-45"
              disabled={posterLoading}
              onClick={handleGeneratePoster}
            >
              {posterLoading ? "生成海报中..." : "按这份判断生成海报"}
            </button>
          </div>
        </section>
      ) : null}

      {posterTaskId ? (
        <section className="glass-panel rounded-[32px] px-4 py-5">
          <div className="mb-4">
            <div className="eyebrow">Poster Result</div>
            <h2 className="display-font mt-3 text-[30px] text-[var(--text)]">推荐海报生成结果</h2>
          </div>

          <div className="result-badge-row">
            <div className="result-badge">
              任务 ID <b>{posterTaskId}</b>
            </div>
            <div className="result-badge">
              当前状态 <b>{posterStateLabel(posterResult)}</b>
            </div>
            {typeof posterResult?.progress !== "undefined" ? (
              <div className="result-badge">
                进度 <b>{posterResult.progress}</b>
              </div>
            ) : null}
          </div>

          {posterLoading ? (
            <div className="mt-4 result-section">
              <strong>任务处理中</strong>
              <p>正在根据原图和前面填写的信息生成成品海报图。线上通常需要 20 到 90 秒，页面会自动刷新任务状态。</p>
            </div>
          ) : null}

          {posterResult?.state === "fail" ? (
            <div className="mt-4 result-section">
              <strong>生成失败</strong>
              <p>{posterResult.failMsg || "这次海报没有成功生成，可以稍后重试或换一张更清晰的原图。"}</p>
            </div>
          ) : null}

          {posterResult && posterResult.imageUrls.length > 0 && posterResult.state !== "fail" ? (
            <div className="mt-4 space-y-4">
              {posterResult.imageUrls.map((imageUrl, index) => (
                <div
                  key={imageUrl}
                  className="overflow-hidden rounded-[24px] border border-[rgba(129,101,58,0.1)] bg-[rgba(255,255,255,0.68)] p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={`推荐海报 ${index + 1}`} className="w-full rounded-[18px] object-cover" />
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
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
