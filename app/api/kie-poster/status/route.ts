import { NextResponse } from "next/server";
import type { KiePosterResult } from "@/lib/types";

export const runtime = "nodejs";

const kieBaseUrl = process.env.KIE_API_BASE_URL ?? "https://api.kie.ai";

type RecordInfoResponse = {
  code?: number;
  msg?: string;
  data?: {
    taskId?: string;
    state?: KiePosterResult["state"];
    progress?: number;
    resultJson?: string;
    failMsg?: string;
  };
};

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
      `${kieBaseUrl}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        },
        cache: "no-store",
      },
    );

    const data = (await response.json()) as RecordInfoResponse;

    if (!response.ok || !data.data?.taskId) {
      return NextResponse.json(
        { error: data.msg || "Kie 海报任务状态查询失败。" },
        { status: 500 },
      );
    }

    let imageUrls: string[] = [];

    if (data.data.resultJson) {
      try {
        const parsed = JSON.parse(data.data.resultJson) as {
          resultUrls?: string[];
        };
        imageUrls = parsed.resultUrls ?? [];
      } catch {
        imageUrls = [];
      }
    }

    const result: KiePosterResult = {
      taskId: data.data.taskId,
      state: data.data.state ?? "generating",
      progress: data.data.progress,
      imageUrls,
      failMsg: data.data.failMsg || undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kie 海报任务状态查询失败。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
