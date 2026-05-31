"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OptionGrid } from "@/components/OptionGrid";
import { SectionHeading } from "@/components/SectionHeading";
import { trackEvent } from "@/lib/analytics";
import { getProfileDraft, saveProfileDraft } from "@/lib/storage";
import {
  budgetOptions,
  goalOptions,
  moodOptions,
  zodiacOptions,
  type ProfileDraft,
} from "@/lib/types";

const defaultProfile: ProfileDraft = {
  zodiac: "鼠",
  birthMonth: 1,
  mood: "稳",
  budgetOption: "500",
  customBudget: "",
  goal: "娱乐",
};

const zodiacEmojiMap: Record<ProfileDraft["zodiac"], string> = {
  鼠: "🐭",
  牛: "🐮",
  虎: "🐯",
  兔: "🐰",
  龙: "🐲",
  蛇: "🐍",
  马: "🐴",
  羊: "🐑",
  猴: "🐵",
  鸡: "🐤",
  狗: "🐶",
  猪: "🐷",
};

export default function FormPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileDraft>(defaultProfile);

  useEffect(() => {
    const saved = getProfileDraft();
    if (saved) {
      setForm(saved);
    }
  }, []);

  const canSubmit = form.budgetOption !== "自定义" || !!form.customBudget.trim();

  return (
    <main className="page-wrap space-y-6">
      <div className="topbar fade-up">
        <div className="brand-mark">
          <div className="brand-seal" />
          <div className="brand-meta">
            <strong>Profile Step</strong>
            <span>第 1 步 · 校准今日状态</span>
          </div>
        </div>
      </div>

      <SectionHeading
        eyebrow="Profile"
        title="填入今日状态"
        description="先把心气、节奏边界和今天的目的说清楚，后面的座位建议才会更像一张有分寸的提醒卡。"
      />

      <section className="glass-panel rounded-[32px] px-4 py-5">
        <div className="info-strip">
          <div className="info-chip">
            <strong>这一步看什么</strong>
            <span>系统会根据你的状态先判断今天适合稳、缓还是更克制的进入方式。</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="field-shell">
            <div className="field-label">生肖</div>
            <div className="field-caption">作为结果卡里的幸运色参考，不涉及任何结果承诺。</div>
            <OptionGrid
              options={zodiacOptions}
              value={form.zodiac}
              onChange={(value) => setForm((prev) => ({ ...prev, zodiac: value as ProfileDraft["zodiac"] }))}
              columns={3}
              optionClassName="option-chip-zodiac"
              renderOption={(option, active) => (
                <span className="option-stack">
                  <span className={`option-emoji ${active ? "active" : ""}`}>{zodiacEmojiMap[option]}</span>
                  <span>{option}</span>
                </span>
              )}
            />
          </div>

          <div className="field-shell">
            <div className="field-label">出生月份</div>
            <div className="field-caption">只作为娱乐化状态标签的一部分。</div>
            <select
              className="text-input"
              value={form.birthMonth}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  birthMonth: Number(event.target.value),
                }))
              }
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month} className="bg-[#fffaf4] text-[#24342d]">
                  {month} 月
                </option>
              ))}
            </select>
          </div>

          <div className="field-shell">
            <div className="field-label">今日状态</div>
            <div className="field-caption">这里最影响结果语气，按你现在的真实感觉选就行。</div>
            <OptionGrid
              options={moodOptions}
              value={form.mood}
              onChange={(value) => setForm((prev) => ({ ...prev, mood: value as ProfileDraft["mood"] }))}
            />
          </div>

          <div className="field-shell">
            <div className="field-label">今日边界</div>
            <div className="field-caption">这组数字只用来生成节奏边界和收手提醒，不会展示成任何承诺性话术。</div>
            <OptionGrid
              options={budgetOptions}
              value={form.budgetOption}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  budgetOption: value as ProfileDraft["budgetOption"],
                }))
              }
              columns={3}
            />
            {form.budgetOption === "自定义" ? (
              <div className="mt-3">
                <input
                  className="text-input"
                  inputMode="numeric"
                  placeholder="输入你的边界值"
                  value={form.customBudget}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      customBudget: event.target.value.replace(/[^\d]/g, ""),
                    }))
                  }
                />
              </div>
            ) : null}
          </div>

          <div className="field-shell">
            <div className="field-label">今天目的</div>
            <div className="field-caption">决定结果卡更偏娱乐、稳定还是偏克制提醒。</div>
            <OptionGrid
              options={goalOptions}
              value={form.goal}
              onChange={(value) => setForm((prev) => ({ ...prev, goal: value as ProfileDraft["goal"] }))}
            />
          </div>
        </div>
      </section>

      <button
        type="button"
        disabled={!canSubmit}
        className="button-primary h-14 w-full text-base disabled:cursor-not-allowed disabled:opacity-45"
        onClick={() => {
          trackEvent({
            eventName: "profile_continue",
            metadata: {
              zodiac: form.zodiac,
              birthMonth: form.birthMonth,
              mood: form.mood,
              budgetOption: form.budgetOption,
              goal: form.goal,
            },
          });
          saveProfileDraft(form);
          router.push("/environment");
        }}
      >
        继续选择环境
        <span className="button-spark">✦</span>
      </button>
    </main>
  );
}
