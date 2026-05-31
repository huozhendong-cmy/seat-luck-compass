import { NextResponse } from "next/server";
import { upsertPosterJobRecord } from "@/lib/supabase-records";
import type {
  EnvironmentDraft,
  ProfileDraft,
  SeatLayoutMarkup,
} from "@/lib/types";

export const runtime = "nodejs";

const uploadBaseUrl = "https://kieai.redpandaai.co";
const kieBaseUrl = process.env.KIE_API_BASE_URL ?? "https://api.kie.ai";
const supportedImagePattern = /^data:image\/(png|jpeg|jpg|webp);base64,/i;

type RequestBody = {
  imageDataUrl?: string;
  markup?: SeatLayoutMarkup | null;
  profile?: ProfileDraft | null;
  environment?: EnvironmentDraft | null;
};

type UploadResponse = {
  success?: boolean;
  code?: number;
  msg?: string;
  data?: {
    fileName?: string;
    downloadUrl?: string;
    fileUrl?: string;
  };
};

type CreateTaskResponse = {
  code?: number;
  msg?: string;
  data?: {
    taskId?: string;
  };
};

function estimateBytesFromDataUrl(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function pickBestZone(markup: SeatLayoutMarkup) {
  return (
    markup.zones.find((zone) => zone.verdict === "recommended") ??
    markup.zones.find((zone) => zone.verdict === "secondary") ??
    markup.zones[0]
  );
}

function sanitizeBannerText(input: string) {
  return input.replace(/[，。；：,.!?！？]/g, " ").trim();
}

function buildPosterPrompt(
  markup?: SeatLayoutMarkup | null,
  profile?: ProfileDraft | null,
  environment?: EnvironmentDraft | null,
) {
  const bestZone = markup ? pickBestZone(markup) : null;
  const title = bestZone
    ? profile?.zodiac
      ? `属${profile.zodiac}首选：${sanitizeBannerText(bestZone.label)}`
      : `今日首选：${sanitizeBannerText(bestZone.label)}`
    : profile?.zodiac
      ? `属${profile.zodiac}今日推荐座位`
      : "今日推荐座位";

  const tipList = markup?.quickTips.slice(0, 3) ?? [];
  const moodLine = profile?.mood ? `今日状态参考：${profile.mood}` : "";
  const goalLine = profile?.goal ? `今日目的参考：${profile.goal}` : "";
  const environmentLine = environment
    ? `现场信息参考：门口${environment.doorPosition}，窗位${environment.windowPosition}，灯光${environment.light}，环境${environment.noise}。`
    : "";

  return [
    "Use the uploaded seat photo as the base composition and preserve the real furniture layout, camera angle, and room structure.",
    "Transform it into a polished Chinese recommendation poster overlay, not a totally different room.",
    "Add elegant dark green and gold overlay graphics, soft glow, premium Chinese poster styling, and clear visual hierarchy.",
    "Analyze the seating arrangement in the uploaded photo and infer one best seat based on wall support, distance from doorway traffic, avoiding harsh direct light, comfortable viewing angle, and overall stable feeling.",
    environmentLine,
    "Visually highlight the single best recommended seat with a glowing circle and a directional arrow.",
    "Add a headline banner in Chinese near the top: 今日推荐座位.",
    `Add a large central Chinese banner text: ${title}.`,
    "Add three smaller Chinese reason badges on the right side with premium rounded panels.",
    `Reason 1 text in Chinese: ${tipList[0] ?? (bestZone ? bestZone.reason : "有靠位感，坐姿更稳。")}.`,
    `Reason 2 text in Chinese: ${tipList[1] ?? (markup?.recommendationSummary || "视野更顺，方便观察整体环境。")}.`,
    `Reason 3 text in Chinese: ${tipList[2] ?? (bestZone ? bestZone.reason : "尽量避开门口强光和人流干扰。")}.`,
    moodLine ? `Add a subtle small tag in Chinese: ${moodLine}.` : "",
    goalLine ? `Add a subtle small tag in Chinese: ${goalLine}.` : "",
    "Keep the output readable for mobile sharing, with realistic integration between the overlays and the original seat photo.",
    "Do not mention gambling, winning, betting, fortune, or money. Frame everything as seat comfort, stability, view, and reduced distraction.",
    "Chinese text must be large, legible, and visually similar to a polished recommendation card.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  if (!process.env.KIE_API_KEY) {
    return NextResponse.json(
      { error: "缺少 KIE_API_KEY，请先在环境变量中配置。" },
      { status: 500 },
    );
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  const { imageDataUrl, markup, profile, environment } = body;

  if (!imageDataUrl || !supportedImagePattern.test(imageDataUrl)) {
    return NextResponse.json(
      { error: "请上传 PNG、JPG 或 WEBP 图片。" },
      { status: 400 },
    );
  }

  if (estimateBytesFromDataUrl(imageDataUrl) > 8 * 1024 * 1024) {
    return NextResponse.json(
      { error: "图片过大，请尽量控制在 8MB 以内。" },
      { status: 400 },
    );
  }

  try {
    const uploadResponse = await fetchWithTimeout(`${uploadBaseUrl}/api/file-base64-upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64Data: imageDataUrl,
        uploadPath: "seat-luck-compass",
        fileName: `seat-reference-${Date.now()}.png`,
      }),
      cache: "no-store",
    }, 25000);

    const uploadData = (await uploadResponse.json()) as UploadResponse;
    const imageUrl = uploadData.data?.fileUrl || uploadData.data?.downloadUrl;

    if (!uploadResponse.ok || !uploadData.success || !imageUrl) {
      return NextResponse.json(
        { error: uploadData.msg || "上传参考图片到 Kie 失败。" },
        { status: 500 },
      );
    }

    const createTaskResponse = await fetchWithTimeout(`${kieBaseUrl}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2-image-to-image",
        input: {
          prompt: buildPosterPrompt(markup, profile, environment),
          input_urls: [imageUrl],
          aspect_ratio: "auto",
        },
      }),
      cache: "no-store",
    }, 25000);

    const taskData = (await createTaskResponse.json()) as CreateTaskResponse;
    const taskId = taskData.data?.taskId;

    if (!createTaskResponse.ok || !taskId) {
      return NextResponse.json(
        { error: taskData.msg || "Kie 海报任务创建失败。" },
        { status: 500 },
      );
    }

    try {
      await upsertPosterJobRecord({
        taskId,
        status: "generating",
        profile,
        environment,
        markup,
        resultImageUrls: [],
      });
    } catch (recordError) {
      console.error("poster job sync failed", recordError);
    }

    return NextResponse.json({ taskId });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "图片服务响应较慢，请稍后重试，或先使用文字建议卡。" },
        { status: 504 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Kie 海报任务创建失败。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
