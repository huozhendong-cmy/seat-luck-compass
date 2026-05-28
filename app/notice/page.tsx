import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";

const steps = [
  "先填写生肖、出生月份、今日状态和今日边界，再填写环境信息。",
  "如果你只想快速得到建议，可以直接生成文字结果卡。",
  "如果你想做海报，建议上传能同时拍到座位、门口、窗边和主要通道的环境图。",
  "图片越完整，模型越容易判断靠墙感、强光位、人流干扰和视线开阔度。",
  "遇到服务繁忙或生成较慢时，可以先看文字建议卡，稍后再回来生成海报。",
];

const reminders = [
  "结果页属于娱乐化提示，不等于任何现实承诺。",
  "如果你当天状态偏急或不甘心，系统会优先提醒你放慢节奏、控制边界、减少冲动。",
  "推荐逻辑会优先考虑靠墙、避开正对门和背门，并结合光线与噪音做修正。",
];

export default function NoticePage() {
  return (
    <main className="page-wrap space-y-6">
      <div className="topbar fade-up">
        <div className="brand-mark">
          <div className="brand-seal" />
          <div className="brand-meta">
            <strong>Usage Guide</strong>
            <span>怎么测 · 怎么拍 · 怎么看结果</span>
          </div>
        </div>
      </div>

      <SectionHeading
        eyebrow="Guide"
        title="使用说明"
        description="第一次使用时，先看这一页会更顺手，也更容易拍出可分析的环境图。"
      />

      <section className="glass-panel rounded-[30px] px-4 py-5">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="result-section">
              <strong>{index + 1}. 使用步骤</strong>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[30px] px-4 py-5">
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div key={reminder} className="result-section">
              <strong>温和提醒</strong>
              <p>{reminder}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="control-bar">
        <Link href="/form" className="button-primary h-14 text-sm">
          去开始测一测
        </Link>
        <Link href="/privacy" className="button-secondary h-14 text-sm">
          查看隐私说明
        </Link>
      </div>
    </main>
  );
}
