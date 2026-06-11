import { NextResponse } from "next/server";
import { isPreviewMode, previewRecords, previewSeatRecords } from "@/lib/preview-data";
import { requireAuth } from "@/lib/server/auth";
import { createSeatRecord, getSeatRecord, listSeatRecords, saveUserDrafts } from "@/lib/server/user-store";
import type { EnvironmentDraft, ProfileDraft, ResultData } from "@/lib/types";

export const runtime = "nodejs";

type RequestBody = {
  result?: ResultData;
  profileDraft?: ProfileDraft | null;
  environmentDraft?: EnvironmentDraft | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get("id")?.trim();

  try {
    const auth = await requireAuth();

    if (recordId) {
      const record = await getSeatRecord(auth.user.id, recordId);

      if (!record) {
        return NextResponse.json({ error: "记录不存在。" }, { status: 404 });
      }

      return NextResponse.json({ record });
    }

    const records = await listSeatRecords(auth.user.id, 20);
    return NextResponse.json({ records });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取记录失败。";
    if (message === "UNAUTHORIZED" && isPreviewMode) {
      if (recordId) {
        const record = previewSeatRecords.find((item) => item.id === recordId) ?? previewSeatRecords[0];
        return NextResponse.json({ record });
      }
      return NextResponse.json({ records: previewRecords.seatRecords });
    }
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  if (!body.result) {
    return NextResponse.json({ error: "缺少结果数据。" }, { status: 400 });
  }

  try {
    const auth = await requireAuth();
    await saveUserDrafts(auth.user.id, {
      profileDraft: body.profileDraft,
      environmentDraft: body.environmentDraft,
    });
    const record = await createSeatRecord(auth.user.id, body.result);
    return NextResponse.json({ record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存记录失败。";
    if (message === "UNAUTHORIZED" && isPreviewMode) {
      return NextResponse.json({
        record: {
          id: `preview-record-${Date.now()}`,
          createdAt: new Date().toISOString(),
          result: body.result,
        },
      });
    }
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
