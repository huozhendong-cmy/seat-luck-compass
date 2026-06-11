"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppScaffold } from "@/components/AppScaffold";
import { SeatMapSvg } from "@/components/SeatMapSvg";
import { PaperIcon } from "@/components/PaperIcon";
import { PaperCompass } from "@/components/PaperCompass";
import { WeChatCreditModal, isCreditsDepletedMessage } from "@/components/WeChatCreditModal";
import { trackEvent } from "@/lib/analytics";
import { generateResult } from "@/lib/logic";
import type {
  EnvironmentDraft,
  KiePosterResult,
  ProfileDraft,
  SeatLayoutMarkup,
  SeatZoneMarkup,
  UserOverviewResponse,
} from "@/lib/types";

type SeatPosterStudioProps = {
  embedded?: boolean;
  environment?: EnvironmentDraft | null;
};

const maxUploadBytes = 8 * 1024 * 1024;
const supportedFileTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

function verdictLabel(verdict: SeatZoneMarkup["verdict"]) {
  if (verdict === "recommended") return "推荐位";
  if (verdict === "secondary") return "次选位";
  return "避开位";
}

function verdictClass(verdict: SeatZoneMarkup["verdict"]) {
  if (verdict === "recommended") return "text-[#7a5b2d]";
  if (verdict === "secondary") return "text-[#31584a]";
  return "text-[#875947]";
}

function isPosterFinished(result: KiePosterResult) {
  return result.state === "success" || result.state === "fail" || result.imageUrls.length > 0;
}

function posterStateLabel(result: KiePosterResult | null) {
  if (!result) return "generating";
  if (result.imageUrls.length > 0 && result.state !== "fail") return "success";
  return result.state;
}

async function readCreditsBalance() {
  const response = await fetch("/api/user/overview", { cache: "no-store" });
  const data = (await response.json()) as UserOverviewResponse | { error?: string };
  if (!response.ok || !("authenticated" in data)) return null;
  return data.credits?.balance ?? null;
}

