import { NextResponse } from "next/server";
import { appendGuestCookie, ensureAuthContext } from "@/lib/server/auth";
import { getUserOverview } from "@/lib/server/user-store";
import { isPreviewMode, previewOverview } from "@/lib/preview-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { auth, guestTokenToSet } = await ensureAuthContext();
    const overview = await getUserOverview(auth.user.id);
    const response = NextResponse.json(overview);
    return appendGuestCookie(response, guestTokenToSet);
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取用户信息失败。";
    if (isPreviewMode) {
      return NextResponse.json(previewOverview);
    }
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
