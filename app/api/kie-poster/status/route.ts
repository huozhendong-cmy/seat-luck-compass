import { NextResponse } from "next/server";
import type { KiePosterResult } from "@/lib/types";

export const runtime = "nodejs";

const kieBaseUrl = process.env.KIE_API_BASE_URL ?? "https://api.kie.ai";

type RecordInfoResponse = {
  code?: number;
  msg?: string;
  data?: {
    taskId?: string;
    state?: string;
    progress?: number | string;
    resultJson?: string;
    response?: unknown;
    failMsg?: string;
    errorMessage?: string;
  };
};

function normalizePosterState(
  state: string | undefined,
  imageUrls: string[],
  failureMessage?: string,
): KiePosterResult["state"] {
  if (imageUrls.length > 0) {
    return "success";
  }

  if (failureMessage) {
    return "fail";
  }

  const normalized = state?.trim().toUpperCase();

  if (!normalized) {
    return "generating";
  }

  if (
    normalized === "SUCCESS" ||
    normalized === "SUCCEEDED" ||
    normalized === "FINISHED" ||
    normalized === "COMPLETED" ||
    normalized === "DONE"
  ) {
    return "success";
  }

  if (
    normalized === "FAIL" ||
    normalized === "FAILED" ||
    normalized === "ERROR" ||
    normalized === "GENERATE_FAILED" ||
    normalized === "CREATE_TASK_FAILED" ||
    normalized === "CANCELLED"
  ) {
    return "fail";
  }

  if (normalized === "WAITING" || normalized === "PENDING") {
    return "waiting";
  }

  if (normalized === "QUEUING" || normalized === "QUEUED") {
    return "queuing";
  }

  return "generating";
}

function collectUrls(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return value.startsWith("http") ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectUrls(item));
  }

  if (typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const directKeys = [
    "resultUrls",
    "result_urls",
    "imageUrls",
    "image_urls",
    "images",
    "outputs",
    "output",
  ];

  for (const key of directKeys) {
    const urls = collectUrls(record[key]);
    if (urls.length > 0) {
      return urls;
    }
  }

  const nestedKeys = ["response", "data", "result"];

  for (const key of nestedKeys) {
    const urls = collectUrls(record[key]);
    if (urls.length > 0) {
      return urls;
    }
  }

  return [];
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

    if (!response.ok || data.code !== 200 || !data.data?.taskId) {
      return NextResponse.json(
        { error: data.msg || "Kie 海报任务状态查询失败。" },
        { status: 500 },
      );
    }

    let imageUrls = collectUrls(data.data.response);

    if (data.data.resultJson) {
      try {
        const parsed = JSON.parse(data.data.resultJson) as unknown;
        const parsedUrls = collectUrls(parsed);
        if (parsedUrls.length > 0) {
          imageUrls = parsedUrls;
        }
      } catch {
        imageUrls = imageUrls ?? [];
      }
    }

    const failMsg = data.data.failMsg || data.data.errorMessage || undefined;
    const state = normalizePosterState(data.data.state, imageUrls, failMsg);

    const result: KiePosterResult = {
      taskId: data.data.taskId,
      state,
      progress: data.data.progress,
      imageUrls,
      failMsg,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kie 海报任务状态查询失败。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
