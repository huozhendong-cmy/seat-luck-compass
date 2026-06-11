import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
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
    };
    status?: KieImageTaskStatus;
    progress?: string;
    errorMessage?: string;
  };
};

const baseUrl = process.env.KIE_API_BASE_URL ?? "https://api.kie.ai";

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
    const auth = await requireAuth();
    const existingTask = await getImageTaskByExternalTaskId(auth.user.id, taskId);

    if (!existingTask) {
      return NextResponse.json({ error: "任务不存在或无权访问。" }, { status: 404 });
    }

    const response = await fetch(
      `${baseUrl}/api/v1/gpt4o-image/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        },
        cache: "no-store",
      },
    );

    const data = (await response.json()) as KieStatusResponse;

    if (!response.ok || data.code !== 200 || !data.data?.taskId) {
      return NextResponse.json(
        { error: data.msg || "Kie 图片状态查询失败。" },
        { status: 500 },
      );
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
      status: data.data.status ?? "GENERATING",
      progress: data.data.progress,
      prompt,
      imageUrls: data.data.response?.resultUrls ?? [],
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

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录后再继续。" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Kie 图片状态查询失败。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
