import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";

const langSchema = z.enum(["zh", "en"]);

const sameDate = (left?: Date | null, right?: Date | null) =>
  !left || !right || left.getTime() === right.getTime();

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z
      .object({
        author: z.string().default(config.site.author),
        title: z.string(),
        date: z.coerce.date().optional(),
        updated: z.coerce.date().optional(),
        lang: langSchema.default("en"),
        description: z.string(),
        tags: z.array(z.string()).default([]),
        topics: z.array(z.string()).default([]),
        series: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
        featured: z.boolean().default(false),
        cover: z.string().optional(),
        pubDatetime: z.coerce.date().optional(),
        modDatetime: z.coerce.date().optional().nullable(),
        ogImage: image().or(z.string()).optional(),
        canonicalURL: z.string().optional(),
        hideEditPost: z.boolean().optional(),
        timezone: z.string().optional(),
      })
      .refine(data => data.date || data.pubDatetime, {
        message: "Post requires either date or pubDatetime",
      })
      .refine(data => sameDate(data.date, data.pubDatetime), {
        message: "Post date and pubDatetime must match when both are provided",
      })
      .refine(data => sameDate(data.updated, data.modDatetime), {
        message: "Post updated and modDatetime must match when both are provided",
      })
      .transform(data => {
        const date = data.date ?? data.pubDatetime ?? new Date(0);
        const updated = data.updated ?? data.modDatetime ?? undefined;

        return {
          ...data,
          date,
          updated,
          pubDatetime: data.pubDatetime ?? date,
          modDatetime: data.modDatetime ?? updated ?? null,
        };
      }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
  }),
});

const topics = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/topics" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: langSchema.default("en"),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    readingPath: z.array(z.string()).default([]),
    keyQuestions: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const series = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/series" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: langSchema.default("en"),
    posts: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/resources" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: langSchema.default("en"),
    type: z.enum(["paper", "book", "tool", "link", "note"]),
    url: z.url().optional(),
    topics: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  posts,
  pages,
  topics,
  series,
  resources,
};
