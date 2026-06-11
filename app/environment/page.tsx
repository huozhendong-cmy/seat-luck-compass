"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppScaffold } from "@/components/AppScaffold";
import { PaperIcon } from "@/components/PaperIcon";
import { PaperCompass } from "@/components/PaperCompass";
import {
  type EnvironmentDraft,
  type ProfileDraft,
} from "@/lib/types";

const defaultEnvironment: EnvironmentDraft = {
  doorPosition: "左前",
  windowPosition: "没有窗",
  availableSeats: ["靠墙"],
  light: "柔和",
  noise: "安静",
};

const rows = [
  {
    key: "scene",
    index: 1,
    label: "场景类型",
    options: [
      { label: "棋牌室", icon: "record" },
      { label: "茶室", icon: "leaf" },
      { label: "家局", icon: "home" },
      { label: "朋友局", icon: "people" },
    ],
  },
  {
    key: "scale",
    index: 2,
    label: "人数规模",
    options: [
      { label: "4人", icon: "user" },
      { label: "6人", icon: "user" },
      { label: "8人", icon: "people" },
      { label: "10人+", icon: "people" },
    ],
  },
  {
    key: "seats",
    index: 3,
    label: "空间特征",
    options: [
      { label: "靠窗", icon: "window" },
      { label: "靠门", icon: "door" },
      { label: "中央", icon: "target" },
      { label: "包厢", icon: "corner" },
    ],
  },
  {
    key: "noise",
    index: 4,
    label: "氛围节奏",
    options: [
      { label: "安静", icon: "leaf" },
      { label: "适中", icon: "shield" },
      { label: "热闹", icon: "sun" },
      { label: "紧凑", icon: "history" },
    ],
  },
  {
    key: "focus",
    index: 5,
    label: "位置偏好",
    options: [
      { label: "看全场", icon: "eye" },
      { label: "靠边", icon: "corner" },
      { label: "居中", icon: "target" },
      { label: "方便进出", icon: "door" },
    ],
  },
] as const;

type UiSelections = Record<(typeof rows)[number]["key"], string>;

const defaultUiSelections: UiSelections = {
  scene: "棋牌室",
  scale: "4人",
  seats: "包厢",
  noise: "安静",
  focus: "看全场",
};

const rowDescriptions: Record<(typeof rows)[number]["key"], string> = {
  scene: "先判断今天这场局的外部氛围，后面的推荐才不会飘。",
  scale: "人数不同，视线、节奏和安全位的判断也会不同。",
  seats: "空间边缘、中央和门窗关系，会直接改变推荐方位。",
  noise: "同样的位置，在安静局和热闹局里的意义不一样。",
  focus: "先定你要看全场、靠边还是方便进出，再去选位。",
};

type EnvironmentSectionProps = {
  index: number;
  title: string;
  caption: string;
  children: ReactNode;
};

function EnvironmentSection({ index, title, caption, children }: EnvironmentSectionProps) {
  return (
    <div className="formCard">
      <div className="formCardHeader">
        <span className="cardIndex">{index}</span>
        <div className="formCardHeading">
          <div className="cardTitle">{title}</div>
          <p className="cardCaption">{caption}</p>
        </div>
      </div>
      <div className="formCardBody">{children}</div>
    </div>
  );
}

function mapUiToEnvironment(selection: UiSelections): EnvironmentDraft {
  return {
    doorPosition:
      selection.focus === "方便进出"
        ? "右前"
        : selection.focus === "看全场"
          ? "正前"
          : "左前",
    windowPosition: selection.seats === "靠窗" ? "左边" : "没有窗",
    availableSeats:
      selection.seats === "靠门"
        ? ["靠门", "背门"]
        : selection.seats === "靠窗"
          ? ["窗边", "靠墙"]
          : selection.focus === "居中"
            ? ["靠墙", "正对门"]
            : ["靠墙"],
    light: selection.seats === "靠窗" ? "刺眼" : "柔和",
    noise:
      selection.noise === "热闹"
        ? "嘈杂"
        : selection.noise === "适中"
          ? "一般"
          : "安静",
  };
}

