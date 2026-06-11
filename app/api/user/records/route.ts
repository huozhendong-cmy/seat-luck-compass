import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { getUserRecords } from "@/lib/server/user-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuth();
    const records = await getUserRecords(auth.user.id);
    return NextResponse.json(records);
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取记录失败。";
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
