import type {
  EnvironmentDraft,
  ImageTaskSummary,
  ImageTaskType,
  ProfileDraft,
  ResultData,
  SeatRecordSummary,
  TaskStatus,
  UserCreditSummary,
  UserOverviewResponse,
  UserRecordsResponse,
} from "@/lib/types";
import { selectList, selectSingle, insertRows, patchRows } from "@/lib/server/supabase-admin";
import { maskPhone } from "@/lib/server/auth";

export const IMAGE_ANALYSIS_COST = 0;
export const POSTER_GENERATION_COST = 10;
export const PROMPT_IMAGE_COST = 0;

type UserProfileDraftRow = {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  last_profile_draft: ProfileDraft | null;
  last_environment_draft: EnvironmentDraft | null;
};

type UserCreditRow = {
  user_id: string;
  balance: number;
  total_granted: number;
  total_used: number;
  total_refunded: number;
};

type SeatRecordRow = {
  id: string;
  created_at: string;
  result_snapshot: ResultData;
};

type ImageTaskRow = {
  id: string;
  task_type: ImageTaskType;
  status: TaskStatus;
  credits_cost: number;
  created_at: string;
  updated_at: string;
  external_task_id: string | null;
  result_image_urls: string[];
  error_message: string | null;
  credits_refunded_at: string | null;
};

type UserRow = {
  id: string;
  phone: string;
};

type ImageTaskCreateInput = {
  userId: string;
  taskType: ImageTaskType;
  status?: TaskStatus;
  creditsCost: number;
  seatRecordId?: string | null;
  externalTaskId?: string | null;
  sourceFileName?: string | null;
  sourceImageUrl?: string | null;
  inputPayload?: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  resultImageUrls?: string[];
  errorMessage?: string | null;
};

