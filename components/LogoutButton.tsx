"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      className="paper-pill-button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
          });
          router.replace("/login");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "退出中..." : "退出登录"}
    </button>
  );
}
