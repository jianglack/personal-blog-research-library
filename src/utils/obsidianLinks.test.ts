import { describe, expect, it } from "vitest";
import { remarkObsidianLinks, transformWikiLinks } from "./obsidianLinks";

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

describe("remarkObsidianLinks", () => {
  it("converts wiki links in text nodes to mdast link nodes", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", value: "Read [[llm-reasoning|LLM reasoning]]." }],
        },
      ],
    };

    const transform = remarkObsidianLinks({
      knownLinks: { "llm-reasoning": "/topics/llm-reasoning/" },
    });
    transform(tree);

    expect(tree.children[0].children).toEqual([
      { type: "text", value: "Read " },
      {
        type: "link",
        url: "/topics/llm-reasoning/",
        title: null,
        children: [{ type: "text", value: "LLM reasoning" }],
      },
      { type: "text", value: "." },
    ]);
  });

  it("leaves wiki syntax inside code and math nodes unchanged", () => {
    const tree = {
      type: "root",
      children: [
        { type: "code", value: "[[llm-reasoning]]" },
        {
          type: "paragraph",
          children: [
            { type: "inlineCode", value: "[[llm-reasoning]]" },
            { type: "inlineMath", value: "\\\\text{[[llm-reasoning]]}" },
          ],
        },
        { type: "math", value: "\\\\text{[[llm-reasoning]]}" },
      ],
    };

    const transform = remarkObsidianLinks({
      knownLinks: { "llm-reasoning": "/topics/llm-reasoning/" },
    });
    transform(tree);

    expect(tree).toEqual({
      type: "root",
      children: [
        { type: "code", value: "[[llm-reasoning]]" },
        {
          type: "paragraph",
          children: [
            { type: "inlineCode", value: "[[llm-reasoning]]" },
            { type: "inlineMath", value: "\\\\text{[[llm-reasoning]]}" },
          ],
        },
        { type: "math", value: "\\\\text{[[llm-reasoning]]}" },
      ],
    });
  });
});
