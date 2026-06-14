import { NextResponse } from "next/server";
import { appendGuestCookie, ensureAuthContext } from "@/lib/server/auth";
import {
  getImageTaskByExternalTaskId,
  markImageTaskRefunded,
  refundCredits,
  updateImageTaskByExternalTaskId,
} from "@/lib/server/user-store";
import type { KieImageResult, KieImageTaskStatus } from "@/lib/types";

export const runtime = "nodejs";

type KieStatusResponse = {
  code: number;
  msg: string;
  data?: {
    taskId?: string;
    paramJson?: string;
    response?: {
      resultUrls?: string[];
      result_urls?: string[];
    };
    status?: KieImageTaskStatus;
    successFlag?: number;
    progress?: string;
    errorMessage?: string;
  };
};

const baseUrl = process.env.KIE_API_BASE_URL ?? "https://api.kie.ai";

function mapKieImageStatus(data?: KieStatusResponse["data"]): KieImageTaskStatus {
  if (data?.status) {
    return data.status;
  }

  if (data?.successFlag === 1) {
    return "SUCCESS";
  }

  if (data?.successFlag === 2) {
    return "GENERATE_FAILED";
  }

  return "GENERATING";
}

export async function GET(request: Request) {
  if (!process.env.KIE_API_KEY) {
    return NextResponse.json(
      { error: "缺少 KIE_API_KEY，请先在环境变量中配置。" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId")?.trim();

  if (!taskId) {
    return NextResponse.json({ error: "缺少 taskId。" }, { status: 400 });
  }

  try {
    const { auth, guestTokenToSet } = await ensureAuthContext();
    const existingTask = await getImageTaskByExternalTaskId(auth.user.id, taskId);

    if (!existingTask) {
      const response = NextResponse.json({ error: "任务不存在或无权访问。" }, { status: 404 });
      return appendGuestCookie(response, guestTokenToSet);
    }

    const kieResponse = await fetch(
      `${baseUrl}/api/v1/gpt4o-image/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        },
        cache: "no-store",
      },
    );

    const data = (await kieResponse.json()) as KieStatusResponse;

    if (!kieResponse.ok || data.code !== 200 || !data.data?.taskId) {
      const errorResponse = NextResponse.json(
        { error: data.msg || "Kie 图片状态查询失败。" },
        { status: 500 },
      );
      return appendGuestCookie(errorResponse, guestTokenToSet);
    }

    let prompt = "";

    if (data.data.paramJson) {
      try {
        const parsedParam = JSON.parse(data.data.paramJson) as { prompt?: string };
        prompt = parsedParam.prompt ?? "";
      } catch {
        prompt = "";
      }
    }

    const result: KieImageResult = {
      taskId: data.data.taskId,
      status: mapKieImageStatus(data.data),
      progress: data.data.progress,
      prompt,
      imageUrls: data.data.response?.resultUrls ?? data.data.response?.result_urls ?? [],
      errorMessage: data.data.errorMessage || undefined,
    };

    const failed =
      result.status === "GENERATE_FAILED" ||
      result.status === "CREATE_TASK_FAILED" ||
      result.status === "FAILED";

    await updateImageTaskByExternalTaskId(auth.user.id, taskId, {
      status: result.status === "SUCCESS" ? "success" : failed ? "failed" : "processing",
      outputPayload: {
        progress: result.progress ?? null,
        prompt,
      },
      resultImageUrls: result.imageUrls,
      errorMessage: result.errorMessage ?? null,
    });

    if (failed && !existingTask.raw.credits_refunded_at && existingTask.raw.credits_cost > 0) {
      await refundCredits(
        auth.user.id,
        existingTask.raw.credits_cost,
        "prompt_image_generation_refund",
        existingTask.raw.id,
      ).catch(() => null);
      await markImageTaskRefunded(existingTask.raw.id).catch(() => null);
    }

    const response = NextResponse.json(result);
    return appendGuestCookie(response, guestTokenToSet);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kie 图片状态查询失败。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
