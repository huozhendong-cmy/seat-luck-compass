import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { getAnalyticsDashboardData, isSupabaseConfigured } from "@/lib/supabase-records";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function eventLabel(name: string) {
  switch (name) {
    case "page_view":
      return "页面打开";
    case "home_cta_click":
      return "首页点击开始";
    case "analyze_cta_click":
      return "进入海报页";
    case "generate_cta_click":
      return "进入生成图页";
    case "profile_continue":
      return "完成资料填写";
    case "result_generated":
      return "生成结果卡";
    case "poster_generate_start":
      return "发起海报";
    case "poster_generate_success":
      return "海报成功";
    case "poster_generate_fail":
      return "海报失败";
    case "image_analysis_start":
      return "开始标识";
    case "image_analysis_success":
      return "标识成功";
    case "image_analysis_fail":
      return "标识失败";
    default:
      return name;
  }
}

function shortPath(path: string) {
  return path === "/" ? "首页" : path;
}

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <main className="page-wrap space-y-6">
        <div className="topbar fade-up">
          <div className="brand-mark">
            <div className="brand-seal" />
            <div className="brand-meta">
              <strong>Dashboard</strong>
              <span>统计后台</span>
            </div>
          </div>
        </div>

        <SectionHeading
          eyebrow="Insights"
          title="统计后台还没接上"
          description="当前环境里还没有可用的 Supabase 配置，所以页面暂时读不到访问和转化数据。"
        />

        <section className="glass-panel rounded-[32px] px-5 py-5">
          <p className="text-sm leading-7 text-[var(--muted)]">
            等把 Supabase 环境变量补齐后，这一页会自动显示访问量、完成测评人数、海报转化和最近行为记录。
          </p>
          <div className="mt-5">
            <Link href="/" className="button-secondary h-12 px-5 text-sm">
              返回首页
            </Link>
          </div>
        </section>
      </main>
    );
  }

  let dashboard;

  try {
    dashboard = await getAnalyticsDashboardData();
  } catch (error) {
    return (
      <main className="page-wrap space-y-6">
        <div className="topbar fade-up">
          <div className="brand-mark">
            <div className="brand-seal" />
            <div className="brand-meta">
              <strong>Dashboard</strong>
              <span>统计后台</span>
            </div>
          </div>
        </div>

        <SectionHeading
          eyebrow="Insights"
          title="统计表还没完全就绪"
          description="页面已经接好了，但 Supabase 那边还需要更新一次新表结构，统计页才会开始正常出数。"
        />

        <section className="glass-panel rounded-[32px] px-5 py-5">
          <p className="text-sm leading-7 text-[var(--muted)]">
            当前报错：
            <span className="mt-2 block rounded-[16px] bg-[rgba(255,255,255,0.68)] px-4 py-3 text-[13px] leading-6 text-[var(--text)]">
              {error instanceof Error ? error.message : "未知错误"}
            </span>
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            你只要把最新的 <code>supabase/schema.sql</code> 再执行一遍，然后重新部署，统计页就会恢复正常。
          </p>
        </section>
      </main>
    );
  }

  const trendMax = Math.max(
    ...dashboard.dailyTrend.flatMap((item) => [item.views, item.results]),
    1,
  );

  const summaryCards = [
    {
      label: "总浏览量",
      value: dashboard.pageViews,
      note: "所有页面打开次数",
    },
    {
      label: "独立访客",
      value: dashboard.uniqueVisitors,
      note: "按浏览器 visitor id 去重",
    },
    {
      label: "完成测评",
      value: dashboard.completedResults,
      note: "成功产出结果卡的次数",
    },
    {
      label: "海报成功率",
      value: `${dashboard.posterSuccessRate}%`,
      note: `${dashboard.posterSuccessCount} 成功 / ${dashboard.posterFailCount} 失败`,
    },
  ];

  return (
    <main className="page-wrap space-y-6">
      <div className="topbar fade-up">
        <div className="brand-mark">
          <div className="brand-seal" />
          <div className="brand-meta">
            <strong>Dashboard</strong>
            <span>后台统计页 · 刷新即可看到最新数据</span>
          </div>
        </div>
        <Link href="/dashboard" className="button-secondary h-11 px-4 text-sm">
          刷新数据
        </Link>
      </div>

      <SectionHeading
        eyebrow="Insights"
        title="使用数据一眼看清"
        description="这一页会把访问、提交和海报转化整理成可读视图。你以后主要看这里，不用再直接翻 Supabase 原始表。"
      />

      <section className="grid grid-cols-2 gap-3">
        {summaryCards.map((item) => (
          <div key={item.label} className="glass-panel rounded-[28px] px-4 py-4">
            <div className="text-[12px] uppercase tracking-[0.18em] text-[var(--gold-soft)]">
              {item.label}
            </div>
            <div className="mt-3 text-[30px] font-semibold text-[var(--text)]">{item.value}</div>
            <p className="mt-2 text-xs leading-6 text-[var(--muted)]">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="glass-panel rounded-[32px] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Funnel</div>
            <h2 className="display-font mt-3 text-[30px] text-[var(--text)]">转化漏斗</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              从打开首页到生成海报的关键节点，都在这里能看出来。
            </p>
          </div>
          <div className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.7)] px-3 py-2 text-xs text-[var(--muted)]">
            会话 {dashboard.uniqueSessions}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {dashboard.funnel.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="font-medium text-[var(--text)]">{item.label}</div>
                <div className="text-[var(--muted)]">
                  {item.value} <span className="text-[rgba(101,112,105,0.66)]">/ {item.ratio}%</span>
                </div>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(129,101,58,0.08)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#375f51_0%,#b39259_100%)]"
                  style={{ width: `${Math.max(item.ratio, item.value > 0 ? 8 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[32px] px-5 py-5">
        <div className="eyebrow">Trend</div>
        <h2 className="display-font mt-3 text-[30px] text-[var(--text)]">近 7 天趋势</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          深绿色代表浏览量，金色代表完成结果卡数量。
        </p>

        <div className="mt-6 grid grid-cols-7 gap-3">
          {dashboard.dailyTrend.map((item) => (
            <div key={item.date} className="flex min-h-[168px] flex-col justify-end gap-3">
              <div className="flex min-h-[118px] items-end justify-center gap-2">
                <div
                  className="w-4 rounded-full bg-[var(--green)]"
                  style={{ height: `${Math.max((item.views / trendMax) * 112, item.views > 0 ? 10 : 0)}px` }}
                />
                <div
                  className="w-4 rounded-full bg-[var(--gold)]"
                  style={{ height: `${Math.max((item.results / trendMax) * 112, item.results > 0 ? 10 : 0)}px` }}
                />
              </div>
              <div className="space-y-1 text-center">
                <div className="text-[11px] text-[var(--muted)]">{item.date.slice(5).replace("-", "/")}</div>
                <div className="text-[11px] text-[rgba(101,112,105,0.72)]">
                  {item.views} / {item.results}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-[32px] px-5 py-5">
          <div className="eyebrow">Pages</div>
          <h2 className="display-font mt-3 text-[30px] text-[var(--text)]">热门页面</h2>

          <div className="mt-5 space-y-3">
            {dashboard.topPages.length > 0 ? (
              dashboard.topPages.map((item) => (
                <div key={item.path} className="flex items-center justify-between gap-3 rounded-[18px] bg-[rgba(255,255,255,0.62)] px-4 py-3">
                  <div className="text-sm text-[var(--text)]">{shortPath(item.path)}</div>
                  <div className="text-sm font-medium text-[var(--green)]">{item.views}</div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-[var(--muted)]">还没有页面浏览数据，先自己打开几次再回来刷新。</p>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-[32px] px-5 py-5">
          <div className="eyebrow">Posters</div>
          <h2 className="display-font mt-3 text-[30px] text-[var(--text)]">海报转化</h2>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] bg-[rgba(255,255,255,0.62)] px-4 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--gold-soft)]">发起任务</div>
              <div className="mt-3 text-[28px] font-semibold text-[var(--text)]">{dashboard.posterJobs}</div>
            </div>
            <div className="rounded-[22px] bg-[rgba(255,255,255,0.62)] px-4 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--gold-soft)]">成功生成</div>
              <div className="mt-3 text-[28px] font-semibold text-[var(--text)]">{dashboard.posterSuccessCount}</div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            如果这里的发起任务高、成功生成低，就说明图片生成链路还值得继续优化。
          </p>
        </div>
      </section>

      <section className="glass-panel rounded-[32px] px-5 py-5">
        <div className="eyebrow">Recent Activity</div>
        <h2 className="display-font mt-3 text-[30px] text-[var(--text)]">最近行为</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          这里会显示最近记录到的用户动作，方便你看大家主要停在哪一步。
        </p>

        <div className="mt-5 space-y-3">
          {dashboard.recentActivity.length > 0 ? (
            dashboard.recentActivity.map((item) => (
              <div
                key={item.id}
                className="rounded-[20px] border border-[rgba(129,101,58,0.1)] bg-[rgba(255,255,255,0.66)] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">{eventLabel(item.eventName)}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{shortPath(item.path)}</div>
                  </div>
                  <div className="text-xs text-[rgba(101,112,105,0.72)]">{dateFormatter.format(new Date(item.createdAt))}</div>
                </div>
                {item.metadata && Object.keys(item.metadata).length > 0 ? (
                  <div className="mt-3 text-xs leading-6 text-[rgba(101,112,105,0.84)]">
                    {JSON.stringify(item.metadata)}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm leading-7 text-[var(--muted)]">还没有新埋点数据，先自己走一遍首页到海报的流程。</p>
          )}
        </div>
      </section>
    </main>
  );
}
