import type { ResultData } from "@/lib/types";

export function syncSubmissionRecord(result: ResultData) {
  const payload = JSON.stringify({ result });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon("/api/submissions", blob)) {
      return;
    }
  }

  void fetch("/api/submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // 后台记录失败时不打断主流程。
  });
}