type ImageTaskPatchInput = {
  status?: TaskStatus;
  outputPayload?: Record<string, unknown>;
  resultImageUrls?: string[];
  errorMessage?: string | null;
  externalTaskId?: string | null;
  sourceImageUrl?: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function isGuestUserPhone(phone: string) {
  return phone.startsWith("guest_");
}

function mapSeatRecord(row: SeatRecordRow): SeatRecordSummary {
  return {
    id: row.id,
    createdAt: row.created_at,
    result: row.result_snapshot,
  };
}

function mapImageTask(row: ImageTaskRow): ImageTaskSummary {
  return {
    id: row.id,
    taskType: row.task_type,
    status: row.status,
    creditsCost: row.credits_cost,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    externalTaskId: row.external_task_id,
    resultImageUrls: row.result_image_urls ?? [],
    errorMessage: row.error_message,
  };
}

export async function getUserDrafts(userId: string) {
  const row = await selectSingle<UserProfileDraftRow>(
    `user_profiles?select=user_id,nickname,avatar_url,last_profile_draft,last_environment_draft&user_id=eq.${userId}`,
  );

  return {
    profileDraft: row?.last_profile_draft ?? null,
    environmentDraft: row?.last_environment_draft ?? null,
  };
}

export async function saveUserDrafts(
  userId: string,
  payload: {
    profileDraft?: ProfileDraft | null;
    environmentDraft?: EnvironmentDraft | null;
  },
) {
  const patch: Record<string, unknown> = {
    updated_at: nowIso(),
  };

  if (payload.profileDraft !== undefined) {
    patch.last_profile_draft = payload.profileDraft;
  }

  if (payload.environmentDraft !== undefined) {
    patch.last_environment_draft = payload.environmentDraft;
  }

  const [row] = await patchRows<UserProfileDraftRow>(
    `user_profiles?user_id=eq.${userId}`,
    patch,
  );

  return row;
}

export async function updateUserProfile(
  userId: string,
  payload: {
    nickname?: string;
    avatarUrl?: string | null;
  },
) {
  const patch: Record<string, unknown> = {
    updated_at: nowIso(),
  };

  if (payload.nickname !== undefined) {
    patch.nickname = payload.nickname.trim() || "未命名用户";
  }

  if (payload.avatarUrl !== undefined) {
    patch.avatar_url = payload.avatarUrl;
  }

  const [row] = await patchRows<UserProfileDraftRow>(
    `user_profiles?user_id=eq.${userId}`,
    patch,
  );

  return row;
}

export async function createSeatRecord(userId: string, result: ResultData) {
  const [row] = await insertRows<SeatRecordRow>("seat_records", {
    user_id: userId,
    client_result_id: result.id,
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
    result_snapshot: result,
    updated_at: nowIso(),
  });

  return mapSeatRecord(row);
}

export async function listSeatRecords(userId: string, limit = 20) {
  const rows = await selectList<SeatRecordRow>(
    `seat_records?select=id,created_at,result_snapshot&user_id=eq.${userId}&order=created_at.desc&limit=${limit}`,
  );
  return rows.map(mapSeatRecord);
}

export async function getSeatRecord(userId: string, recordId: string) {
  const row = await selectSingle<SeatRecordRow>(
    `seat_records?select=id,created_at,result_snapshot&id=eq.${recordId}&user_id=eq.${userId}`,
  );
  return row ? mapSeatRecord(row) : null;
}

async function readCreditRow(userId: string) {
  const row = await selectSingle<UserCreditRow>(
    `user_credits?select=user_id,balance,total_granted,total_used,total_refunded&user_id=eq.${userId}`,
  );

  if (!row) {
    throw new Error("额度账户不存在。");
  }

  return row;
}

export async function getCreditSummary(userId: string): Promise<UserCreditSummary> {
  const row = await readCreditRow(userId);
  return {
    balance: row.balance,
    totalGranted: row.total_granted,
    totalUsed: row.total_used,
    totalRefunded: row.total_refunded,
  };
}

export async function consumeCredits(
  userId: string,
  amount: number,
  category: string,
  relatedTaskId?: string | null,
) {
  if (amount <= 0) {
    return getCreditSummary(userId);
  }

  const current = await readCreditRow(userId);

  if (current.balance < amount) {
    throw new Error("额度不足，请先补充额度后再继续。");
  }

  const nextBalance = current.balance - amount;
  const nextUsed = current.total_used + amount;

  await patchRows<UserCreditRow>(`user_credits?user_id=eq.${userId}`, {
    balance: nextBalance,
    total_used: nextUsed,
    updated_at: nowIso(),
  });

  await insertRows("credit_transactions", {
    user_id: userId,
    amount: -amount,
    balance_after: nextBalance,
    category,
    related_task_id: relatedTaskId ?? null,
  });

  return {
    balance: nextBalance,
    totalGranted: current.total_granted,
    totalUsed: nextUsed,
    totalRefunded: current.total_refunded,
  } satisfies UserCreditSummary;
}

export async function refundCredits(
  userId: string,
  amount: number,
  category: string,
  relatedTaskId?: string | null,
) {
  if (amount <= 0) {
    return getCreditSummary(userId);
  }

  const current = await readCreditRow(userId);
  const nextBalance = current.balance + amount;
  const nextRefunded = current.total_refunded + amount;

  await patchRows<UserCreditRow>(`user_credits?user_id=eq.${userId}`, {
    balance: nextBalance,
    total_refunded: nextRefunded,
    updated_at: nowIso(),
  });

  await insertRows("credit_transactions", {
    user_id: userId,
    amount,
    balance_after: nextBalance,
    category,
    related_task_id: relatedTaskId ?? null,
  });

  return {
    balance: nextBalance,
    totalGranted: current.total_granted,
    totalUsed: current.total_used,
    totalRefunded: nextRefunded,
  } satisfies UserCreditSummary;
}

export async function grantCredits(
  userId: string,
  amount: number,
  category: string,
  note?: string | null,
) {
  if (amount <= 0) {
    throw new Error("赠送额度必须大于 0。");
  }

  const current = await readCreditRow(userId);
  const nextBalance = current.balance + amount;
  const nextGranted = current.total_granted + amount;

  await patchRows<UserCreditRow>(`user_credits?user_id=eq.${userId}`, {
    balance: nextBalance,
    total_granted: nextGranted,
    updated_at: nowIso(),
  });

  await insertRows("credit_transactions", {
    user_id: userId,
    amount,
    balance_after: nextBalance,
    category,
    metadata: note ? { note } : {},
  });

  return {
    balance: nextBalance,
    totalGranted: nextGranted,
    totalUsed: current.total_used,
    totalRefunded: current.total_refunded,
  } satisfies UserCreditSummary;
}

export async function createImageTask(input: ImageTaskCreateInput) {
  const [row] = await insertRows<ImageTaskRow>("image_tasks", {
    user_id: input.userId,
    seat_record_id: input.seatRecordId ?? null,
    task_type: input.taskType,
    status: input.status ?? "pending",
    credits_cost: input.creditsCost,
    external_task_id: input.externalTaskId ?? null,
    source_file_name: input.sourceFileName ?? null,
    source_image_url: input.sourceImageUrl ?? null,
    input_payload: input.inputPayload ?? {},
    output_payload: input.outputPayload ?? {},
    result_image_urls: input.resultImageUrls ?? [],
    error_message: input.errorMessage ?? null,
    updated_at: nowIso(),
  });

  return mapImageTask(row);
}

export async function getImageTaskByExternalTaskId(userId: string, externalTaskId: string) {
  const row = await selectSingle<ImageTaskRow>(
    `image_tasks?select=id,task_type,status,credits_cost,created_at,updated_at,external_task_id,result_image_urls,error_message,credits_refunded_at&user_id=eq.${userId}&external_task_id=eq.${externalTaskId}`,
  );
  return row ? { raw: row, task: mapImageTask(row) } : null;
}

export async function updateImageTaskByExternalTaskId(
  userId: string,
  externalTaskId: string,
  patch: ImageTaskPatchInput,
) {
  const payload: Record<string, unknown> = {
    updated_at: nowIso(),
  };

  if (patch.status !== undefined) {
    payload.status = patch.status;
  }

  if (patch.outputPayload !== undefined) {
    payload.output_payload = patch.outputPayload;
  }

  if (patch.resultImageUrls !== undefined) {
    payload.result_image_urls = patch.resultImageUrls;
  }

  if (patch.errorMessage !== undefined) {
    payload.error_message = patch.errorMessage;
  }

  if (patch.externalTaskId !== undefined) {
    payload.external_task_id = patch.externalTaskId;
  }

  if (patch.sourceImageUrl !== undefined) {
    payload.source_image_url = patch.sourceImageUrl;
  }

  const [row] = await patchRows<ImageTaskRow>(
    `image_tasks?user_id=eq.${userId}&external_task_id=eq.${externalTaskId}`,
    payload,
  );

  return row ? mapImageTask(row) : null;
}

export async function updateImageTaskById(taskId: string, patch: ImageTaskPatchInput) {
  const payload: Record<string, unknown> = {
    updated_at: nowIso(),
  };

  if (patch.status !== undefined) {
    payload.status = patch.status;
  }

  if (patch.outputPayload !== undefined) {
    payload.output_payload = patch.outputPayload;
  }

  if (patch.resultImageUrls !== undefined) {
    payload.result_image_urls = patch.resultImageUrls;
  }

  if (patch.errorMessage !== undefined) {
    payload.error_message = patch.errorMessage;
  }

  if (patch.externalTaskId !== undefined) {
    payload.external_task_id = patch.externalTaskId;
  }

  if (patch.sourceImageUrl !== undefined) {
    payload.source_image_url = patch.sourceImageUrl;
  }

  const [row] = await patchRows<ImageTaskRow>(
    `image_tasks?id=eq.${taskId}`,
    payload,
  );

  return row ? mapImageTask(row) : null;
}

export async function markImageTaskRefunded(taskId: string) {
  const [row] = await patchRows<ImageTaskRow>(
    `image_tasks?id=eq.${taskId}&credits_refunded_at=is.null`,
    {
      credits_refunded_at: nowIso(),
      updated_at: nowIso(),
    },
  );

  return row ?? null;
}

export async function listImageTasks(userId: string, limit = 30) {
  const rows = await selectList<ImageTaskRow>(
    `image_tasks?select=id,task_type,status,credits_cost,created_at,updated_at,external_task_id,result_image_urls,error_message,credits_refunded_at&user_id=eq.${userId}&order=created_at.desc&limit=${limit}`,
  );

  return rows.map(mapImageTask);
}

export async function getUserOverview(userId: string): Promise<UserOverviewResponse> {
  const [user, profile, credits, seatRecords, imageTasks] = await Promise.all([
    selectSingle<UserRow>(`users?select=id,phone&id=eq.${userId}`),
    selectSingle<UserProfileDraftRow>(
      `user_profiles?select=user_id,nickname,avatar_url,last_profile_draft,last_environment_draft&user_id=eq.${userId}`,
    ),
    readCreditRow(userId),
    listSeatRecords(userId, 5),
    listImageTasks(userId, 5),
  ]);

  if (!user || !profile) {
    throw new Error("用户资料不存在。");
  }

  return {
    authenticated: true,
    user: {
      id: user.id,
      phone: user.phone,
      phoneMasked: maskPhone(user.phone),
      nickname: profile.nickname,
      avatarUrl: profile.avatar_url,
      isGuest: isGuestUserPhone(user.phone),
    },
    credits: {
      balance: credits.balance,
      totalGranted: credits.total_granted,
      totalUsed: credits.total_used,
      totalRefunded: credits.total_refunded,
    },
    profileDraft: profile.last_profile_draft,
    environmentDraft: profile.last_environment_draft,
    recentRecords: seatRecords,
    recentImageTasks: imageTasks,
  };
}

export async function getUserRecords(userId: string): Promise<UserRecordsResponse> {
  const [seatRecords, imageTasks] = await Promise.all([
    listSeatRecords(userId, 50),
    listImageTasks(userId, 50),
  ]);

  return {
    seatRecords,
    imageTasks,
  };
}
