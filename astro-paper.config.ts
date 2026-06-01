import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://louisjiang.pages.dev/",
    title: "LouisJiang",
    description: "记录技术学习、博客写作和自我感想随笔。",
    author: "louis",
    profile: "https://github.com/jianglack",
    ogImage: "og.png",
    lang: "zh",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 8,
    perIndex: 6,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/jianglack",
      linkTitle: "GitHub: jianglack",
    },
    {
      name: "mail",
      url: "mailto:zslouis8605@gmail.com",
      linkTitle: "Email: zslouis8605@gmail.com",
    },
  ],
  shareLinks: [
    { name: "mail", url: "mailto:?subject=%E5%88%86%E4%BA%AB%E8%BF%99%E7%AF%87%E6%96%87%E7%AB%A0&body=" },
  ],
});
