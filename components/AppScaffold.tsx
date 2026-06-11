"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PaperIcon } from "@/components/PaperIcon";

type NavKey = "home" | "compass" | "records" | "me";

type AppScaffoldProps = {
  title: string;
  subtitle?: string;
  ornamentedTitle?: boolean;
  activeNav?: NavKey;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  children: ReactNode;
};

const navItems: Array<{ key: NavKey; label: string; href: string; icon: "home" | "compass" | "record" | "user" }> = [
  { key: "home", label: "首页", href: "/", icon: "home" },
  { key: "compass", label: "罗盘", href: "/form", icon: "compass" },
  { key: "records", label: "记录", href: "/records", icon: "record" },
  { key: "me", label: "我的", href: "/me", icon: "user" },
];

function MiniProgramCapsule() {
  return (
    <div className="mini-capsule">
      <span />
      <span />
      <span />
      <span className="mini-capsule-ring" />
    </div>
  );
}

export function AppScaffold({
  title,
  subtitle,
  ornamentedTitle = false,
  activeNav,
  leftSlot,
  rightSlot,
  children,
}: AppScaffoldProps) {
  return (
    <main className="paper-app-shell">
      <header className="paper-topbar">
        <div className="paper-topbar-side">{leftSlot}</div>
        <div className="paper-topbar-center">
          {subtitle ? <div className="paper-topbar-subtitle">{subtitle}</div> : null}
          <h1 className={ornamentedTitle ? "ornamented" : ""}>
            {ornamentedTitle ? <span className="paper-title-ornament" /> : null}
            <span>{title}</span>
            {ornamentedTitle ? <span className="paper-title-ornament mirror" /> : null}
          </h1>
        </div>
        <div className="paper-topbar-side justify-end">{rightSlot ?? <MiniProgramCapsule />}</div>
      </header>

      <div className="paper-app-content main-content">{children}</div>

      {activeNav ? (
        <nav className="paper-bottom-nav">
          {navItems.map((item) => {
            const active = item.key === activeNav;

            return (
              <Link key={item.key} href={item.href} className={`paper-bottom-item ${active ? "active" : ""}`}>
                <span className="paper-bottom-icon"><PaperIcon name={item.icon} /></span>
                <span>{item.label}</span>
                <i className="paper-bottom-indicator" />
              </Link>
            );
          })}
        </nav>
      ) : null}
    </main>
  );
}
