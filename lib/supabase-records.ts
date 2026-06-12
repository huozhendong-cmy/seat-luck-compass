import type {
  AnalyticsDashboardData,
  AnalyticsEventPayload,
  AnalyticsEventRow,
  EnvironmentDraft,
  ProfileDraft,
  ResultData,
  SeatLayoutMarkup,
} from "@/lib/types";

type PosterJobPayload = {
  taskId: string;
  status: string;
  progress?: number | string | null;
  profile?: ProfileDraft | null;
  environment?: EnvironmentDraft | null;
  markup?: SeatLayoutMarkup | null;
  resultImageUrls?: string[];
  errorMessage?: string | null;
};

type SubmissionListRow = {
  id: string;
  created_at: string;
};

type PosterJobListRow = {
  id: string;
  task_type?: string;
  created_at: string;
  updated_at: string;
  status: string;
  error_message: string | null;
};

type AnalyticsEventListRow = {
  id: string;
  created_at: string;
  event_name: string;
  path: string;
  visitor_id: string;
  session_id: string;
  user_id?: string | null;
  referrer: string | null;
  metadata: Record<string, unknown> | null;
};

function getSupabaseUrl() {
  const raw = (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  ).trim();

  return raw.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/g, "");
}

function getSupabaseApiKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    ""
  ).trim();
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseApiKey());
}

