"use client";

import { useMemo, useState } from "react";

type WeChatCreditModalProps = {
  open: boolean;
  onClose: () => void;
  userId?: string;
};

export function WeChatCreditModal({ open, onClose, userId = "" }: WeChatCreditModalProps) {
  const [copied, setCopied] = useState(false);

  const qrUrl = process.env.NEXT_PUBLIC_WECHAT_QR_URL || "";
  const wechatId = process.env.NEXT_PUBLIC_WECHAT_ID || "请在环境变量里配置微信号";
  const noteText = process.env.NEXT_PUBLIC_WECHAT_CONTACT_NOTE || "加微信后把 UID 发给我，我会在后台给你补赠额度。";

  const canCopy = useMemo(() => Boolean(userId), [userId]);

  if (!open) {
    return null;
  }

  async function handleCopy() {
    if (!userId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(34,30,24,0.45)] px-5">
      <div className="w-full max-w-[360px] rounded-[28px] border border-[rgba(190,157,107,0.22)] bg-[rgba(255,251,245,0.98)] p-5 shadow-[0_24px_60px_rgba(88,62,30,0.24)]">
        <div className="text-center">
          <div className="text-[12px] tracking-[0.18em] text-[#a97a3c]">免费额度已用完</div>
          <div className="mt-3 font-[var(--font-display)] text-[30px] text-[var(--text-main)]">加微信继续试用</div>
          <p className="mt-3 text-[15px] leading-7 text-[#6a5f54]">
            你可以先扫码加我微信，我会手动帮你补赠体验额度，不需要走充值流程。
          </p>
        </div>

        <div className="mt-5 rounded-[22px] border border-[rgba(188,156,108,0.16)] bg-[rgba(255,255,255,0.78)] p-4">
          {qrUrl ? (
            <img src={qrUrl} alt="微信二维码" className="mx-auto h-[180px] w-[180px] rounded-[18px] object-cover" />
          ) : (
            <div className="mx-auto flex h-[180px] w-[180px] items-center justify-center rounded-[18px] border border-dashed border-[rgba(188,156,108,0.36)] bg-[rgba(250,244,234,0.86)] px-4 text-center text-sm leading-6 text-[#8a7861]">
              请在环境变量中配置
              <br />
              `NEXT_PUBLIC_WECHAT_QR_URL`
            </div>
          )}

          <div className="mt-4 rounded-[18px] bg-[rgba(247,241,232,0.9)] px-4 py-3 text-center">
            <div className="text-[12px] tracking-[0.16em] text-[#a97a3c]">微信号</div>
            <div className="mt-1 text-[18px] text-[var(--text-main)]">{wechatId}</div>
          </div>

          <div className="mt-3 rounded-[18px] bg-[rgba(247,241,232,0.9)] px-4 py-3">
            <div className="text-[12px] tracking-[0.16em] text-[#a97a3c]">你的 UID</div>
            <div className="mt-1 break-all text-[14px] leading-6 text-[var(--text-main)]">{userId || "进入页面后会自动生成"}</div>
            <button
              type="button"
              className="mt-3 inline-flex min-h-[38px] items-center justify-center rounded-full border border-[rgba(188,156,108,0.22)] px-4 text-sm text-[#8f6a37] disabled:opacity-40"
              onClick={handleCopy}
              disabled={!canCopy}
            >
              {copied ? "UID 已复制" : "复制 UID"}
            </button>
          </div>

          <p className="mt-4 text-[14px] leading-7 text-[#6a5f54]">{noteText}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" className="paper-secondary-cta !min-h-[52px] !text-[17px]" onClick={onClose}>
            我知道了
          </button>
          <button type="button" className="paper-primary-cta !min-h-[52px] !text-[17px]" onClick={handleCopy} disabled={!canCopy}>
            复制 UID ✦
          </button>
        </div>
      </div>
    </div>
  );
}

export function isCreditsDepletedMessage(message: string) {
  return message.includes("额度不足");
}
