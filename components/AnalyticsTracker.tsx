"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const trackedPathRef = useRef("");

  useEffect(() => {
    if (!pathname || trackedPathRef.current === pathname) {
      return;
    }

    trackedPathRef.current = pathname;

    trackEvent({
      eventName: "page_view",
      path: pathname,
      metadata: {
        title: document.title,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
    });
  }, [pathname]);

  return null;
}
