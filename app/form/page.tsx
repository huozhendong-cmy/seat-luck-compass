"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppScaffold } from "@/components/AppScaffold";
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

type FormSectionProps = {
  index: number;
  title: string;
  caption: string;
  children: ReactNode;
};

function FormSection({ index, title, caption, children }: FormSectionProps) {
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

function FormLuopanHero() {
  const directions = [
    { label: "南", x: 140, y: 20 },
    { label: "西南", x: 223, y: 54 },
    { label: "西", x: 258, y: 140 },
    { label: "西北", x: 223, y: 226 },
    { label: "北", x: 140, y: 262 },
    { label: "东北", x: 56, y: 226 },
    { label: "东", x: 22, y: 140 },
    { label: "东南", x: 56, y: 54 },
  ] as const;

  return (
    <div className="luopanHero">
      <svg className="luopanSvg" viewBox="0 0 280 280" aria-hidden="true">
        <circle cx="140" cy="140" r="124" className="luopanOuterRing" />
        <circle cx="140" cy="140" r="96" className="luopanMidRing" />
        <circle cx="140" cy="140" r="68" className="luopanInnerRing" />

        {Array.from({ length: 8 }, (_, index) => (
          <line
            key={`axis-${index}`}
            x1="140"
            y1="18"
            x2="140"
            y2="262"
            className="luopanAxis"
            transform={`rotate(${index * 45} 140 140)`}
          />
        ))}

        {Array.from({ length: 16 }, (_, index) => (
          <circle
            key={`dot-${index}`}
            cx="140"
            cy="16"
            r={index % 2 === 0 ? 3.4 : 2}
            className="luopanStar"
            transform={`rotate(${index * 22.5} 140 140)`}
          />
        ))}

        {["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"].map((glyph, index) => (
          <text
            key={glyph}
            x="140"
            y="56"
            textAnchor="middle"
            className="luopanTrigram"
            transform={`rotate(${index * 45} 140 140)`}
          >
            {glyph}
          </text>
        ))}

        {directions.map((item) => (
          <text key={item.label} x={item.x} y={item.y} textAnchor="middle" className="luopanDirection">
            {item.label}
          </text>
        ))}
      </svg>

      <div className="palmBadge">
        <svg viewBox="0 0 160 160" className="palmIcon" aria-hidden="true">
          <path
            d="M78 33.5c4.4 0 8 3.6 8 8v32.2h3.8V25.9c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5v48.5h3.8V38.8c0-4.6 3.7-8.3 8.3-8.3s8.3 3.7 8.3 8.3v47.4h3.8V50.9c0-4.4 3.5-7.9 7.9-7.9 4.4 0 7.9 3.5 7.9 7.9v52c0 21.2-9.8 34.6-26.4 40.8-11.1 4.1-22.8 4.4-34.4 1.3-10.4-2.8-19.7-8.4-26.7-16.8L44.5 101c-5.2-6.1-4.4-15.2 1.7-20.4 6.1-5.2 15.2-4.4 20.4 1.7l10.7 12.5V41.5c0-4.4 3.6-8 8-8Z"
            fill="currentColor"
            transform="translate(-18 -10) scale(0.94)"
          />
        </svg>
      </div>
    </div>
  );
}

export default function FormPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileDraft>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDraft() {
      try {
        const response = await fetch("/api/user/drafts", { cache: "no-store" });
        const data = (await response.json()) as { error?: string; profileDraft?: ProfileDraft | null };

        if (!response.ok) throw new Error(data.error || "读取资料草稿失败。");
        if (active && data.profileDraft) setForm(data.profileDraft);
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "读取资料草稿失败。");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDraft();
    return () => {
      active = false;
    };
  }, []);

  const canSubmit = form.budgetOption !== "自定义" || !!form.customBudget.trim();

  return (
    <AppScaffold
      title="校准状态"
      subtitle="座位仪轨 · 第 1 步"
      ornamentedTitle
      activeNav="compass"
      leftSlot={
        <Link href="/" className="paper-icon-button" aria-label="返回首页">
          ‹
        </Link>
      }
    >
      <div className="paper-form-page">
        {process.env.NODE_ENV !== "production" ? <div className="designOverlay" aria-hidden="true" /> : null}

        <section className="paper-scenery paper-hero formHero">
          <div className="paper-hero-stage paper-form-stage">
            <FormLuopanHero />
          </div>
          <div className="formKicker">个人状态校准</div>
          <div className="stepRow">
            <span>〰</span>
            <span className="cardIndex">1</span>
            <span>第 1 步</span>
            <span>〰</span>
          </div>
          <h2 className="titleMain">校准状态</h2>
          <p className="subtitle">先校准状态，再选择环境，获得更适合的座位建议。</p>
          <div className="paper-summary-strip paper-summary-strip-3 paper-form-summary">
            <div className="paper-summary-item">
              <em>校准项</em>
              <strong>生肖</strong>
              <span>判断今天适合守、观还是推。</span>
            </div>
            <div className="paper-summary-item">
              <em>校准项</em>
              <strong>状态</strong>
              <span>让推荐位置跟上你当下节奏。</span>
            </div>
            <div className="paper-summary-item">
              <em>校准项</em>
              <strong>边界</strong>
              <span>先设上限，结果会更稳更清楚。</span>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mx-[28px] mt-2 rounded-[18px] bg-[rgba(247,225,217,0.72)] px-4 py-3 text-sm text-[#8f5c4a]">{error}</div>
        ) : null}

        <section className="space-y-0">
          <FormSection index={1} title="生肖" caption="用来判断今天更适合偏稳、偏守，还是主动出击。">
            <div className="optionGrid zodiac">
              {zodiacOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`optionChip ${form.zodiac === option ? "active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, zodiac: option }))}
                >
                  {option}
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection index={2} title="出生月份" caption="月份只做节奏校准，不会展示给其他人。">
            <div className="optionGrid months">
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <button
                  key={month}
                  type="button"
                  className={`optionChip ${form.birthMonth === month ? "active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, birthMonth: month }))}
                >
                  {month}月
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection index={3} title="今日状态" caption="状态不同，适合的位置也会不同，先如实选择。">
            <div className="optionGrid normal">
              {moodOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`optionChip ${form.mood === option ? "active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, mood: option }))}
                >
                  {option}
                </button>
              ))}
            </div>
          </FormSection>

          <FormSection index={4} title="今日边界" caption="先定上限，后面的推荐才会更稳，不容易失控。">
            <div className="space-y-3">
              <div className="optionGrid normal">
                {budgetOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`optionChip ${form.budgetOption === option ? "active" : ""}`}
                    onClick={() => setForm((prev) => ({ ...prev, budgetOption: option }))}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {form.budgetOption === "自定义" ? (
                <input
                  className="paper-inline-input mt-1 block h-[48px] w-full rounded-[18px] px-4 text-[18px] text-[#564530]"
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
              ) : null}
            </div>
          </FormSection>

          <FormSection index={5} title="今天目的" caption="偏娱乐、偏稳定还是偏冲刺，会影响推荐策略。">
            <div className="optionGrid normal">
              {goalOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`optionChip ${form.goal === option ? "active" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, goal: option }))}
                >
                  {option}
                </button>
              ))}
            </div>
          </FormSection>
        </section>

        <div className="mx-[28px] mt-7">
          <button
            type="button"
            disabled={!canSubmit || loading || saving}
            className="paper-primary-cta disabled:cursor-not-allowed"
            onClick={async () => {
              setSaving(true);
              setError("");
              try {
                const response = await fetch("/api/user/drafts", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ profileDraft: form }),
                });
                const data = (await response.json()) as { error?: string };
                if (!response.ok) throw new Error(data.error || "保存资料失败。");
                router.push("/environment");
              } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : "保存资料失败。");
              } finally {
                setSaving(false);
              }
            }}
          >
            {loading ? "读取中..." : saving ? "保存中..." : "继续选择环境 ✦"}
          </button>
        </div>
      </div>
    </AppScaffold>
  );
}
