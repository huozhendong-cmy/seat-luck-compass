import { NextResponse } from "next/server";
import { getSessionResponse } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSessionResponse();
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "会话读取失败。" },
      { status: 500 },
    );
  }
}
