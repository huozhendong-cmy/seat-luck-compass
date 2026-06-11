import { createHash, randomBytes, randomInt } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { AppUser, AuthSessionResponse, UserCreditSummary } from "@/lib/types";
import { insertRows, patchRows, selectSingle } from "@/lib/server/supabase-admin";
import { isAliyunSmsConfigured, sendAliyunLoginCode } from "@/lib/server/sms/aliyun";

const SESSION_COOKIE_NAME = "slc_session";
const GUEST_COOKIE_NAME = "slc_guest";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const GUEST_TTL_SECONDS = 60 * 60 * 24 * 180;
const MOCK_SMS_CODE = (process.env.MOCK_SMS_CODE || "123456").trim();
const INITIAL_FREE_CREDITS = Number(process.env.INITIAL_FREE_CREDITS || 12);
const SMS_CODE_TTL_SECONDS = Number(process.env.SMS_CODE_TTL_SECONDS || 60 * 5);
const SMS_RESEND_COOLDOWN_SECONDS = Number(process.env.SMS_RESEND_COOLDOWN_SECONDS || 60);

type UserRow = {
  id: string;
  phone: string;
  status: string;
};

type UserProfileRow = {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
};

type UserCreditsRow = {
  user_id: string;
  balance: number;
  total_granted: number;
  total_used: number;
  total_refunded: number;
};

type UserSessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
};

type LoginCodeRow = {
  id: string;
  phone: string;
  code_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type AuthContext = {
  user: AppUser;
  credits: UserCreditSummary;
  sessionId: string;
};

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function futureIso(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function buildNickname(phone: string) {
  return `用户${phone.slice(-4)}`;
}

function isGuestPhone(phone: string) {
  return phone.startsWith("guest_");
}

function buildGuestPhone(guestToken: string) {
  return `guest_${hashValue(guestToken).slice(0, 24)}`;
}

function buildGuestNickname(guestToken: string) {
  return `试用用户${hashValue(guestToken).slice(0, 4).toUpperCase()}`;
}

export function normalizePhone(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "").replace(/^0086/, "+86");
  const mainland = normalized.replace(/^\+86/, "");

  if (!/^1\d{10}$/.test(mainland)) {
    throw new Error("请输入有效的手机号。");
  }

  return `+86${mainland}`;
}

export function maskPhone(phone: string) {
  if (isGuestPhone(phone)) {
    return "游客试用账号";
  }

  return phone.replace(/^(\+?86)?(\d{3})\d{4}(\d{4})$/, (_m, country = "+86", start, end) => {
    return `${country}${start}****${end}`;
  });
}

async function ensureProfile(user: UserRow, nicknameOverride?: string) {
  const existing = await selectSingle<UserProfileRow>(
    `user_profiles?select=user_id,nickname,avatar_url&user_id=eq.${user.id}`,
  );

  if (existing) {
    return existing;
  }

  const [created] = await insertRows<UserProfileRow>(
    "user_profiles",
    {
      user_id: user.id,
      nickname: nicknameOverride || buildNickname(user.phone),
      avatar_url: null,
    },
  );

  return created;
}

async function ensureCredits(userId: string) {
  const existing = await selectSingle<UserCreditsRow>(
    `user_credits?select=user_id,balance,total_granted,total_used,total_refunded&user_id=eq.${userId}`,
  );

  if (existing) {
    return existing;
  }

  const [created] = await insertRows<UserCreditsRow>(
    "user_credits",
    {
      user_id: userId,
      balance: INITIAL_FREE_CREDITS,
      total_granted: INITIAL_FREE_CREDITS,
      total_used: 0,
      total_refunded: 0,
    },
  );

  return created;
}

async function ensureUser(phone: string) {
  const existing = await selectSingle<UserRow>(
    `users?select=id,phone,status&phone=eq.${encodeURIComponent(phone)}`,
  );

  const user =
    existing ??
    (
      await insertRows<UserRow>("users", {
        phone,
        phone_verified_at: nowIso(),
        status: "active",
      })
    )[0];

  const [profile, credits] = await Promise.all([ensureProfile(user), ensureCredits(user.id)]);

  return { user, profile, credits };
}

async function ensureGuestUser(guestToken: string) {
  const phone = buildGuestPhone(guestToken);
  const existing = await selectSingle<UserRow>(
    `users?select=id,phone,status&phone=eq.${encodeURIComponent(phone)}`,
  );

  const user =
    existing ??
    (
      await insertRows<UserRow>("users", {
        phone,
        status: "active",
      })
    )[0];

  const [profile, credits] = await Promise.all([
    ensureProfile(user, buildGuestNickname(guestToken)),
    ensureCredits(user.id),
  ]);

  return { user, profile, credits };
}

async function loadAuthContextByUserId(userId: string, sessionId: string) {
  const [user, profile, credits] = await Promise.all([
    selectSingle<UserRow>(`users?select=id,phone,status&id=eq.${userId}`),
    selectSingle<UserProfileRow>(
      `user_profiles?select=user_id,nickname,avatar_url&user_id=eq.${userId}`,
    ),
    selectSingle<UserCreditsRow>(
      `user_credits?select=user_id,balance,total_granted,total_used,total_refunded&user_id=eq.${userId}`,
    ),
  ]);

  if (!user || user.status !== "active") {
    return null;
  }

  return {
    user: {
      id: user.id,
      phone: user.phone,
      phoneMasked: maskPhone(user.phone),
      nickname: profile?.nickname || (isGuestPhone(user.phone) ? "试用用户" : buildNickname(user.phone)),
      avatarUrl: profile?.avatar_url ?? null,
      isGuest: isGuestPhone(user.phone),
    },
    credits: {
      balance: credits?.balance ?? 0,
      totalGranted: credits?.total_granted ?? 0,
      totalUsed: credits?.total_used ?? 0,
      totalRefunded: credits?.total_refunded ?? 0,
    },
    sessionId,
  } satisfies AuthContext;
}

async function loadGuestAuthContext(guestToken: string) {
  const { user } = await ensureGuestUser(guestToken);
  return loadAuthContextByUserId(user.id, `guest:${guestToken.slice(0, 12)}`);
}

async function readSessionRow() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashValue(token);
  const session = await selectSingle<UserSessionRow>(
    `user_sessions?select=id,user_id,token_hash,expires_at&token_hash=eq.${tokenHash}`,
  );

  if (!session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return null;
  }

  await patchRows<UserSessionRow>(
    `user_sessions?id=eq.${session.id}`,
    { last_seen_at: nowIso() },
  );

  return session;
}

