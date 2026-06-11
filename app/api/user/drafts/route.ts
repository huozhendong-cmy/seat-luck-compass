import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { isPreviewMode, previewEnvironmentDraft, previewProfileDraft } from "@/lib/preview-data";
import { getUserDrafts, saveUserDrafts } from "@/lib/server/user-store";
import type { UserRecordDraftPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuth();
    const drafts = await getUserDrafts(auth.user.id);
    return NextResponse.json(drafts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取草稿失败。";
    if (message === "UNAUTHORIZED" && isPreviewMode) {
      return NextResponse.json({
        profileDraft: previewProfileDraft,
        environmentDraft: previewEnvironmentDraft,
      });
    }
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}

export async function PATCH(request: Request) {
  let body: UserRecordDraftPayload;

  try {
    body = (await request.json()) as UserRecordDraftPayload;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  try {
    const auth = await requireAuth();
    await saveUserDrafts(auth.user.id, body);
    const drafts = await getUserDrafts(auth.user.id);
    return NextResponse.json(drafts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存草稿失败。";
    if (message === "UNAUTHORIZED" && isPreviewMode) {
      return NextResponse.json({
        profileDraft: body.profileDraft ?? previewProfileDraft,
        environmentDraft: body.environmentDraft ?? previewEnvironmentDraft,
      });
    }
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
