export default function Loading() {
  return (
    <main className="page-wrap page-stack justify-center">
      <section className="glass-panel rounded-[32px] px-5 py-8 text-center">
        <div className="eyebrow justify-center">Loading</div>
        <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(129,101,58,0.16)] bg-[rgba(255,255,255,0.72)]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(179,146,89,0.28)] border-t-[var(--green)]" />
        </div>
        <h1 className="display-font mt-5 text-[34px] leading-none text-[var(--text)]">
          正在整理今日座位卡
        </h1>
        <p className="mx-auto mt-4 max-w-[23ch] text-[15px] leading-7 text-[var(--muted)]">
          稍等一下，页面正在加载环境信息和状态内容。
        </p>
      </section>
    </main>
  );
}
