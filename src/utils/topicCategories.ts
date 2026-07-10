import topicCategoryConfig from "@/data/topicCategories.json";

export interface TopicCategory {
  slug: string;
  label: string;
  description: string;
  patterns: string[];
}

export interface CategorizedPostData {
  title?: string;
  description?: string;
  tags?: string[];
  topics?: string[];
}

export const topicCategories = topicCategoryConfig.categories as TopicCategory[];

export function getTopicCategoryBySlug(slug: string): TopicCategory | undefined {
  return topicCategories.find(category => category.slug === slug);
}

export function getTopicCategory(post: CategorizedPostData): TopicCategory {
  const text = [
    post.title ?? "",
    post.description ?? "",
    ...(post.tags ?? []),
    ...(post.topics ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return (
    topicCategories.find(category =>
      category.patterns.some(pattern => text.includes(pattern.toLowerCase()))
    ) ?? topicCategories.find(category => category.slug === "writing") ?? topicCategories[0]
  );
}
