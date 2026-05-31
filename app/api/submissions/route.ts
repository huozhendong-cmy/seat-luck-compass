import { NextResponse } from "next/server";
import { isSupabaseConfigured, upsertSubmissionRecord } from "@/lib/supabase-records";
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

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await upsertSubmissionRecord(body.result);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "提交记录写入 Supabase 失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
