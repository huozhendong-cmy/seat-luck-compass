import {
  doorPressureMap,
  goalAdviceMap,
  lightAdviceMap,
  moodStateMap,
  noiseAdviceMap,
  seatLabelOrder,
  seatTraditionalMap,
  zodiacColorMap,
  zodiacFolkMap,
} from "@/lib/constants";
import type { ResultData, SeatOption, TestInput } from "@/lib/types";

const baseSeatPriority: SeatOption[] = ["靠墙", "窗边", "靠门", "背门", "正对门"];

function formatBudgetValue(input: TestInput) {
  if (input.budgetOption === "自定义") {
    return input.customBudget.trim() || "自定义";
  }

  return input.budgetOption;
}

function isSensitiveMood(mood: TestInput["mood"] | "想翻本") {
  return mood === "急" || mood === "不甘心" || mood === "想翻本";
}

function pickRecommendedSeat(input: TestInput) {
  const available = [...input.availableSeats];

  if (available.includes("靠墙")) {
    return "靠墙";
  }

  const filtered = available.filter((seat) => {
    if (input.light === "刺眼" && seat === "窗边") {
      return false;
    }
    if (input.noise === "嘈杂" && seat === "靠门") {
      return false;
    }
    return seat !== "正对门" && seat !== "背门";
  });

  for (const seat of baseSeatPriority) {
    if (filtered.includes(seat)) {
      return seat;
    }
  }

  return filtered[0] ?? available[0] ?? "靠墙";
}

function pickDiscouragedSeats(input: TestInput, recommendedSeat: string) {
  const discouraged = new Set<SeatOption>();

  if (input.availableSeats.includes("正对门")) {
    discouraged.add("正对门");
  }

  if (input.availableSeats.includes("背门")) {
    discouraged.add("背门");
  }

  if (input.light === "刺眼" && input.availableSeats.includes("窗边")) {
    discouraged.add("窗边");
  }

  if (input.noise === "嘈杂" && input.availableSeats.includes("靠门")) {
    discouraged.add("靠门");
  }

  if (!discouraged.size && input.availableSeats.length > 1) {
    const fallback = input.availableSeats.find((seat) => seat !== recommendedSeat);
    if (fallback) {
      discouraged.add(fallback);
    }
  }

  return seatLabelOrder.filter((seat) => discouraged.has(seat)).join("、") || "无明显禁忌位";
}

function buildReason(input: TestInput, recommendedSeat: string, discouragedSeat: string) {
  const lines = [
    `${moodStateMap[input.mood]} ${goalAdviceMap[input.goal]}`,
    `${noiseAdviceMap[input.noise]} ${lightAdviceMap[input.light]}`,
    `${doorPressureMap[input.doorPosition]} 今天更适合坐在${recommendedSeat}。`,
  ];

  if (discouragedSeat !== "无明显禁忌位") {
    lines.push(`不建议优先考虑${discouragedSeat}，避免让环境因素放大波动。`);
  }

  return lines.join(" ");
}

function getMonthAtmosphere(month: number) {
  if (month >= 3 && month <= 5) {
    return "春月讲究气缓，位置宜柔和、安静，不必太贴近动线。";
  }

  if (month >= 6 && month <= 8) {
    return "夏月讲究避燥避炫，光线和热感太强时，更适合先取稳位。";
  }

  if (month >= 9 && month <= 11) {
    return "秋月偏重收敛和定神，位置越安稳，越容易把节奏守住。";
  }

  return "冬月讲究藏气和舒适感，背后有靠、少受穿行打扰会更顺手。";
}

function buildTraditionalNote(input: TestInput, recommendedSeat: string) {
  const seatNote = seatTraditionalMap[recommendedSeat as SeatOption] ?? "传统里偏爱坐得稳、少受扰的位置。";
  const moodLine =
    isSensitiveMood(input.mood)
      ? "传统说法里，心气浮的时候更忌坐在直冲、嘈杂、强光的位置。"
      : "传统看法里，先定坐位再定节奏，比一上来求快更重要。";

  return `${seatNote} ${getMonthAtmosphere(input.birthMonth)} ${moodLine}`;
}

function buildSceneReading(input: TestInput, recommendedSeat: string, discouragedSeat: string) {
  const observations = [
    `${doorPressureMap[input.doorPosition]}`,
    `${noiseAdviceMap[input.noise]}`,
    `${lightAdviceMap[input.light]}`,
    `综合这几个条件，今天更适合从${recommendedSeat}起坐。`,
  ];

  if (discouragedSeat !== "无明显禁忌位") {
    observations.push(`${discouragedSeat}更容易把外界干扰放大，不适合作为第一选择。`);
  }

  return observations.join(" ");
}

function buildTodayAvoid(input: TestInput, discouragedSeat: string) {
  const avoidList: string[] = [];

  if (discouragedSeat !== "无明显禁忌位") {
    avoidList.push(`今天宜先避开${discouragedSeat}。`);
  }

  if (isSensitiveMood(input.mood)) {
    avoidList.push("也宜避开任何会让你想立刻提速、立刻追回节奏的位置和状态。");
  }

  if (input.light === "刺眼") {
    avoidList.push("强光久坐容易让判断发飘，今天不宜硬扛。");
  }

  if (input.noise === "嘈杂") {
    avoidList.push("太贴近聊天和走动中心的位置，今天也不宜久坐。");
  }

  return avoidList.join(" ") || "今天没有特别强的禁忌位，仍然以先稳后动为宜。";
}

