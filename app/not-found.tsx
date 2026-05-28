import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="page-wrap page-stack justify-center">
      <section className="glass-panel rounded-[32px] px-5 py-8 text-center">
        <div className="eyebrow justify-center">404</div>
        <h1 className="display-font mt-4 text-[40px] leading-none text-[var(--text)]">
          这张座位卡找不到了
        </h1>
        <p className="mx-auto mt-4 max-w-[24ch] text-[15px] leading-7 text-[var(--muted)]">
          可能是链接写错了，或者这一步还没有生成。回到首页重新开始，会更稳一点。
        </p>

        <div className="mt-7 grid gap-3">
          <Link href="/" className="button-primary h-14 text-sm">
            返回首页
          </Link>
          <Link href="/notice" className="button-secondary h-14 text-sm">
            先看使用说明
          </Link>
        </div>
      </section>
    </main>
  );
}
