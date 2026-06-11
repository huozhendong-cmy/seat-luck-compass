import { NextResponse } from "next/server";
import { destroySessionResponse } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    return await destroySessionResponse();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "退出登录失败。" },
      { status: 500 },
    );
  }
}