export default function EnvironmentPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDraft | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selection, setSelection] = useState<UiSelections>(defaultUiSelections);

  const environment = mapUiToEnvironment(selection);

  useEffect(() => {
    let active = true;

    async function loadDrafts() {
      try {
        const response = await fetch("/api/user/drafts", { cache: "no-store" });
        const data = (await response.json()) as {
          error?: string;
          profileDraft?: ProfileDraft | null;
          environmentDraft?: EnvironmentDraft | null;
        };

        if (!response.ok) {
          throw new Error(data.error || "读取草稿失败。");
        }

        if (!data.profileDraft) {
          router.replace("/form");
          return;
        }

        if (!active) {
          return;
        }

        setProfile(data.profileDraft);
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "读取草稿失败。");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDrafts();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <AppScaffold
      title="选择环境"
      subtitle="座位仪轨 · 第 2 步"
      ornamentedTitle
      activeNav="compass"
      leftSlot={
        <Link href="/form" className="paper-icon-button" aria-label="返回上一步">
          ‹
        </Link>
      }
    >
      <section className="paper-hero">
        <div className="paper-hero-stage paper-environment-stage">
          <PaperCompass
            size="md"
            className="paper-environment-hero-compass"
            showPalm={false}
            showDirections={false}
            showBranches={false}
            showCoreDots={false}
          />
        </div>
        <div className="paper-step-line">
          <span className="paper-step-badge">2</span>
          <span>第 2 步</span>
        </div>
        <h2 className="paper-display-title">选择环境</h2>
        <p className="paper-description">
          补充空间与场景信息，帮助罗盘进一步判断。
        </p>
        <div className="paper-summary-strip paper-summary-strip-3 paper-environment-summary">
          <div className="paper-summary-item">
            <strong>门位</strong>
            <span>{environment.doorPosition}</span>
          </div>
          <div className="paper-summary-item">
            <strong>窗位</strong>
            <span>{environment.windowPosition}</span>
          </div>
          <div className="paper-summary-item">
            <strong>节奏</strong>
            <span>{environment.noise}</span>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-5 rounded-[18px] bg-[rgba(247,225,217,0.72)] px-4 py-3 text-sm text-[#8f5c4a]">
          {error}
        </div>
      ) : null}

      <section className="mt-8 space-y-4">
        {rows.map((row) => (
          <EnvironmentSection
            key={row.key}
            index={row.index}
            title={row.label}
            caption={rowDescriptions[row.key]}
          >
            <div className="paper-chip-grid">
                {row.options.map((option) => {
                  const active = selection[row.key] === option.label;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      className={`paper-chip ${active ? "active" : ""}`}
                      onClick={() => setSelection((prev) => ({ ...prev, [row.key]: option.label }))}
                    >
                      <PaperIcon name={option.icon} className="text-[18px]" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
            </div>
          </EnvironmentSection>
        ))}
      </section>

      <section className="paper-panel paper-environment-note mt-6 px-5 py-5">
        <div className="paper-panel-title text-[26px]">当前场域判断</div>
        <div className="paper-environment-note-grid">
          <div>
            <strong>可参考位置</strong>
            <p>{environment.availableSeats.join(" / ")}</p>
          </div>
          <div>
            <strong>光线感受</strong>
            <p>{environment.light}</p>
          </div>
          <div>
            <strong>整体氛围</strong>
            <p>{environment.noise}</p>
          </div>
        </div>
      </section>

      <div className="mt-7">
        <button
          type="button"
          disabled={loading || submitting}
          className="paper-primary-cta disabled:cursor-not-allowed"
          onClick={async () => {
            if (!profile) {
              router.push("/form");
              return;
            }

            setSubmitting(true);
            setError("");

            try {
              const response = await fetch("/api/user/drafts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  profileDraft: profile,
                  environmentDraft: environment,
                }),
              });
              const data = (await response.json()) as { error?: string };
              if (!response.ok) {
                throw new Error(data.error || "保存环境失败。");
              }

              router.push("/analyze");
            } catch (requestError) {
              setError(requestError instanceof Error ? requestError.message : "保存环境失败。");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? "保存中..." : "继续上传座位图 ✦"}
        </button>
      </div>
    </AppScaffold>
  );
}
