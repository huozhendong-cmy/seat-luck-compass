import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { createSeatRecord } from "@/lib/server/user-store";
import type { ResultData } from "@/lib/types";

export const runtime = "nodejs";

type RequestBody = {
  result?: ResultData;
};

export async function POST(request: Request) {
  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  if (!body.result?.id) {
    return NextResponse.json({ error: "缺少结果数据。" }, { status: 400 });
  }

  try {
    const auth = await requireAuth();
    const record = await createSeatRecord(auth.user.id, body.result);
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "提交记录写入失败。";
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
