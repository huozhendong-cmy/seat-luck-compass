"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-wrap page-stack justify-center">
      <section className="glass-panel rounded-[32px] px-5 py-8 text-center">
        <div className="eyebrow justify-center">Oops</div>
        <h1 className="display-font mt-4 text-[38px] leading-none text-[var(--text)]">
          这一页刚刚有点走神
        </h1>
        <p className="mx-auto mt-4 max-w-[24ch] text-[15px] leading-7 text-[var(--muted)]">
          可能是网络、图片服务，或者临时页面状态造成的。你可以先重试一次，通常就能恢复。
        </p>

        <div className="mt-7 grid gap-3">
          <button type="button" className="button-primary h-14 text-sm" onClick={reset}>
            重新试一次
          </button>
          <Link href="/" className="button-secondary h-14 text-sm">
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
