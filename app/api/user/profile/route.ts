import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { updateUserProfile } from "@/lib/server/user-store";

export const runtime = "nodejs";

type RequestBody = {
  nickname?: string;
  avatarUrl?: string | null;
};

export async function PATCH(request: Request) {
  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  try {
    const auth = await requireAuth();
    const row = await updateUserProfile(auth.user.id, body);
    return NextResponse.json({
      ok: true,
      profile: {
        nickname: row.nickname,
        avatarUrl: row.avatar_url,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新资料失败。";
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
