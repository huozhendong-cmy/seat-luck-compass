"use client";

import Link from "next/link";
import { AppScaffold } from "@/components/AppScaffold";
import { PaperIcon } from "@/components/PaperIcon";
import { PaperCompass } from "@/components/PaperCompass";
import { trackEvent } from "@/lib/analytics";

const homeCards = [
  {
    href: "/form",
    icon: "compass",
    title: "开始测算",
    description: "校准状态，获取座位建议",
    eventName: "home_cta_click" as const,
  },
  {
    href: "/analyze",
    icon: "image",
    title: "上传座位图",
    description: "上传现场或座位平面图",
    eventName: "analyze_cta_click" as const,
  },
  {
    href: "/records",
    icon: "history",
    title: "历史记录",
    description: "查看过往结果与记录",
    eventName: "home_cta_click" as const,
  },
] as const;

const processItems = [
  { number: 1, icon: "user" as const, title: "状态校准", copy: "完善个人状态" },
  { number: 2, icon: "home" as const, title: "环境选择", copy: "选择场景与环境" },
  { number: 3, icon: "upload" as const, title: "上传分析", copy: "上传座位图分析" },
  { number: 4, icon: "record" as const, title: "查看建议", copy: "获取座位建议" },
] as const;

export default function HomePage() {
  return (
    <AppScaffold
      title="今日座位罗盘"
      subtitle="座位仪轨 · 首页"
      ornamentedTitle
      activeNav="home"
    >
      <section className="paper-home-hero paper-home-clean">
        <div className="paper-hero-stage paper-home-stage">
          <PaperCompass
            size="md"
            className="paper-home-hero-compass"
            showPalm={false}
            showDirections={false}
            showBranches={false}
            showCoreDots={false}
          />
          <div className="paper-home-stage-copy">
            <div className="paper-home-kicker">座位仪轨 · 今日启盘</div>
            <h2 className="paper-home-title">今日座位罗盘</h2>
            <p className="paper-home-copy">
              入场前先校准状态，再补充环境，最后拿到更稳的座位建议和节奏提醒。
            </p>
          </div>
          <div className="paper-home-statline">
            <div className="paper-home-stat">
              <strong>5 项</strong>
              <span>状态校准</span>
            </div>
            <div className="paper-home-stat">
              <strong>4 屏</strong>
              <span>完整流程</span>
            </div>
            <div className="paper-home-stat">
              <strong>1 次</strong>
              <span>生成结果</span>
            </div>
          </div>
          <div className="paper-home-primary">
            <Link
              href="/form"
              className="paper-primary-cta"
              onClick={() =>
                trackEvent({
                  eventName: "home_cta_click",
                  metadata: {
                    target: "/form",
                    label: "开始测算",
                  },
                })
              }
            >
              立即开始测算 ✦
            </Link>
          </div>
        </div>
      </section>

      <section className="paper-home-actions">
        {homeCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="paper-panel paper-home-action-card"
            onClick={() =>
              trackEvent({
                eventName: card.eventName,
                metadata: {
                  target: card.href,
                  label: card.title,
                },
              })
            }
          >
            <div className="paper-home-action-icon">
              <PaperIcon name={card.icon} />
            </div>
            <div className="paper-home-action-copy">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            <span className="paper-chevron">›</span>
          </Link>
        ))}
      </section>

      <section className="paper-panel paper-home-process mt-6 px-5 py-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-block h-7 w-1 rounded-full bg-[rgba(185,147,82,0.9)]" />
          <h2 className="paper-panel-title text-[34px]">今日流程</h2>
        </div>
        <div className="paper-process-grid">
          {processItems.map((item) => (
            <div key={item.number} className="paper-process-item">
              <span className="paper-process-number">{item.number}</span>
              <div className="paper-process-icon"><PaperIcon name={item.icon} /></div>
              <div className="paper-panel-title text-[20px]">{item.title}</div>
              <p className="paper-fine-text mt-1">{item.copy}</p>
              {item.number < processItems.length ? <span className="paper-process-arrow">›</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="paper-panel paper-home-tip mt-6">
        <div className="paper-info-banner">
          <div className="paper-info-banner-icon"><PaperIcon name="sun" /></div>
          <div>
            <div className="paper-panel-title text-[40px]">今日提示</div>
            <p className="paper-description !mx-0 !mt-2 text-left">
              本工具仅提供座位参考与状态提醒，不构成任何结果承诺。
            </p>
          </div>
        </div>
      </section>
    </AppScaffold>
  );
}
