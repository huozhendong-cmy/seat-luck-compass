import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { getUserOverview } from "@/lib/server/user-store";
import { isPreviewMode, previewOverview } from "@/lib/preview-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuth();
    const overview = await getUserOverview(auth.user.id);
    return NextResponse.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取用户信息失败。";
    if (message === "UNAUTHORIZED" && isPreviewMode) {
      return NextResponse.json(previewOverview);
    }
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
