import { NextResponse } from "next/server";
import { maskPhone, requestLoginCode } from "@/lib/server/auth";
import type { PhoneLoginRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: PhoneLoginRequest;

  try {
    body = (await request.json()) as PhoneLoginRequest;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  if (!body.phone?.trim()) {
    return NextResponse.json({ error: "请输入手机号。" }, { status: 400 });
  }

  try {
    const result = await requestLoginCode(body.phone);

    return NextResponse.json({
      ok: true,
      phone: result.phone,
      phoneMasked: maskPhone(result.phone),
      expiresAt: result.expiresAt,
      debugCode: result.debugCode || undefined,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "验证码生成失败。" },
      { status: 400 },
    );
  }
}
