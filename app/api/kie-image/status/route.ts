import { NextResponse } from "next/server";
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

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kie 图片状态查询失败。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
