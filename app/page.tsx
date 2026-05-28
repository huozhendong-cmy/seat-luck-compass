"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-wrap page-stack justify-between">
      <section className="hero-reveal flex flex-1 flex-col justify-between py-2">
        <div>
          <div className="topbar">
            <div className="brand-mark">
              <div className="brand-seal" />
              <div className="brand-meta">
                <strong>Seat Luck Compass</strong>
                <span>座位状态提醒卡</span>
              </div>
            </div>
          </div>

          <div className="mb-7 pt-6">
            <div className="eyebrow mb-4">Today Reading</div>
            <h1 className="display-font text-[54px] leading-[0.98] tracking-[0.04em] text-[var(--text)]">
              今日
              <br />
              座位罗盘
            </h1>
            <p className="mt-5 max-w-[18ch] text-[17px] leading-8 text-[var(--muted)]">
              入场前测一测，生成你的今日推荐座位、进入节奏和状态提醒卡。
            </p>
            <p className="subtle-note">不讲玄乎承诺，只帮你在进场前把位置、心气和节奏感调到更舒服。</p>
          </div>

          <div className="hero-poster mb-7">
            <div className="ring" />
            <div className="mb-6 flex items-center justify-center">
              <div className="compass-core scale-[0.94]">
                <div className="compass-orbit" />
              </div>
            </div>
            <div className="mb-5 text-center">
              <div className="eyebrow justify-center">Compass Mood</div>
              <p className="mx-auto mt-3 max-w-[21ch] text-sm leading-7 text-[var(--muted)]">
                先找稳，再找顺眼的位置，让今天入场少一点躁感，多一点分寸。
              </p>
            </div>
            <div className="hero-stat-grid">
              <div className="hero-stat">
                <strong>稳</strong>
                <span>先看节奏</span>
              </div>
              <div className="hero-stat">
                <strong>静</strong>
                <span>先挑位置</span>
              </div>
              <div className="hero-stat">
                <strong>准</strong>
                <span>先收状态</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Link href="/form" className="button-primary h-14 w-full text-base">
              开始测一测
            </Link>
            <Link href="/analyze" className="button-secondary h-14 w-full text-base">
              上传座位图做海报
            </Link>
            <Link href="/generate" className="button-secondary h-14 w-full text-base">
              提示词生成图
            </Link>
          </div>
          <div className="tiny-disclaimer space-y-2">
            <p>仅供娱乐和状态提醒，不构成任何结果承诺</p>
            <div className="flex items-center justify-center gap-4 text-[12px] text-[rgba(101,112,105,0.78)]">
              <Link href="/notice" className="underline decoration-[rgba(129,101,58,0.22)] underline-offset-4">
                使用说明
              </Link>
              <Link href="/privacy" className="underline decoration-[rgba(129,101,58,0.22)] underline-offset-4">
                隐私说明
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
