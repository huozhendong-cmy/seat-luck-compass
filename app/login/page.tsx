"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SectionHeading } from "@/components/SectionHeading";

const avatarPresets = ["🐰", "🦊", "🐯", "🐲", "🐶", "🐼"] as const;

function normalizePhoneInput(value: string) {
  return value.replace(/[^\d]/g, "").slice(0, 11);
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/form";
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [debugCode, setDebugCode] = useState("");
  const [profileAuthorized, setProfileAuthorized] = useState(false);
  const [nickname, setNickname] = useState("今日座位观察员");
  const [avatar, setAvatar] = useState<(typeof avatarPresets)[number]>("🐰");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canRequestCode = useMemo(() => /^1\d{10}$/.test(phone), [phone]);
  const canVerify = useMemo(() => canRequestCode && code.trim().length >= 4, [canRequestCode, code]);

  async function handleRequestCode() {
    if (!canRequestCode) {
      setError("请输入有效的 11 位手机号。");
      return;
    }

    setSending(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });
      const data = (await response.json()) as {
        error?: string;
        debugCode?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "验证码发送失败。");
      }

      setDebugCode(data.debugCode || "");
      setMessage(data.message || "验证码已发送。");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "验证码发送失败。");
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    if (!canVerify) {
      setError("请输入手机号和验证码。");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, code }),
      });
        const data = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(data.error || "登录失败。");
        }

        if (profileAuthorized) {
          await fetch("/api/user/profile", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nickname,
              avatarUrl: avatar,
            }),
          }).catch(() => null);
        }

        router.replace(nextPath);
        router.refresh();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "登录失败。");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="page-wrap space-y-6">
      <div className="topbar fade-up">
        <div className="brand-mark">
          <div className="brand-seal" />
          <div className="brand-meta">
            <strong>Login</strong>
            <span>登录后再继续测算与生成</span>
          </div>
        </div>
      </div>

      <SectionHeading
        eyebrow="Account"
        title="先登录再继续"
        description="先完成头像昵称，再绑定手机号。登录后就能同步你的历史记录、免费额度和生成任务。"
      />

      <section className="glass-panel rounded-[32px] px-4 py-5 space-y-5">
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-[var(--gold-soft)]">
          <span className={`rounded-full px-3 py-1 ${profileAuthorized ? "bg-[rgba(53,96,78,0.12)] text-[var(--green)]" : "bg-[rgba(129,101,58,0.08)] text-[var(--gold-soft)]"}`}>
            01 头像昵称
          </span>
          <span className="text-[rgba(101,112,105,0.42)]">—</span>
          <span className={`rounded-full px-3 py-1 ${profileAuthorized ? "bg-[rgba(53,96,78,0.12)] text-[var(--green)]" : "bg-[rgba(129,101,58,0.08)] text-[var(--gold-soft)]"}`}>
            02 手机验证
          </span>
        </div>

        <div className="rounded-[26px] border border-[rgba(129,101,58,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(247,241,231,0.95)_100%)] px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="field-label">先完善展示身份</div>
              <div className="field-caption">先走一层“获取头像昵称”的授权感流程，再进入手机号绑定，会更像成熟微信产品的节奏。</div>
            </div>
            <button
              type="button"
              className="button-primary h-11 px-4 text-sm"
              onClick={() => {
                setProfileAuthorized(true);
                setMessage("头像昵称步骤已开启，你可以先选一个头像和昵称。");
                setError("");
              }}
            >
              获取头像昵称
            </button>
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-[24px] bg-[rgba(255,255,255,0.82)] px-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#31584a_0%,#d5b172_100%)] text-[28px] shadow-[0_10px_30px_rgba(49,88,74,0.16)]">
              {avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-medium text-[var(--text)]">{nickname || "未命名用户"}</div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                {profileAuthorized ? "已进入身份展示步骤，可继续绑定手机号。" : "先点上方按钮，再选择头像和昵称。"}
              </div>
            </div>
          </div>

          <div className={`mt-4 space-y-4 transition ${profileAuthorized ? "opacity-100" : "pointer-events-none opacity-45"}`}>
            <div>
              <div className="mb-3 text-sm font-medium text-[var(--text)]">选择头像</div>
              <div className="grid grid-cols-3 gap-3">
                {avatarPresets.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`flex h-14 items-center justify-center rounded-[18px] border text-[24px] transition ${
                      avatar === item
                        ? "border-[rgba(49,88,74,0.34)] bg-[rgba(223,236,230,0.82)] shadow-[0_10px_24px_rgba(49,88,74,0.08)]"
                        : "border-[rgba(129,101,58,0.12)] bg-[rgba(255,255,255,0.78)]"
                    }`}
                    onClick={() => setAvatar(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-shell">
              <div className="field-label">昵称</div>
              <input
                className="text-input"
                maxLength={18}
                placeholder="给自己起一个轻松点的昵称"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
              />
            </div>

            <div className="rounded-[18px] bg-[rgba(223,236,230,0.58)] px-4 py-3 text-sm leading-7 text-[var(--green)]">
              当前是 H5 体验版，所以这里先做成“授权样式”的头像昵称步骤；后续如果迁到微信小程序，可以替换成原生头像昵称授权。
            </div>
          </div>
        </div>

        <div className={`rounded-[26px] border border-[rgba(129,101,58,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-5 space-y-4 transition ${profileAuthorized ? "opacity-100" : "opacity-75"}`}>
          <div>
            <div className="field-label">再绑定手机号</div>
            <div className="field-caption">手机号用于同步你的历史记录、额度与任务状态，我们会向你的手机发送 6 位验证码。</div>
          </div>

          <div className="field-shell">
            <div className="field-label">手机号</div>
            <div className="field-caption">当前默认支持中国大陆手机号。</div>
            <input
              className="text-input"
              inputMode="numeric"
              placeholder="请输入 11 位手机号"
              value={phone}
              onChange={(event) => setPhone(normalizePhoneInput(event.target.value))}
            />
          </div>

          <div className="control-bar">
            <button
              type="button"
              className="button-secondary h-12 text-sm"
              disabled={sending || !profileAuthorized}
              onClick={handleRequestCode}
            >
              {sending ? "发送中..." : "获取验证码"}
            </button>
            <input
              className="text-input"
              inputMode="numeric"
              placeholder="输入验证码"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^\d]/g, "").slice(0, 6))}
            />
          </div>
        </div>

        {debugCode ? (
          <div className="rounded-[22px] border border-[rgba(129,101,58,0.18)] bg-[rgba(255,255,255,0.72)] px-4 py-4 text-sm leading-7 text-[var(--text)]">
            <strong className="block text-[var(--green)]">开发模式调试验证码</strong>
            <span className="mt-2 block">
              当前验证码：<b>{debugCode}</b>
            </span>
            <span className="mt-1 block text-[rgba(101,112,105,0.78)]">
              只有本地未配置阿里云短信时才会显示，正式环境不会回显验证码。
            </span>
          </div>
        ) : null}

        {message ? (
          <div className="rounded-[18px] bg-[rgba(223,236,230,0.72)] px-4 py-3 text-sm text-[var(--green)]">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[18px] bg-[rgba(247,225,217,0.72)] px-4 py-3 text-sm text-[#8f5c4a]">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          className="button-primary h-14 w-full text-base"
          disabled={verifying || !profileAuthorized}
          onClick={handleVerify}
        >
          {verifying ? "登录中..." : "验证并登录"}
        </button>
      </section>

      <div className="tiny-disclaimer space-y-2">
        <p>仅供娱乐和状态提醒，不构成任何结果承诺。</p>
        <div className="flex items-center justify-center gap-4 text-[12px] text-[rgba(101,112,105,0.78)]">
          <Link href="/notice" className="underline decoration-[rgba(129,101,58,0.22)] underline-offset-4">
            使用说明
          </Link>
          <Link href="/privacy" className="underline decoration-[rgba(129,101,58,0.22)] underline-offset-4">
            隐私说明
          </Link>
        </div>
      </div>
    </main>
  );
}
