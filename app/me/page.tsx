import Link from "next/link";
import { AppScaffold } from "@/components/AppScaffold";
import { PaperIcon } from "@/components/PaperIcon";
import { LogoutButton } from "@/components/LogoutButton";
import { getAuthContext } from "@/lib/server/auth";
import { isPreviewMode, previewOverview } from "@/lib/preview-data";
import { getUserOverview } from "@/lib/server/user-store";

export const dynamic = "force-dynamic";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function renderAvatarContent(avatarUrl: string | null, nickname: string) {
  if (avatarUrl && !avatarUrl.startsWith("http")) return avatarUrl;
  return nickname.slice(0, 1) || "用";
}

const toolItems = [
  { title: "历史记录", icon: "history", href: "/records" },
  { title: "我的上传", icon: "upload", href: "/records" },
  { title: "隐私设置", icon: "shield", href: "/privacy" },
  { title: "帮助反馈", icon: "chat", href: "/notice" },
] as const;

export default async function MePage() {
  const auth = await getAuthContext();
  const overview = auth ? await getUserOverview(auth.user.id) : previewOverview;
  const avatarLabel = renderAvatarContent(overview.user?.avatarUrl ?? null, overview.user?.nickname ?? "用户");

  return (
    <AppScaffold title="我的" activeNav="me" ornamentedTitle>
      <section className="paper-panel paper-profile-card mt-5 paper-profile-reference">
        <div className="paper-avatar-ring">
          <div className="paper-avatar-inner">{avatarLabel}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="paper-panel-title text-[36px]">{overview.user?.nickname}</div>
          <div className="mt-2 text-[20px] text-[#645848]">已完成 {overview.recentRecords.length} 次测算</div>
          <div className="mt-3 text-sm text-[#948571]">
            {overview.user?.isGuest ? "游客试用中，可联系微信继续补赠额度" : overview.user?.phoneMasked}
          </div>
          <div className="mt-2 text-xs break-all text-[#a08970]">UID：{overview.user?.id}</div>
          <div className="mt-3 paper-pill-button inline-flex">剩余额度 {overview.credits?.balance ?? 0}</div>
        </div>
        <div className="text-[28px] text-[#b48444]">›</div>
      </section>

      <section className="paper-panel mt-6 px-4 py-5">
        <div className="paper-tool-grid">
          {toolItems.map((item) => (
            <Link key={item.title} href={item.href} className="paper-panel soft paper-tool-card paper-tool-card-reference">
              <span className="paper-tip-icon"><PaperIcon name={item.icon} /></span>
              <div className="paper-panel-title text-[22px]">{item.title}</div>
              <div className="mt-2 text-[#b48444]">›</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="paper-panel mt-6 px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block h-7 w-1 rounded-full bg-[rgba(185,147,82,0.9)]" />
            <div className="paper-panel-title text-[34px]">最近记录</div>
          </div>
          <Link href="/records" className="paper-small-link">
            全部记录 ›
          </Link>
        </div>

        <div className="paper-record-list">
          {overview.recentRecords.length > 0 ? (
            overview.recentRecords.slice(0, 3).map((item) => (
              <Link key={item.id} href={`/result?id=${item.id}`} className="paper-record-item">
                <div className="paper-avatar-inner !h-[72px] !w-[72px] !text-[22px]">{item.result.recommendedSeat.slice(0, 2)}</div>
                <div className="min-w-0 flex-1">
              <div className="paper-panel-title text-[20px]">
                {item.result.recommendedSeat} / {item.result.openingReminder}
              </div>
                  <div className="mt-1 text-sm text-[#a29483]">{formatTime(item.createdAt)}</div>
                </div>
                <div className="paper-record-badge">{item.result.input.mood}</div>
              </Link>
            ))
          ) : (
            <div className="paper-fine-text">还没有历史记录，先去生成一次座位建议吧。</div>
          )}
        </div>
      </section>

      <section className="paper-panel mt-6 px-5 py-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="inline-block h-7 w-1 rounded-full bg-[rgba(185,147,82,0.9)]" />
          <div className="paper-panel-title text-[34px]">工具说明</div>
        </div>
        <div className="paper-info-banner !p-0">
          <div className="paper-info-banner-icon"><PaperIcon name="upload" /></div>
          <p className="paper-description !mx-0 !mt-0 text-left">
            本工具提供状态与座位参考，不构成任何结果承诺。
          </p>
        </div>
      </section>

      {auth && !isPreviewMode ? (
        <div className="mt-4 flex justify-end">
          <LogoutButton />
        </div>
      ) : null}
    </AppScaffold>
  );
}