async function postgrestFetch(path: string, init: RequestInit) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseApiKey = getSupabaseApiKey();

  if (!supabaseUrl || !supabaseApiKey) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseApiKey,
      Authorization: `Bearer ${supabaseApiKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Supabase 请求失败。");
  }

  return response;
}

async function postgrestSelect<T>(path: string) {
  const response = await postgrestFetch(path, { method: "GET" });
  if (!response) {
    return [] as T[];
  }

  return (await response.json()) as T[];
}

function mapResultToSubmissionRow(result: ResultData) {
  return {
    client_result_id: result.id,
    created_at_client: result.createdAt,
    zodiac: result.input.zodiac,
    birth_month: result.input.birthMonth,
    mood: result.input.mood,
    budget_option: result.input.budgetOption,
    custom_budget: result.input.customBudget || null,
    goal: result.input.goal,
    door_position: result.input.doorPosition,
    window_position: result.input.windowPosition,
    available_seats: result.input.availableSeats,
    light: result.input.light,
    noise: result.input.noise,
    today_state: result.todayState,
    recommended_seat: result.recommendedSeat,
    discouraged_seat: result.discouragedSeat,
    reason: result.reason,
    traditional_note: result.traditionalNote,
    scene_reading: result.sceneReading,
    today_avoid: result.todayAvoid,
    folk_reminder: result.folkReminder,
    opening_advice: result.openingAdvice,
    stop_loss_reminder: result.stopLossReminder,
    lucky_color: result.luckyColor,
    opening_reminder: result.openingReminder,
    total_score: result.totalScore,
    score_items: result.scoreItems,
    input_snapshot: result.input,
  };
}

export async function upsertSubmissionRecord(result: ResultData) {
  const row = mapResultToSubmissionRow(result);

  await postgrestFetch("submissions?on_conflict=client_result_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });
}

export async function upsertPosterJobRecord(payload: PosterJobPayload) {
  await postgrestFetch("poster_jobs?on_conflict=task_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      task_id: payload.taskId,
      status: payload.status,
      progress: payload.progress == null ? null : String(payload.progress),
      profile: payload.profile ?? null,
      environment: payload.environment ?? null,
      markup: payload.markup ?? null,
      result_image_urls: payload.resultImageUrls ?? [],
      error_message: payload.errorMessage ?? null,
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function insertAnalyticsEvent(payload: AnalyticsEventPayload) {
  await postgrestFetch("analytics_events", {
    method: "POST",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      event_name: payload.eventName,
      path: payload.path,
      visitor_id: payload.visitorId,
      session_id: payload.sessionId,
      user_id: payload.userId ?? null,
      created_at_client: payload.createdAtClient ?? null,
      referrer: payload.referrer ?? null,
      user_agent: payload.userAgent ?? null,
      metadata: payload.metadata ?? {},
    }),
  });
}

function toLocalDateKey(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function percentage(value: number, base: number) {
  if (!base) {
    return 0;
  }

  return Math.round((value / base) * 100);
}

function mapEventRow(row: AnalyticsEventListRow): AnalyticsEventRow {
  return {
    id: row.id,
    createdAt: row.created_at,
    eventName: row.event_name,
    path: row.path,
    visitorId: row.visitor_id,
    sessionId: row.session_id,
    userId: row.user_id ?? null,
    referrer: row.referrer,
    metadata: row.metadata,
  };
}

export async function getAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  const [events, submissions, posterJobs] = await Promise.all([
    postgrestSelect<AnalyticsEventListRow>(
      "analytics_events?select=id,created_at,event_name,path,visitor_id,session_id,user_id,referrer,metadata&order=created_at.desc&limit=4000",
    ),
    postgrestSelect<SubmissionListRow>(
      "seat_records?select=id,created_at&order=created_at.desc&limit=1000",
    ),
    postgrestSelect<PosterJobListRow>(
      "image_tasks?select=id,task_type,created_at,updated_at,status,error_message&order=created_at.desc&limit=1000",
    ),
  ]);

  const mappedEvents = events.map(mapEventRow);
  const pageViews = mappedEvents.filter((event) => event.eventName === "page_view");
  const uniqueVisitors = new Set(
    mappedEvents.map((event) => event.visitorId).filter(Boolean),
  ).size;
  const uniqueSessions = new Set(
    mappedEvents.map((event) => event.sessionId).filter(Boolean),
  ).size;
  const posterOnlyJobs = posterJobs.filter((job) => job.task_type === "poster");
  const posterSuccessCount = posterOnlyJobs.filter((job) => job.status === "success").length;
  const posterFailCount = posterOnlyJobs.filter((job) => job.status === "failed").length;
  const posterSuccessRate = percentage(
    posterSuccessCount,
    posterSuccessCount + posterFailCount,
  );

  const funnelMap = [
    {
      label: "首页打开",
      value: pageViews.filter((event) => event.path === "/").length,
    },
    {
      label: "进入资料页",
      value: pageViews.filter((event) => event.path === "/form").length,
    },
    {
      label: "进入环境页",
      value: pageViews.filter((event) => event.path === "/environment").length,
    },
    {
      label: "完成结果卡",
      value: submissions.length,
    },
    {
      label: "发起海报",
      value: mappedEvents.filter((event) => event.eventName === "poster_generate_start").length,
    },
    {
      label: "海报成功",
      value: posterSuccessCount,
    },
  ];

  const funnelBase = Math.max(...funnelMap.map((item) => item.value), 0);

  const topPageMap = new Map<string, number>();
  for (const event of pageViews) {
    topPageMap.set(event.path, (topPageMap.get(event.path) ?? 0) + 1);
  }

  const topPages = Array.from(topPageMap.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((left, right) => right.views - left.views)
    .slice(0, 6);

  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return toLocalDateKey(date.toISOString());
  });

  const viewByDay = new Map<string, number>();
  const resultByDay = new Map<string, number>();

  for (const event of pageViews) {
    const key = toLocalDateKey(event.createdAt);
    viewByDay.set(key, (viewByDay.get(key) ?? 0) + 1);
  }

  for (const item of submissions) {
    const key = toLocalDateKey(item.created_at);
    resultByDay.set(key, (resultByDay.get(key) ?? 0) + 1);
  }

  return {
    pageViews: pageViews.length,
    uniqueVisitors,
    uniqueSessions,
    completedResults: submissions.length,
    posterJobs: posterOnlyJobs.length,
    posterSuccessCount,
    posterFailCount,
    posterSuccessRate,
    funnel: funnelMap.map((item) => ({
      ...item,
      ratio: percentage(item.value, funnelBase),
    })),
    topPages,
    dailyTrend: lastSevenDays.map((date) => ({
      date,
      views: viewByDay.get(date) ?? 0,
      results: resultByDay.get(date) ?? 0,
    })),
    recentActivity: mappedEvents.slice(0, 12),
  };
}
