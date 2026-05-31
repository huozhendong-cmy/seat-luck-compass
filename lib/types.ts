export const zodiacOptions = [
  "鼠",
  "牛",
  "虎",
  "兔",
  "龙",
  "蛇",
  "马",
  "羊",
  "猴",
  "鸡",
  "狗",
  "猪",
] as const;

export const moodOptions = ["稳", "兴奋", "累", "急", "不甘心"] as const;
export const budgetOptions = ["500", "1000", "2000", "5000", "自定义"] as const;
export const goalOptions = ["娱乐", "稳定", "小打", "冲刺"] as const;

export const doorOptions = ["左前", "右前", "正前", "背后"] as const;
export const windowOptions = ["左边", "右边", "没有窗"] as const;
export const seatOptions = ["靠墙", "靠门", "正对门", "背门", "窗边"] as const;
export const lightOptions = ["柔和", "偏暗", "刺眼"] as const;
export const noiseOptions = ["安静", "一般", "嘈杂"] as const;

export type Zodiac = (typeof zodiacOptions)[number];
export type Mood = (typeof moodOptions)[number];
export type BudgetOption = (typeof budgetOptions)[number];
export type Goal = (typeof goalOptions)[number];
export type DoorPosition = (typeof doorOptions)[number];
export type WindowPosition = (typeof windowOptions)[number];
export type SeatOption = (typeof seatOptions)[number];
export type LightOption = (typeof lightOptions)[number];
export type NoiseOption = (typeof noiseOptions)[number];

export type ProfileDraft = {
  zodiac: Zodiac;
  birthMonth: number;
  mood: Mood;
  budgetOption: BudgetOption;
  customBudget: string;
  goal: Goal;
};

export type EnvironmentDraft = {
  doorPosition: DoorPosition;
  windowPosition: WindowPosition;
  availableSeats: SeatOption[];
  light: LightOption;
  noise: NoiseOption;
};

export type TestInput = ProfileDraft & EnvironmentDraft;

export type ResultData = {
  id: string;
  createdAt: string;
  input: TestInput;
  todayState: string;
  recommendedSeat: string;
  discouragedSeat: string;
  reason: string;
  traditionalNote: string;
  sceneReading: string;
  todayAvoid: string;
  folkReminder: string;
  openingAdvice: string;
  stopLossReminder: string;
  luckyColor: string;
  openingReminder: string;
  totalScore: number;
  scoreItems: Array<{
    label: string;
    score: number;
    note: string;
  }>;
};

export type SeatImageAnalysis = {
  sceneSummary: string;
  bestZone: string;
  avoidZone: string;
  spatialObservations: string[];
  zodiacMonthFit: string;
  harmonyTips: string;
  layoutCaption: string;
  safetyNote: string;
  confidence: "高" | "中" | "低";
};

export type KieImageTaskStatus =
  | "GENERATING"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_FAILED"
  | "FAILED";

export type KieImageResult = {
  taskId: string;
  status: KieImageTaskStatus;
  progress?: string;
  prompt: string;
  imageUrls: string[];
  errorMessage?: string;
};

export type SeatZoneVerdict = "recommended" | "secondary" | "avoid";

export type SeatZoneMarkup = {
  id: string;
  label: string;
  verdict: SeatZoneVerdict;
  reason: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SeatLayoutMarkup = {
  sceneSummary: string;
  recommendationSummary: string;
  confidence: "高" | "中" | "低";
  zones: SeatZoneMarkup[];
  quickTips: string[];
};

export type KiePosterState =
  | "waiting"
  | "queuing"
  | "generating"
  | "success"
  | "fail";

export type KiePosterResult = {
  taskId: string;
  state: KiePosterState;
  progress?: number | string;
  imageUrls: string[];
  failMsg?: string;
};

export type AnalyticsEventName =
  | "page_view"
  | "home_cta_click"
  | "analyze_cta_click"
  | "generate_cta_click"
  | "profile_continue"
  | "result_generated"
  | "poster_generate_start"
  | "poster_generate_success"
  | "poster_generate_fail"
  | "image_analysis_start"
  | "image_analysis_success"
  | "image_analysis_fail";

export type AnalyticsEventPayload = {
  eventName: AnalyticsEventName;
  path: string;
  visitorId: string;
  sessionId: string;
  createdAtClient?: string;
  referrer?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type AnalyticsEventRow = {
  id: string;
  createdAt: string;
  eventName: string;
  path: string;
  visitorId: string;
  sessionId: string;
  referrer: string | null;
  metadata: Record<string, unknown> | null;
};

export type AnalyticsDashboardData = {
  pageViews: number;
  uniqueVisitors: number;
  uniqueSessions: number;
  completedResults: number;
  posterJobs: number;
  posterSuccessCount: number;
  posterFailCount: number;
  posterSuccessRate: number;
  funnel: Array<{
    label: string;
    value: number;
    ratio: number;
  }>;
  topPages: Array<{
    path: string;
    views: number;
  }>;
  dailyTrend: Array<{
    date: string;
    views: number;
    results: number;
  }>;
  recentActivity: AnalyticsEventRow[];
};
