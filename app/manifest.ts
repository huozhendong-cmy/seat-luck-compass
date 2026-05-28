import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "今日座位罗盘",
    short_name: "座位罗盘",
    description: "入场前测一测，生成你的今日推荐座位和状态提醒卡。",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f0e6",
    theme_color: "#31584a",
    lang: "zh-CN",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
