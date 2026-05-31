import type { EnvironmentDraft, ProfileDraft, ResultData } from "@/lib/types";

const PROFILE_KEY = "seat-luck-compass:profile";
const ENVIRONMENT_KEY = "seat-luck-compass:environment";
const CURRENT_RESULT_KEY = "seat-luck-compass:current-result";
const HISTORY_KEY = "seat-luck-compass:history";
const VISITOR_KEY = "seat-luck-compass:visitor-id";
const SESSION_KEY = "seat-luck-compass:session-id";

function canUseStorage() {
  return typeof window !== "undefined";
}

function normalizeProfileDraft(data: ProfileDraft | null) {
  if (!data) {
    return null;
  }

  const rawMood = (data as { mood?: string }).mood;

  return {
    ...data,
    mood: rawMood === "想翻本" ? "不甘心" : data.mood,
  } as ProfileDraft;
}

function normalizeResultData(result: ResultData) {
  return {
    ...result,
    input: normalizeProfileDraft(result.input) ?? result.input,
  } as ResultData;
}

export function saveProfileDraft(data: ProfileDraft) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

export function getProfileDraft() {
  if (!canUseStorage()) {
    return null;
  }

  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? normalizeProfileDraft(JSON.parse(raw) as ProfileDraft) : null;
}

export function saveEnvironmentDraft(data: EnvironmentDraft) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(ENVIRONMENT_KEY, JSON.stringify(data));
}

export function getEnvironmentDraft() {
  if (!canUseStorage()) {
    return null;
  }

  const raw = localStorage.getItem(ENVIRONMENT_KEY);
  return raw ? (JSON.parse(raw) as EnvironmentDraft) : null;
}

export function saveCurrentResult(result: ResultData) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(CURRENT_RESULT_KEY, JSON.stringify(result));
  const history = getHistory();
  const nextHistory = [result, ...history.filter((item) => item.id !== result.id)].slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
}

export function getCurrentResult() {
  if (!canUseStorage()) {
    return null;
  }

  const raw = localStorage.getItem(CURRENT_RESULT_KEY);
  return raw ? normalizeResultData(JSON.parse(raw) as ResultData) : null;
}

export function getHistory() {
  if (!canUseStorage()) {
    return [];
  }

  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? (JSON.parse(raw) as ResultData[]).map(normalizeResultData) : [];
}

function createClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `slc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateVisitorId() {
  if (!canUseStorage()) {
    return "";
  }

  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) {
    return existing;
  }

  const nextId = createClientId();
  localStorage.setItem(VISITOR_KEY, nextId);
  return nextId;
}

export function getOrCreateSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const nextId = createClientId();
  sessionStorage.setItem(SESSION_KEY, nextId);
  return nextId;
}
