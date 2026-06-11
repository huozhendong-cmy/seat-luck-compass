import type {
  EnvironmentDraft,
  ImageTaskSummary,
  ProfileDraft,
  ResultData,
  SeatRecordSummary,
  UserOverviewResponse,
  UserRecordsResponse,
} from "@/lib/types";

export const isPreviewMode = process.env.NODE_ENV !== "production";

export const previewProfileDraft: ProfileDraft = {
  zodiac: "兔",
  birthMonth: 4,
  mood: "稳",
  budgetOption: "1000",
  customBudget: "",
  goal: "稳定",
};

export const previewEnvironmentDraft: EnvironmentDraft = {
  doorPosition: "左前",
  windowPosition: "没有窗",
  availableSeats: ["靠墙", "窗边"],
  light: "柔和",
  noise: "安静",
};

export const previewResultData: ResultData = {
  id: "preview-result-1",
  createdAt: "2026-06-04T09:41:00.000Z",
  input: {
    ...previewProfileDraft,
    ...previewEnvironmentDraft,
  },
  todayState: "宜稳不宜急，适合观察后再入座。",
  recommendedSeat: "西侧偏北",
  discouragedSeat: "正门直冲位",
  reason: "靠边第二席，视野较开阔，进退更从容。",
  traditionalNote: "讲究背后有靠、前方开阔，少受门口与人流打扰。",
  sceneReading: "西侧偏北区域更利于观察全场，光线与动线干扰较少。",
  todayAvoid: "避免坐在正对门口、背后空荡或强光直射的位置。",
  folkReminder: "今天以稳为主，适合留意节奏而非贸然抢位。",
  openingAdvice: "先看人流与光线，再确认靠边第二席是否空出。",
  stopLossReminder: "建议控制在 1000 内",
  luckyColor: "暖金",
  openingReminder: "今天宜稳，不宜急",
  totalScore: 87,
  scoreItems: [
    { label: "稳定感", score: 23, note: "背后更有依托，落座更安心。" },
    { label: "视野", score: 21, note: "视线更顺，方便看清全场动线。" },
    { label: "光线", score: 17, note: "避开强光直照，观感更舒适。" },
    { label: "干扰度", score: 14, note: "距离门口更远，人流影响更小。" },
    { label: "状态匹配", score: 12, note: "与你今天偏稳的节奏更相配。" },
  ],
};

export const previewSeatRecords: SeatRecordSummary[] = [
  {
    id: "preview-record-1",
    createdAt: "2026-05-22T10:30:00.000Z",
    result: previewResultData,
  },
  {
    id: "preview-record-2",
    createdAt: "2026-05-20T16:45:00.000Z",
    result: {
      ...previewResultData,
      id: "preview-result-2",
      recommendedSeat: "东南位",
      openingReminder: "宜观察",
      reason: "更适合保持观察，进退节奏较柔和。",
      input: {
        ...previewResultData.input,
        mood: "累",
      },
    },
  },
  {
    id: "preview-record-3",
    createdAt: "2026-05-18T09:12:00.000Z",
    result: {
      ...previewResultData,
      id: "preview-result-3",
      recommendedSeat: "靠门位",
      discouragedSeat: "靠门位",
      openingReminder: "不推荐",
      reason: "门口动线干扰较强，今天不适合坐得太冲。",
      input: {
        ...previewResultData.input,
        mood: "急",
      },
    },
  },
];

export const previewImageTasks: ImageTaskSummary[] = [
  {
    id: "preview-task-1",
    taskType: "poster",
    status: "success",
    creditsCost: 10,
    createdAt: "2026-06-03T20:18:00.000Z",
    updatedAt: "2026-06-03T20:19:00.000Z",
    externalTaskId: "preview-kie-1",
    resultImageUrls: ["https://example.com/poster-preview.png"],
    errorMessage: null,
  },
];

export const previewOverview: UserOverviewResponse = {
  authenticated: false,
  user: {
    id: "preview-user",
    phone: "+8613811112222",
    phoneMasked: "+86138****2222",
    nickname: "游客用户",
    avatarUrl: null,
    isGuest: true,
  },
  credits: {
    balance: 12,
    totalGranted: 12,
    totalUsed: 0,
    totalRefunded: 0,
  },
  profileDraft: previewProfileDraft,
  environmentDraft: previewEnvironmentDraft,
  recentRecords: previewSeatRecords,
  recentImageTasks: previewImageTasks,
};

export const previewRecords: UserRecordsResponse = {
  seatRecords: previewSeatRecords,
  imageTasks: previewImageTasks,
};
