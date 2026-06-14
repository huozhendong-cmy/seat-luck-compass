import { NextResponse } from "next/server";
import { appendGuestCookie, ensureAuthContext } from "@/lib/server/auth";
import {
  PROMPT_IMAGE_COST,
  consumeCredits,
  createImageTask,
  markImageTaskRefunded,
  refundCredits,
  updateImageTaskById,
} from "@/lib/server/user-store";

export const runtime = "nodejs";

type CreateBody = {
  prompt?: string;
  size?: "1:1" | "3:2" | "2:3" | "3:4" | "4:3" | "9:16" | "16:9";
  isEnhance?: boolean;
};

type KieCreateResponse = {
  code: number;
  msg: string;
  data?: {
    taskId?: string;
  };
};

const baseUrl = process.env.KIE_API_BASE_URL ?? "https://api.kie.ai";

function normalizeImageSize(size?: CreateBody["size"]) {
  switch (size) {
    case "4:3":
    case "16:9":
    case "3:2":
      return "3:2";
    case "3:4":
    case "9:16":
    case "2:3":
      return "2:3";
    case "1:1":
    default:
      return "1:1";
  }
}

export async function POST(request: Request) {
  if (!process.env.KIE_API_KEY) {
    return NextResponse.json(
      { error: "缺少 KIE_API_KEY，请先在环境变量中配置。" },
      { status: 500 },
    );
  }

  let body: CreateBody;

  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  const size = normalizeImageSize(body.size);
  const isEnhance = body.isEnhance ?? false;

  if (!prompt) {
    return NextResponse.json({ error: "请输入图片提示词。" }, { status: 400 });
  }

  let authUserId = "";
  let localTaskId = "";
  let creditsConsumed = false;
  let guestTokenToSet: string | null = null;

  try {
    const ensured = await ensureAuthContext();
    const auth = ensured.auth;
    guestTokenToSet = ensured.guestTokenToSet;
    authUserId = auth.user.id;

    const localTask = await createImageTask({
      userId: auth.user.id,
      taskType: "prompt_image",
      status: "pending",
      creditsCost: PROMPT_IMAGE_COST,
      inputPayload: {
        prompt,
        size,
        isEnhance,
      },
    });
    localTaskId = localTask.id;

    await consumeCredits(auth.user.id, PROMPT_IMAGE_COST, "prompt_image_generation", localTaskId);
    creditsConsumed = true;
    await updateImageTaskById(localTaskId, { status: "processing" });

    const response = await fetch(`${baseUrl}/api/v1/gpt4o-image/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        size,
        nVariants: 1,
        isEnhance,
        uploadCn: false,
        enableFallback: false,
      }),
      cache: "no-store",
    });

    const data = (await response.json()) as KieCreateResponse;
    const taskId = data.data?.taskId;

    if (!response.ok || data.code !== 200 || !taskId) {
      throw new Error(data.msg || "Kie 图片任务创建失败。");
    }

    await updateImageTaskById(localTaskId, {
      status: "processing",
      externalTaskId: taskId,
    });

    const result = NextResponse.json({ taskId });
    return appendGuestCookie(result, guestTokenToSet);
  } catch (error) {
    if (localTaskId) {
      await updateImageTaskById(localTaskId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Kie 图片任务创建失败。",
      }).catch(() => null);
    }

    if (creditsConsumed && authUserId && localTaskId) {
      await refundCredits(authUserId, PROMPT_IMAGE_COST, "prompt_image_generation_refund", localTaskId).catch(() => null);
      await markImageTaskRefunded(localTaskId).catch(() => null);
    }

    const message =
      error instanceof Error ? error.message : "Kie 图片任务创建失败。";

    const response = NextResponse.json({ error: message }, { status: 500 });
    return appendGuestCookie(response, guestTokenToSet);
  }
}
