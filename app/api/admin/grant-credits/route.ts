import { NextResponse } from "next/server";
import { getUserOverview, grantCredits } from "@/lib/server/user-store";

export const runtime = "nodejs";

type RequestBody = {
  adminKey?: string;
  userId?: string;
  amount?: number;
  note?: string;
};

function readAdminKey() {
  return (process.env.ADMIN_DASHBOARD_KEY || "").trim();
}

export async function POST(request: Request) {
  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  const adminKey = readAdminKey();

  if (!adminKey) {
    return NextResponse.json({ error: "后台管理密钥尚未配置。" }, { status: 500 });
  }

  if (!body.adminKey || body.adminKey !== adminKey) {
    return NextResponse.json({ error: "后台密钥不正确。" }, { status: 401 });
  }

  if (!body.userId?.trim()) {
    return NextResponse.json({ error: "请输入用户 UID。" }, { status: 400 });
  }

  const amount = Number(body.amount || 0);

  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "赠送额度必须是正整数。" }, { status: 400 });
  }

  try {
    await getUserOverview(body.userId.trim());
    const credits = await grantCredits(body.userId.trim(), amount, "manual_grant", body.note?.trim() || null);
    return NextResponse.json({
      ok: true,
      credits,
      userId: body.userId.trim(),
      message: `已为 ${body.userId.trim()} 补赠 ${amount} 点额度。`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "赠送额度失败。" },
      { status: 400 },
    );
  }
}
