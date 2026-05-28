"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OptionGrid } from "@/components/OptionGrid";
import { SeatPosterStudio } from "@/components/SeatPosterStudio";
import { SectionHeading } from "@/components/SectionHeading";
import { generateResult } from "@/lib/logic";
import {
  getEnvironmentDraft,
  getProfileDraft,
  saveCurrentResult,
  saveEnvironmentDraft,
} from "@/lib/storage";
import {
  doorOptions,
  lightOptions,
  noiseOptions,
  seatOptions,
  windowOptions,
  type EnvironmentDraft,
} from "@/lib/types";

const defaultEnvironment: EnvironmentDraft = {
  doorPosition: "左前",
  windowPosition: "没有窗",
  availableSeats: ["靠墙"],
  light: "柔和",
  noise: "安静",
};

export default function EnvironmentPage() {
  const router = useRouter();
  const [form, setForm] = useState<EnvironmentDraft>(defaultEnvironment);

  useEffect(() => {
    const profile = getProfileDraft();
    if (!profile) {
      router.replace("/form");
      return;
    }

    const saved = getEnvironmentDraft();
    if (saved) {
      setForm(saved);
    }
  }, [router]);

  useEffect(() => {
    saveEnvironmentDraft(form);
  }, [form]);

  const canSubmit = form.availableSeats.length > 0;

  return (
    <main className="page-wrap space-y-6">
      <div className="topbar fade-up">
        <div className="brand-mark">
          <div className="brand-seal" />
          <div className="brand-meta">
            <strong>Environment Step</strong>
            <span>第 2 步 · 判断现场环境</span>
          </div>
        </div>
      </div>

      <SectionHeading
        eyebrow="Environment"
        title="看看今天的环境"
        description="把门口、窗位、灯光和可选坐位补齐，系统会按你的状态去筛掉更容易分心的位置。"
      />

      <section className="glass-panel rounded-[32px] px-4 py-5">
        <div className="info-strip">
          <div className="info-chip">
            <strong>这一步看什么</strong>
            <span>更偏向环境舒适度判断，嘈杂、刺眼、正对门这类因素会被拉进不建议位。</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="field-shell">
            <div className="field-label">门口位置</div>
            <div className="field-caption">门口的人流感会影响你对位置稳定度的判断。</div>
            <OptionGrid
              options={doorOptions}
              value={form.doorPosition}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  doorPosition: value as EnvironmentDraft["doorPosition"],
                }))
              }
            />
          </div>

          <div className="field-shell">
            <div className="field-label">窗户位置</div>
            <div className="field-caption">如果现场光线偏强，窗位会在结果里被额外提醒。</div>
            <OptionGrid
              options={windowOptions}
              value={form.windowPosition}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  windowPosition: value as EnvironmentDraft["windowPosition"],
                }))
              }
            />
          </div>

          <div className="field-shell">
            <div className="field-label">可选座位</div>
            <div className="field-caption">可多选，系统会优先从这些位置里筛出更稳的一档。</div>
            <OptionGrid
              options={seatOptions}
              value={form.availableSeats}
              multiple
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  availableSeats: value as EnvironmentDraft["availableSeats"],
                }))
              }
              columns={3}
            />
            <p className="mt-3 text-sm leading-6 text-[rgba(101,112,105,0.78)]">
              可多选，至少选择一个位置。
            </p>
          </div>

          <div className="field-shell">
            <div className="field-label">灯光</div>
            <div className="field-caption">刺眼的光线会让结果更偏向避开窗边与强光位。</div>
            <OptionGrid
              options={lightOptions}
              value={form.light}
              onChange={(value) => setForm((prev) => ({ ...prev, light: value as EnvironmentDraft["light"] }))}
              columns={3}
            />
          </div>

          <div className="field-shell">
            <div className="field-label">现场环境</div>
            <div className="field-caption">如果比较嘈杂，结果会明显偏向安静、稳定的坐法。</div>
            <OptionGrid
              options={noiseOptions}
              value={form.noise}
              onChange={(value) => setForm((prev) => ({ ...prev, noise: value as EnvironmentDraft["noise"] }))}
              columns={3}
            />
          </div>
        </div>
      </section>

      <div className="control-bar">
        <button
          type="button"
          className="button-secondary h-14 text-sm"
          onClick={() => router.push("/form")}
        >
          返回上一步
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          className="button-primary h-14 text-sm disabled:cursor-not-allowed disabled:opacity-45"
          onClick={() => {
            const profile = getProfileDraft();
            if (!profile) {
              router.push("/form");
              return;
            }

            saveEnvironmentDraft(form);
            const result = generateResult({ ...profile, ...form });
            saveCurrentResult(result);
            router.push("/result");
          }}
        >
          生成结果卡
        </button>
      </div>

      <SeatPosterStudio embedded environment={form} />
    </main>
  );
}
