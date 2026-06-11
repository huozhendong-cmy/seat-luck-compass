import { NextResponse } from "next/server";
import { createSessionResponse } from "@/lib/server/auth";
import type { PhoneVerifyRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: PhoneVerifyRequest;

  try {
    body = (await request.json()) as PhoneVerifyRequest;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  if (!body.phone?.trim() || !body.code?.trim()) {
    return NextResponse.json({ error: "手机号和验证码不能为空。" }, { status: 400 });
  }

  try {
    return await createSessionResponse(body.phone, body.code);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "登录失败。" },
      { status: 400 },
    );
  }
}