export async function getAuthContext() {
  const session = await readSessionRow();

  if (!session) {
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;

    if (!guestToken) {
      return null;
    }

    return loadGuestAuthContext(guestToken);
  }

  return loadAuthContextByUserId(session.user_id, session.id);
}

export async function requireAuth() {
  const auth = await getAuthContext();

  if (!auth) {
    throw new Error("UNAUTHORIZED");
  }

  return auth;
}

function generateLoginCode() {
  if (!isAliyunSmsConfigured() && process.env.NODE_ENV !== "production" && MOCK_SMS_CODE) {
    return MOCK_SMS_CODE;
  }

  return String(randomInt(100000, 1000000));
}

async function assertSmsCooldown(phone: string) {
  const latest = await selectSingle<LoginCodeRow>(
    `login_codes?select=id,phone,code_hash,expires_at,used_at,created_at&phone=eq.${encodeURIComponent(phone)}&purpose=eq.login&order=created_at.desc&limit=1`,
  );

  if (!latest?.created_at) {
    return;
  }

  const elapsedSeconds = Math.floor((Date.now() - new Date(latest.created_at).getTime()) / 1000);

  if (elapsedSeconds < SMS_RESEND_COOLDOWN_SECONDS) {
    const remainingSeconds = SMS_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
    throw new Error(`请求过于频繁，请 ${remainingSeconds} 秒后再试。`);
  }
}

export async function requestLoginCode(rawPhone: string) {
  const phone = normalizePhone(rawPhone);
  const code = generateLoginCode();
  const expiresAt = futureIso(SMS_CODE_TTL_SECONDS);

  await assertSmsCooldown(phone);

  await insertRows<LoginCodeRow>("login_codes", {
    phone,
    purpose: "login",
    code_hash: hashValue(`${phone}:${code}`),
    expires_at: expiresAt,
  });

  if (isAliyunSmsConfigured()) {
    await sendAliyunLoginCode(phone, code);
    return {
      phone,
      expiresAt,
      debugCode: "",
      message: "验证码已发送，请留意短信。",
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("短信服务尚未配置完成，请联系管理员。");
  }

  return {
    phone,
    expiresAt,
    debugCode: code,
    message: "开发模式验证码已生成。",
  };
}

export async function createSessionResponse(rawPhone: string, code: string) {
  const phone = normalizePhone(rawPhone);
  const row = await selectSingle<LoginCodeRow>(
    `login_codes?select=id,phone,code_hash,expires_at,used_at&phone=eq.${encodeURIComponent(phone)}&purpose=eq.login&order=created_at.desc&limit=1`,
  );

  if (!row || row.used_at) {
    throw new Error("验证码不存在或已失效。");
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    throw new Error("验证码已过期，请重新获取。");
  }

  if (row.code_hash !== hashValue(`${phone}:${code.trim()}`)) {
    throw new Error("验证码不正确。");
  }

  await patchRows<LoginCodeRow>(`login_codes?id=eq.${row.id}`, {
    used_at: nowIso(),
  });

  const { user } = await ensureUser(phone);
  const token = randomBytes(24).toString("hex");
  const tokenHash = hashValue(token);
  const expiresAt = futureIso(SESSION_TTL_SECONDS);
  const requestHeaders = await headers();

  const [session] = await insertRows<UserSessionRow>("user_sessions", {
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    user_agent: requestHeaders.get("user-agent"),
    ip_address: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  const auth = await loadAuthContextByUserId(user.id, session.id);

  if (!auth) {
    throw new Error("登录会话创建失败。");
  }

  const response = Response.json({
    ok: true,
    user: auth.user,
    credits: auth.credits,
  });

  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );

  return response;
}

export async function destroySessionResponse() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashValue(token);
    await deleteSessionByHash(tokenHash);
  }

  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
  return response;
}

async function deleteSessionByHash(tokenHash: string) {
  await patchRows<UserSessionRow>(
    `user_sessions?token_hash=eq.${tokenHash}`,
    { expires_at: nowIso() },
  );
}

export async function getSessionResponse(): Promise<AuthSessionResponse> {
  const auth = await getAuthContext();

  if (!auth) {
    return {
      authenticated: false,
      user: null,
      credits: null,
    };
  }

  return {
    authenticated: true,
    user: auth.user,
    credits: auth.credits,
  };
}

export function getGuestCookieName() {
  return GUEST_COOKIE_NAME;
}

export function getGuestTtlSeconds() {
  return GUEST_TTL_SECONDS;
}
