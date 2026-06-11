import Link from "next/link";
import { AppScaffold } from "@/components/AppScaffold";
import { getAuthContext } from "@/lib/server/auth";
import { previewRecords } from "@/lib/preview-data";
import { getUserRecords } from "@/lib/server/user-store";

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

function taskLabel(taskType: string) {
  switch (taskType) {
    case "analysis":
      return "图片分析";
    case "poster":
      return "海报生成";
    case "prompt_image":
      return "提示词生图";
    default:
      return taskType;
  }
}

export default async function RecordsPage() {
  const auth = await getAuthContext();
  const records = auth ? await getUserRecords(auth.user.id) : previewRecords;

  return (
    <AppScaffold
      title="记录"
      activeNav="records"
      leftSlot={
        <Link href="/" className="paper-icon-button" aria-label="返回首页">
          ‹
        </Link>
      }
    >
      <section className="paper-panel mt-5 px-5 py-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-block h-7 w-1 rounded-full bg-[rgba(185,147,82,0.9)]" />
          <div className="paper-panel-title text-[34px]">历史测算结果</div>
        </div>
        <div className="paper-record-list">
          {records.seatRecords.length > 0 ? (
            records.seatRecords.map((item) => (
              <Link key={item.id} href={`/result?id=${item.id}`} className="paper-record-item">
                <div className="paper-avatar-inner !h-[72px] !w-[72px] !text-[22px]">{item.result.recommendedSeat.slice(0, 2)}</div>
                <div className="min-w-0 flex-1">
                  <div className="paper-panel-title text-[22px]">{item.result.recommendedSeat}</div>
                  <div className="mt-1 text-[18px] text-[#6f6459]">{item.result.reason}</div>
                  <div className="mt-1 text-sm text-[#a29483]">{formatTime(item.createdAt)}</div>
                </div>
                <div className="paper-record-badge">{item.result.input.mood}</div>
              </Link>
            ))
          ) : (
            <div className="paper-fine-text">暂时还没有历史测算记录。</div>
          )}
        </div>
      </section>

      <section className="paper-panel mt-6 px-5 py-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-block h-7 w-1 rounded-full bg-[rgba(185,147,82,0.9)]" />
          <div className="paper-panel-title text-[34px]">历史海报与图片任务</div>
        </div>
        <div className="paper-record-list">
          {records.imageTasks.length > 0 ? (
            records.imageTasks.map((task) => (
              <div key={task.id} className="paper-record-item">
                <div className="paper-avatar-inner !h-[72px] !w-[72px] !text-[22px]">☁</div>
                <div className="min-w-0 flex-1">
                  <div className="paper-panel-title text-[22px]">{taskLabel(task.taskType)}</div>
                  <div className="mt-1 text-[18px] text-[#6f6459]">
                    {task.creditsCost > 0 ? `消耗额度 ${task.creditsCost}` : "本次免费"} / 状态 {task.status}
                  </div>
                  <div className="mt-1 text-sm text-[#a29483]">{formatTime(task.createdAt)}</div>
                  {task.errorMessage ? <div className="mt-1 text-sm text-[#8f5c4a]">失败原因：{task.errorMessage}</div> : null}
                </div>
                {task.resultImageUrls[0] ? (
                  <a href={task.resultImageUrls[0]} target="_blank" rel="noreferrer" className="paper-record-badge">
                    打开
                  </a>
                ) : (
                  <div className="paper-record-badge">{task.status}</div>
                )}
              </div>
            ))
          ) : (
            <div className="paper-fine-text">还没有图片任务记录。</div>
          )}
        </div>
      </section>
    </AppScaffold>
  );
}