function buildFolkReminder(input: TestInput, recommendedSeat: string) {
  const zodiacLine = zodiacFolkMap[input.zodiac];
  const colorLine = `民俗上可把 ${zodiacColorMap[input.zodiac]} 当作今日顺手色，用来提醒自己先稳住节奏。`;
  const closingLine =
    recommendedSeat === "靠墙"
      ? "今天的讲究更偏向先坐稳、再观察，不求热闹，先求心定。"
      : "今天更讲究先把视线和节奏收住，再决定后面的动作。";

  return `${zodiacLine} ${colorLine} ${closingLine}`;
}

function buildScoreItems(input: TestInput, recommendedSeat: string) {
  const items = [
    {
      label: "稳定感",
      score: recommendedSeat === "靠墙" ? 92 : recommendedSeat === "窗边" ? 76 : 68,
      note:
        recommendedSeat === "靠墙"
          ? "背后有靠，更容易坐定和收神。"
          : "推荐位有一定支撑感，但仍要留意周边变化。",
    },
    {
      label: "光线舒适",
      score: input.light === "柔和" ? 90 : input.light === "偏暗" ? 74 : 58,
      note:
        input.light === "刺眼"
          ? "现场亮度偏冲，优先避开直照位。"
          : "当前光感整体可控，视线压力不算大。",
    },
    {
      label: "人流干扰",
      score:
        input.doorPosition === "背后"
          ? 70
          : input.doorPosition === "正前"
            ? 66
            : 82,
      note:
        input.doorPosition === "正前"
          ? "正前动线更容易分散注意力。"
          : "当前门口压力不算强，适合先稳住节奏。",
    },
    {
      label: "环境专注",
      score: input.noise === "安静" ? 92 : input.noise === "一般" ? 78 : 60,
      note:
        input.noise === "嘈杂"
          ? "周边声音偏多，建议减少额外互动。"
          : "环境噪音可接受，更适合按自己的步调来。",
    },
    {
      label: "状态边界",
      score: isSensitiveMood(input.mood) ? 55 : input.mood === "累" ? 68 : 86,
      note:
        isSensitiveMood(input.mood)
          ? "今天更需要先守边界，再决定是否加快节奏。"
          : "当前状态相对在线，先稳再动会更舒服。",
    },
  ];

  return items;
}

function buildOpeningAdvice(input: TestInput, recommendedSeat: string) {
  const advice = [
    `先在${recommendedSeat}位置坐定，前两轮以观察节奏和现场信息为主。`,
  ];

  if (input.goal === "娱乐") {
    advice.push("今天适合轻松进入状态，别急着拉高频率。");
  }

  if (input.goal === "冲刺") {
    advice.push("即使想积极一点，也建议把变化留到熟悉环境之后。");
  }

  if (input.noise === "嘈杂") {
    advice.push("尽量减少边聊边打，让注意力回到桌面。");
  }

  return advice.join("");
}

function buildStopLossReminder(input: TestInput) {
  const budgetText = formatBudgetValue(input);
  const reminders = [`把今天投入边界控制在 ${budgetText} 内，提前想好暂停节点。`];

  if (isSensitiveMood(input.mood)) {
    reminders.push("今天要刻意降低节奏、控制边界、不要冲动。");
  }

  if (input.mood === "累") {
    reminders.push("一旦出现连续分心或判断发飘，就先停一停。");
  }

  return reminders.join("");
}

function buildOpeningReminder(input: TestInput) {
  if (isSensitiveMood(input.mood)) {
    return "先稳住心气，再决定要不要继续加快节奏。";
  }

  if (input.noise === "嘈杂") {
    return "越热闹的时候，越要把自己的节奏放慢一点。";
  }

  if (input.light === "刺眼") {
    return "视线舒服比位置热闹更重要。";
  }

  return "今天适合先看局，再决定怎么出手。";
}

export function generateResult(input: TestInput): ResultData {
  const recommendedSeat = pickRecommendedSeat(input);
  const discouragedSeat = pickDiscouragedSeats(input, recommendedSeat);
  const scoreItems = buildScoreItems(input, recommendedSeat);
  const totalScore = Math.round(
    scoreItems.reduce((sum, item) => sum + item.score, 0) / scoreItems.length,
  );

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input,
    todayState: moodStateMap[input.mood],
    recommendedSeat,
    discouragedSeat,
    reason: buildReason(input, recommendedSeat, discouragedSeat),
    traditionalNote: buildTraditionalNote(input, recommendedSeat),
    sceneReading: buildSceneReading(input, recommendedSeat, discouragedSeat),
    todayAvoid: buildTodayAvoid(input, discouragedSeat),
    folkReminder: buildFolkReminder(input, recommendedSeat),
    openingAdvice: buildOpeningAdvice(input, recommendedSeat),
    stopLossReminder: buildStopLossReminder(input),
    luckyColor: zodiacColorMap[input.zodiac],
    openingReminder: buildOpeningReminder(input),
    totalScore,
    scoreItems,
  };
}
