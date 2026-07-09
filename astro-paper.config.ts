import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://louisjiang.pages.dev/",
    title: "LouisJiang",
    description: "Technical notes, writing, and personal reflections.",
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
    lightAndDarkMode: false,
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
    {
      name: "mail",
      url: "mailto:?subject=Sharing this post&body=",
    },
  ],
});
