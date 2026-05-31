"use client";

import type { AnalyticsEventName } from "@/lib/types";
import { getOrCreateSessionId, getOrCreateVisitorId } from "@/lib/storage";

type TrackEventInput = {
  eventName: AnalyticsEventName;
  path?: string;
  metadata?: Record<string, unknown>;
};

export function trackEvent({ eventName, path, metadata }: TrackEventInput) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({
    eventName,
    path: path ?? window.location.pathname,
    visitorId: getOrCreateVisitorId(),
    sessionId: getOrCreateSessionId(),
    createdAtClient: new Date().toISOString(),
    referrer: document.referrer || null,
    userAgent: navigator.userAgent,
    metadata: metadata ?? {},
  });

  if (typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon("/api/events", blob)) {
      return;
    }
  }

  void fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // 埋点失败时不打断页面主流程。
  });
}
