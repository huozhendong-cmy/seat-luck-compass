import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CreateBody = {
  prompt?: string;
  size?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
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
  const size = body.size ?? "1:1";
  const isEnhance = body.isEnhance ?? false;

  if (!prompt) {
    return NextResponse.json({ error: "请输入图片提示词。" }, { status: 400 });
  }

  try {
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
      return NextResponse.json(
        { error: data.msg || "Kie 图片任务创建失败。" },
        { status: 500 },
      );
    }

    return NextResponse.json({ taskId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kie 图片任务创建失败。";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
