import { NextResponse } from "next/server";
import { insertAnalyticsEvent, isSupabaseConfigured } from "@/lib/supabase-records";
import type { AnalyticsEventPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  let body: AnalyticsEventPayload;

  try {
    body = (await request.json()) as AnalyticsEventPayload;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  if (!body.eventName || !body.path || !body.visitorId || !body.sessionId) {
    return NextResponse.json({ error: "埋点字段不完整。" }, { status: 400 });
  }

  try {
    await insertAnalyticsEvent(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "埋点写入失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
