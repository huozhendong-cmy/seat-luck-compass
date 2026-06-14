"use client";

import { useState } from "react";

type AdminCreditGrantPanelProps = {
  adminKey: string;
};

export function AdminCreditGrantPanel({ adminKey }: AdminCreditGrantPanelProps) {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("5");
  const [note, setNote] = useState("微信人工补赠");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!userId.trim()) {
      setError("请先输入用户 UID。");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/grant-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminKey,
          userId: userId.trim(),
          amount: Number(amount),
          note,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; message?: string; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "赠送额度失败。");
      }

      setMessage(data.message || "赠送成功。");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "赠送额度失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-panel rounded-[32px] px-5 py-5">
      <div className="eyebrow">Credits</div>
      <h2 className="display-font mt-3 text-[30px] text-[var(--text)]">手动补赠额度</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
        这不是“充值”，而是你手动送积分给用户。用户把 UID 发给你后，你直接在这里补赠就行。
      </p>

      <div className="mt-5 rounded-[22px] border border-[rgba(188,156,108,0.16)] bg-[rgba(255,255,255,0.72)] px-4 py-4">
        <div className="text-[12px] uppercase tracking-[0.16em] text-[var(--gold-soft)]">操作顺序</div>
        <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--muted)]">
          <p>1. 让用户把弹窗里的 UID 发给你。</p>
          <p>2. 把 UID 粘贴到下面这个输入框。</p>
          <p>3. 填要补赠的点数，比如 5 或 10。</p>
          <p>4. 点“确认赠送”，看到成功提示就完成了。</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="field-shell">
          <div className="field-label">用户 UID</div>
          <input
            className="text-input"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="粘贴用户发给你的 UID"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="field-shell">
            <div className="field-label">赠送点数</div>
            <input
              className="text-input"
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))}
              placeholder="5"
            />
            <div className="mt-2 text-xs leading-6 text-[var(--muted)]">这里填你想送给对方多少点积分。</div>
          </div>
          <div className="field-shell">
            <div className="field-label">备注</div>
            <input
              className="text-input"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例如：微信人工补赠"
            />
            <div className="mt-2 text-xs leading-6 text-[var(--muted)]">方便你以后知道这次积分是为什么送的。</div>
          </div>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-[18px] bg-[rgba(223,236,230,0.72)] px-4 py-3 text-sm text-[var(--green)]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[18px] bg-[rgba(247,225,217,0.72)] px-4 py-3 text-sm text-[#8f5c4a]">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex gap-3">
        <button type="button" className="button-secondary h-12 px-4 text-sm" onClick={() => setAmount("5")}>
          补 5 点
        </button>
        <button type="button" className="button-secondary h-12 px-4 text-sm" onClick={() => setAmount("10")}>
          补 10 点
        </button>
        <button type="button" className="button-primary h-12 flex-1 text-sm" onClick={handleSubmit} disabled={loading}>
          {loading ? "处理中..." : "确认赠送"}
        </button>
      </div>
    </section>
  );
}