export function SeatPosterStudio({ embedded = false, environment = null }: SeatPosterStudioProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const posterFinishRef = useRef<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [markup, setMarkup] = useState<SeatLayoutMarkup | null>(null);
  const [profile, setProfile] = useState<ProfileDraft | null>(null);
  const [draftEnvironment, setDraftEnvironment] = useState<EnvironmentDraft | null>(environment);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [userId, setUserId] = useState("");
  const [posterTaskId, setPosterTaskId] = useState("");
  const [posterResult, setPosterResult] = useState<KiePosterResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [posterLoading, setPosterLoading] = useState(false);
  const [textLoading, setTextLoading] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const fileLabel = useMemo(() => {
    if (!file) return "拖入或上传座位图";
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
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      try {
        const response = await fetch("/api/user/overview", { cache: "no-store" });
        const data = (await response.json()) as UserOverviewResponse | { error?: string };

        if (response.status === 401) {
          throw new Error("游客身份初始化失败，请刷新后重试。");
        }

        if (!response.ok || !("authenticated" in data)) {
          throw new Error("error" in data ? data.error || "读取用户信息失败。" : "读取用户信息失败。");
        }

        if (!active) return;

        setProfile(data.profileDraft);
        setDraftEnvironment(environment ?? data.environmentDraft ?? null);
        setCreditsBalance(data.credits?.balance ?? 0);
        setUserId(data.user?.id ?? "");
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "读取用户信息失败。");
        }
      }
    }

    void loadOverview();
    return () => {
      active = false;
    };
  }, [router]);

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
        const response = await fetch(`/api/kie-poster/status?taskId=${encodeURIComponent(posterTaskId)}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as KiePosterResult | { error: string };

        if (!response.ok || "error" in data) {
          throw new Error("error" in data ? data.error : "查询海报任务失败。");
        }

        if (!active) return;

        setPosterResult(data);

        if (data.imageUrls.length > 0 || data.state === "fail") {
          const nextBalance = await readCreditsBalance().catch(() => null);
          if (active && nextBalance !== null) setCreditsBalance(nextBalance);
        }

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
        if (!active) return;
        setError(posterError instanceof Error ? posterError.message : "查询海报任务失败。");
        setPosterLoading(false);
      }
    }

    void pollPoster();

    return () => {
      active = false;
    };
  }, [posterTaskId]);

  useEffect(() => {
    if (!posterTaskId || !posterResult) return;

    const finishKey = `${posterTaskId}:${posterResult.state}:${posterResult.imageUrls.join(",")}`;
    if (posterFinishRef.current === finishKey) return;

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
      metadata: { fileSize: file.size, embedded },
    });

    try {
      const nextImageDataUrl = await toDataUrl(file);
      setImageDataUrl(nextImageDataUrl);
      const response = await fetch("/api/seat-image-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: nextImageDataUrl }),
      });

      const data = (await response.json()) as { markup: SeatLayoutMarkup } | { error: string };

      if (response.status === 401) {
        throw new Error("游客身份初始化失败，请刷新后重试。");
      }

      if (!response.ok || !("markup" in data)) {
        throw new Error("error" in data ? data.error : "标注失败，请稍后再试。");
      }

      setMarkup(data.markup);
      const nextBalance = await readCreditsBalance().catch(() => null);
      if (nextBalance !== null) setCreditsBalance(nextBalance);
      trackEvent({
        eventName: "image_analysis_success",
        metadata: {
          zoneCount: data.markup.zones.length,
          confidence: data.markup.confidence,
        },
      });
    } catch (requestError) {
      const nextMessage = requestError instanceof Error ? requestError.message : "标注失败，请稍后再试。";
      trackEvent({
        eventName: "image_analysis_fail",
        metadata: {
          message: requestError instanceof Error ? requestError.message : "unknown",
        },
      });
      setError(nextMessage);
      if (isCreditsDepletedMessage(nextMessage)) {
        setShowCreditModal(true);
      }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: nextImageDataUrl,
          markup,
          profile,
          environment,
        }),
      });

      const data = (await response.json()) as { taskId?: string; error?: string };

      if (response.status === 401) {
        throw new Error("游客身份初始化失败，请刷新后重试。");
      }

      if (!response.ok || !data.taskId) {
        throw new Error(data.error || "海报任务创建失败。");
      }

      setPosterTaskId(data.taskId);
    } catch (posterError) {
      const nextMessage = posterError instanceof Error ? posterError.message : "海报任务创建失败。";
      trackEvent({
        eventName: "poster_generate_fail",
        metadata: {
          taskId: posterTaskId || null,
          failMsg: posterError instanceof Error ? posterError.message : "create_failed",
        },
      });
      setError(nextMessage);
      if (isCreditsDepletedMessage(nextMessage)) {
        setShowCreditModal(true);
      }
      setPosterLoading(false);
    }
  }

  async function handleSkipToTextResult() {
    if (!profile || !draftEnvironment) {
      setError("请先完成前面的状态与环境信息。");
      return;
    }

    setTextLoading(true);
    setError("");

    try {
      const result = generateResult({ ...profile, ...draftEnvironment });
      const response = await fetch("/api/seat-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result,
          profileDraft: profile,
          environmentDraft: draftEnvironment,
        }),
      });
      const data = (await response.json()) as { error?: string; record?: { id: string } };

      if (!response.ok || !data.record?.id) {
        throw new Error(data.error || "生成文字建议失败。");
      }

      router.push(`/result?id=${data.record.id}`);
    } catch (requestError) {
      const nextMessage = requestError instanceof Error ? requestError.message : "生成文字建议失败。";
      setError(nextMessage);
      if (isCreditsDepletedMessage(nextMessage)) {
        setShowCreditModal(true);
      }
    } finally {
      setTextLoading(false);
    }
  }

  const content = (
    <div className="space-y-6">
      <WeChatCreditModal open={showCreditModal} onClose={() => setShowCreditModal(false)} userId={userId} />
      {embedded ? null : (
        <section className="paper-hero">
          <PaperCompass
            size="md"
            className="paper-analyze-hero-compass"
            showPalm={false}
            showDirections={false}
            showBranches={false}
            showCoreDots={false}
          />
          <div className="paper-step-line">
            <span className="paper-step-badge">3</span>
            <span>第 3 步</span>
          </div>
          <h2 className="paper-display-title">上传座位图</h2>
          <p className="paper-description">上传现场座位图，帮助罗盘识别环境结构。</p>
        </section>
      )}

      {error ? (
        <div className="rounded-[18px] bg-[rgba(247,225,217,0.72)] px-4 py-3 text-sm text-[#8f5c4a]">{error}</div>
      ) : null}

      <section className="paper-panel paper-upload-box">
        <div className="paper-upload-dashed">
          <div className="paper-upload-grid">
            <div className="paper-upload-art">
              {previewUrl ? (
                <img src={previewUrl} alt="座位图预览" className="h-[180px] w-full rounded-[16px] object-cover" />
              ) : (
                <SeatMapSvg className="paper-floorplan-svg" />
              )}
            </div>
            <div className="paper-upload-copy">
              <div className="paper-upload-cloud"><PaperIcon name="upload" /></div>
              <div className="paper-panel-title mt-4 text-[28px]">拖入或上传座位图</div>
              <p className="paper-description paper-upload-copy-text !mt-3 !max-w-none">
                上传现场平面图或实拍座位图，帮助罗盘更快识别门窗、桌位和空间结构。
              </p>
              <div className="paper-upload-meta">
                <span className="paper-upload-meta-item">JPG / PNG / WEBP</span>
                <span className="paper-upload-meta-item">建议 8MB 内</span>
              </div>
            </div>
          </div>
        </div>

        <div className="paper-upload-toolbar">
          <button type="button" className="paper-secondary-cta !min-h-[56px] !text-[18px]" onClick={() => fileInputRef.current?.click()}>
            拍照上传
          </button>
          <button type="button" className="paper-secondary-cta !min-h-[56px] !text-[18px]" onClick={() => fileInputRef.current?.click()}>
            相册选择
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          className="paper-file-input"
          onChange={(event) => handleSelectedFile(event.target.files?.[0] ?? null)}
        />

        <button type="button" className="paper-file-trigger paper-upload-filebar" onClick={() => fileInputRef.current?.click()}>
          <span className="paper-upload-filebar-label">当前文件</span>
          <strong>{file ? fileLabel : "未选择任何文件"}</strong>
        </button>

        <section className="paper-panel soft mt-5 px-4 py-5">
          <div className="mb-4 text-center">
            <div className="paper-panel-title text-[24px]">拍摄建议</div>
          </div>
          <div className="paper-upload-tip-list">
            <div className="paper-tip-item paper-upload-tip-item">
              <span className="paper-tip-icon"><PaperIcon name="sun" /></span>
              <div>
                <div className="paper-panel-title text-[18px]">尽量俯拍</div>
                <p className="paper-fine-text">从上往下拍摄，角度越端正越好</p>
              </div>
            </div>
            <div className="paper-tip-item paper-upload-tip-item">
              <span className="paper-tip-icon"><PaperIcon name="window" /></span>
              <div>
                <div className="paper-panel-title text-[18px]">看清门窗</div>
                <p className="paper-fine-text">确保门窗位置清晰可见</p>
              </div>
            </div>
            <div className="paper-tip-item paper-upload-tip-item">
              <span className="paper-tip-icon"><PaperIcon name="people" /></span>
              <div>
                <div className="paper-panel-title text-[18px]">不要遮挡座位</div>
                <p className="paper-fine-text">避免遮挡，确保每个座位都能看见</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 text-center">
          <button type="button" className="paper-small-link" onClick={handleSkipToTextResult} disabled={textLoading}>
            {textLoading ? "生成文字建议中..." : "跳过此步，直接查看文字建议 ›"}
          </button>
        </div>

        <div className="mt-5">
          <button type="button" className="paper-primary-cta disabled:cursor-not-allowed" disabled={!file || posterLoading} onClick={handleGeneratePoster}>
            {posterLoading ? "生成海报中..." : "开始分析 ✦"}
          </button>
        </div>

        <div className="mt-3">
          <button type="button" className="paper-secondary-cta !min-h-[56px] !text-[18px]" disabled={!file || loading} onClick={handleAnalyze}>
            {loading ? "标识中..." : "先做原图标识"}
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-[#7a6d5c]">
          当前剩余额度：<strong className="text-[var(--green)]">{creditsBalance ?? "--"}</strong>
          <span className="mx-2 text-[#c7b8a1]">·</span>
          生成海报消耗 10 点
        </div>
      </section>

      {markup ? (
        <section className="paper-panel px-5 py-5">
          <div className="paper-panel-title text-[28px]">原图标识结果</div>
          <p className="paper-description !mx-0 !mt-2 text-left">{markup.sceneSummary}</p>
          <div className="mt-4 space-y-3">
            {markup.zones.map((zone) => (
              <div key={zone.id} className="paper-row">
                <span className={`paper-pill-button ${verdictClass(zone.verdict)}`}>{verdictLabel(zone.verdict)}</span>
                <div className="min-w-0">
                  <div className="paper-panel-title text-[20px]">{zone.label}</div>
                  <p className="paper-fine-text mt-1">{zone.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {posterTaskId ? (
        <section className="paper-panel px-5 py-5">
          <div className="paper-panel-title text-[28px]">推荐海报生成结果</div>
          <div className="mt-3 space-y-1 text-sm text-[#6f6459]">
            <div>任务 ID：{posterTaskId}</div>
            <div>当前状态：{posterStateLabel(posterResult)}</div>
          </div>

          {posterResult?.imageUrls.length ? (
            <div className="mt-4 space-y-4">
              {posterResult.imageUrls.map((imageUrl) => (
                <a key={imageUrl} href={imageUrl} target="_blank" rel="noreferrer">
                  <img src={imageUrl} alt="生成海报" className="w-full rounded-[22px] border border-[rgba(177,145,93,0.16)]" />
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-4 paper-panel soft px-4 py-4 text-sm leading-8 text-[#6f6459]">
              正在根据原图和前面填写的信息生成成品海报图，页面会自动刷新任务状态。
            </div>
          )}
        </section>
      ) : null}
    </div>
  );

  if (embedded) return content;

  return (
    <AppScaffold
      title="今日座位罗盘"
      activeNav="compass"
      leftSlot={
        <Link href="/environment" className="paper-icon-button" aria-label="返回环境页">
          ‹
        </Link>
      }
    >
      {content}
    </AppScaffold>
  );
}
