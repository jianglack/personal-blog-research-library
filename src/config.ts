/**
 * Internal resolved configuration used throughout the codebase.
 *
 * Prefer editing `astro-paper.config.ts` instead of this file. This module exists to
 * apply defaults and expose a fully-resolved config shape (`ResolvedAstroPaperConfig`).
 */
import userConfig from "@/astro-paper.config";
import type { ResolvedAstroPaperConfig } from "./types/config";
import { PUBLIC_GOOGLE_SITE_VERIFICATION } from "astro:env/client";

const DEFAULT_OG_IMAGE = "default-og.jpg";

const config: ResolvedAstroPaperConfig = {
  site: {
    ...userConfig.site,
    ogImage: userConfig.site.ogImage ?? DEFAULT_OG_IMAGE,
    lang: userConfig.site.lang ?? "en",
    timezone: userConfig.site.timezone ?? "UTC",
    dir: userConfig.site.dir ?? "ltr",
    googleVerification:
      userConfig.site.googleVerification || PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  posts: {
    perPage: userConfig.posts?.perPage ?? 4,
    perIndex: userConfig.posts?.perIndex ?? 4,
    scheduledPostMargin:
      userConfig.posts?.scheduledPostMargin ?? 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: userConfig.features?.lightAndDarkMode ?? true,
    dynamicOgImage: userConfig.features?.dynamicOgImage ?? true,
    showArchives: userConfig.features?.showArchives ?? true,
    showBackButton: userConfig.features?.showBackButton ?? true,
    editPost: userConfig.features?.editPost ?? { enabled: false },
    search: userConfig.features?.search ?? "pagefind",
  },
  socials: userConfig.socials ?? [],
  shareLinks: userConfig.shareLinks ?? [],
};

export const SITE = {
  website: config.site.url,
  author: config.site.author,
  profile: config.site.profile ?? config.site.url,
  desc: config.site.description,
  title: config.site.title,
  ogImage: config.site.ogImage,
  lightAndDarkMode: config.features.lightAndDarkMode,
  postPerIndex: config.posts.perIndex,
  postPerPage: config.posts.perPage,
  scheduledPostMargin: config.posts.scheduledPostMargin,
  showArchives: config.features.showArchives,
  showBackButton: config.features.showBackButton,
  editPost: {
    enabled: config.features.editPost.enabled,
    text: "编辑页面",
    url: config.features.editPost.enabled ? config.features.editPost.url : "",
  },
  dynamicOgImage: config.features.dynamicOgImage,
  dir: config.site.dir,
  lang: config.site.lang,
  timezone: config.site.timezone,
} as const;

export default config;
