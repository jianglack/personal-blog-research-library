import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://personal-blog-research-library.pages.dev/",
    title: "研究笔记",
    description: "按文章、主题、系列和资源组织的长期技术笔记。",
    author: "研究笔记",
    profile: "https://personal-blog-research-library.pages.dev/",
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
  socials: [],
  shareLinks: [
    { name: "mail", url: "mailto:?subject=%E5%88%86%E4%BA%AB%E8%BF%99%E7%AF%87%E6%96%87%E7%AB%A0&body=" },
  ],
});
