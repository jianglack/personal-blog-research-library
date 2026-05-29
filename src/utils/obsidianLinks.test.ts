import { describe, expect, it } from "vitest";
import { transformWikiLinks } from "./obsidianLinks";

describe("transformWikiLinks", () => {
  it("converts known wiki links to markdown links", () => {
    expect(
      transformWikiLinks("Read [[llm-reasoning]].", {
        "llm-reasoning": "/topics/llm-reasoning/",
      })
    ).toBe("Read [llm-reasoning](/topics/llm-reasoning/).");
  });

  it("uses aliases when provided", () => {
    expect(
      transformWikiLinks("Read [[llm-reasoning|LLM reasoning]].", {
        "llm-reasoning": "/topics/llm-reasoning/",
      })
    ).toBe("Read [LLM reasoning](/topics/llm-reasoning/).");
  });

  it("keeps missing wiki links readable", () => {
    expect(transformWikiLinks("Read [[missing-note]].", {})).toBe(
      "Read missing-note."
    );
  });
});
