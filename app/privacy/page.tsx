import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";

const items = [
  {
    title: "我们会处理哪些信息",
    body: "你在页面中主动填写的生肖、出生月份、今日状态、今日边界和环境信息，会保存在当前浏览器的 localStorage 中，用于生成结果卡和保留最近 5 次记录。",
  },
  {
    title: "上传图片会怎么使用",
    body: "你上传的环境图仅用于本次空间分析、原图标识和推荐海报生成。系统会把图片发送给第三方模型服务进行处理，用于识别座位、动线、采光和稳定感等可见空间信息。",
  },
  {
    title: "我们不会做什么",
    body: "本产品不做人脸识别、不做身份核验、不提供下注、约局、输赢预测或任何结果承诺，也不会把你的填写信息用于广告推荐。",
  },
  {
    title: "建议避免上传的内容",
    body: "请尽量不要上传包含人脸、联系方式、收款码、车牌号、住址门牌或其他敏感隐私信息的图片。如果场景中不可避免地拍到了这些信息，建议先自行打码后再上传。",
  },
  {
    title: "数据保存与删除",
    body: "当前版本不接数据库，最近记录仅保存在你自己的设备浏览器里。清除浏览器站点数据后，这些记录会一并删除。海报与分析结果请按需自行保存。",
  },
  {
    title: "第三方服务说明",
    body: "图片分析与海报生成依赖 Kie 提供的模型接口。若第三方服务暂时不可用，页面可能出现排队、超时或生成失败，你可以稍后重试，或先使用文字建议卡。",
  },
];

export default function PrivacyPage() {
  return (
    <main className="page-wrap space-y-6">
      <div className="topbar fade-up">
        <div className="brand-mark">
          <div className="brand-seal" />
          <div className="brand-meta">
            <strong>Privacy Notice</strong>
            <span>上传说明 · 数据处理 · 使用边界</span>
          </div>
        </div>
      </div>

      <SectionHeading
        eyebrow="Privacy"
        title="隐私与图片使用说明"
        description="这是一份面向用户的简明说明，帮助大家理解填写资料和上传环境图会如何被使用。"
      />

      <section className="glass-panel rounded-[30px] px-4 py-5">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.title} className="result-section">
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[30px] px-4 py-5">
        <div className="space-y-3 text-sm leading-7 text-[var(--muted)]">
          <p>
            继续使用本产品，即表示你理解：本产品是娱乐化的状态提醒工具，重点在于帮助你从空间舒适度、动线干扰和当前心态的角度做一个更稳妥的入场判断。
          </p>
          <p>
            如果你只是想先体验流程，也可以不上传图片，直接使用文字建议卡。
          </p>
        </div>
      </section>

      <div className="control-bar">
        <Link href="/environment" className="button-primary h-14 text-sm">
          返回环境页
        </Link>
        <Link href="/notice" className="button-secondary h-14 text-sm">
          查看使用说明
        </Link>
      </div>
    </main>
  );
}
