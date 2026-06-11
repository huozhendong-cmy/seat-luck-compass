import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import {
  IMAGE_ANALYSIS_COST,
  consumeCredits,
  createImageTask,
  markImageTaskRefunded,
  refundCredits,
  updateImageTaskById,
} from "@/lib/server/user-store";
import type { SeatLayoutMarkup } from "@/lib/types";

export const runtime = "nodejs";

const supportedImagePattern = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i;
const kieBaseUrl = process.env.KIE_API_BASE_URL ?? "https://api.kie.ai";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    sceneSummary: { type: "string" },
    recommendationSummary: { type: "string" },
    confidence: {
      type: "string",
      enum: ["高", "中", "低"],
    },
    quickTips: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    zones: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          verdict: {
            type: "string",
            enum: ["recommended", "secondary", "avoid"],
          },
          reason: { type: "string" },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
        },
        required: ["id", "label", "verdict", "reason", "x", "y", "width", "height"],
      },
    },
  },
  required: ["sceneSummary", "recommendationSummary", "confidence", "quickTips", "zones"],
} as const;

type RequestBody = {
  imageDataUrl?: string;
};

type KieResponsesOutput = {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

function estimateBytesFromDataUrl(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function clampZoneValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeMarkup(markup: SeatLayoutMarkup): SeatLayoutMarkup {
  return {
    ...markup,
    zones: markup.zones.map((zone, index) => ({
      ...zone,
      id: zone.id || `zone-${index + 1}`,
      x: clampZoneValue(zone.x, 0, 100),
      y: clampZoneValue(zone.y, 0, 100),
      width: clampZoneValue(zone.width, 6, 100),
      height: clampZoneValue(zone.height, 6, 100),
    })),
  };
}

function buildPrompt() {
  return [
    "请分析这张真实座位照片，并输出一份用于前端原图标注的 JSON。",
    "目标是判断图中哪些位置更适合落座，哪些位置次选，哪些位置建议避开。",
    "判断依据只允许使用：靠墙感、门口/通道干扰、窗边强光、视线开阔度、环境安静感、是否背后空、是否正对入口、是否更稳定。",
    "输出时必须假设前端会直接在原图上画框，所以 zones 里的 x、y、width、height 都必须是 0 到 100 的百分比坐标，含义分别是左上角横向百分比、左上角纵向百分比、宽度百分比、高度百分比。",
    "如果画面里看不到明确座位，可以标注区域特征，例如“靠左下角靠墙区域”“右侧靠近入口的位置”。",
    "label 要短，像“推荐位 A”“次选位 B”“避开位 C”。",
    "verdict 只能是 recommended、secondary、avoid。",
    "reason 要简短具体，直接说为什么这个区域更稳或更容易被干扰。",
    "整个输出要偏娱乐化和空间舒适度提醒，不要提赌博、赢钱、翻本、牌运、财运、风水大师、必胜之类的话。",
    "如果图中信息不足，也要诚实降低 confidence，并给出保守判断。",
  ].join("\n");
}

function extractOutputText(payload: KieResponsesOutput) {
  for (const item of payload.output ?? []) {
    if (item.type !== "message") {
      continue;
    }

    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return "";
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

  const imageDataUrl = body.imageDataUrl;

  if (!imageDataUrl || !supportedImagePattern.test(imageDataUrl)) {
    return NextResponse.json(
      { error: "请上传 PNG、JPG、WEBP 或 GIF 格式的图片。" },
      { status: 400 },
    );
  }

  if (estimateBytesFromDataUrl(imageDataUrl) > 8 * 1024 * 1024) {
    return NextResponse.json(
      { error: "图片过大，请尽量控制在 8MB 以内。" },
      { status: 400 },
    );
  }

  let authUserId = "";
  let localTaskId = "";
  let creditsConsumed = false;

  try {
    const auth = await requireAuth();
    authUserId = auth.user.id;

    const task = await createImageTask({
      userId: auth.user.id,
      taskType: "analysis",
      status: "pending",
      creditsCost: IMAGE_ANALYSIS_COST,
      inputPayload: {
        kind: "seat_image_analysis",
      },
    });
    localTaskId = task.id;

    await consumeCredits(auth.user.id, IMAGE_ANALYSIS_COST, "image_analysis", localTaskId);
    creditsConsumed = true;
    await updateImageTaskById(localTaskId, {
      status: "processing",
    });

    const response = await fetchWithTimeout(`${kieBaseUrl}/codex/v1/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        model: "gpt-5-4",
        stream: false,
        reasoning: {
          effort: "medium",
        },
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildPrompt(),
              },
              {
                type: "input_image",
                image_url: imageDataUrl,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "seat_layout_markup",
            strict: true,
            description: "座位图区域标注结果",
            schema,
          },
        },
      }),
    }, 20000);

    const payload = (await response.json()) as KieResponsesOutput & {
      error?: { message?: string };
      message?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error?.message || payload.message || "Kie 座位图分析失败。");
    }

    const outputText = extractOutputText(payload);

    if (!outputText) {
      throw new Error("模型没有返回可解析的标注结果。");
    }

    const markup = normalizeMarkup(JSON.parse(outputText) as SeatLayoutMarkup);

    await updateImageTaskById(localTaskId, {
      status: "success",
      outputPayload: markup,
    });

    return NextResponse.json({ markup });
  } catch (error) {
    if (localTaskId) {
      await updateImageTaskById(localTaskId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "座位图分析失败。",
      }).catch(() => null);
    }

    if (creditsConsumed && authUserId && localTaskId) {
      await refundCredits(authUserId, IMAGE_ANALYSIS_COST, "image_analysis_refund", localTaskId).catch(() => null);
      await markImageTaskRefunded(localTaskId).catch(() => null);
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录后再继续。" }, { status: 401 });
    }

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          error:
            "座位标识请求超时了。当前 Kie 多模态分析返回较慢，建议先直接生成海报，或稍后重试。",
        },
        { status: 504 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Kie 座位图分析失败。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
