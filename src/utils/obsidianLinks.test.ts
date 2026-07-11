import { describe, expect, it } from "vitest";
import { remarkObsidianLinks, transformWikiLinks } from "./obsidianLinks";

describe("transformWikiLinks", () => {
  it("converts known wiki links to markdown links", () => {
    expect(
      transformWikiLinks("Read [[llm-notes]].", {
        "llm-notes": "/series/llm-notes/",
      })
    ).toBe("Read [llm-notes](/series/llm-notes/).");
  });

  it("uses aliases when provided", () => {
    expect(
      transformWikiLinks("Read [[llm-notes|LLM notes]].", {
        "llm-notes": "/series/llm-notes/",
      })
    ).toBe("Read [LLM notes](/series/llm-notes/).");
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
          children: [{ type: "text", value: "Read [[llm-notes|LLM notes]]." }],
        },
      ],
    };

    const transform = remarkObsidianLinks({
      knownLinks: { "llm-notes": "/series/llm-notes/" },
    });
    transform(tree);

    expect(tree.children[0].children).toEqual([
      { type: "text", value: "Read " },
      {
        type: "link",
        url: "/series/llm-notes/",
        title: null,
        children: [{ type: "text", value: "LLM notes" }],
      },
      { type: "text", value: "." },
    ]);
  });

  it("leaves wiki syntax inside code and math nodes unchanged", () => {
    const tree = {
      type: "root",
      children: [
        { type: "code", value: "[[llm-notes]]" },
        {
          type: "paragraph",
          children: [
            { type: "inlineCode", value: "[[llm-notes]]" },
            { type: "inlineMath", value: "\\\\text{[[llm-notes]]}" },
          ],
        },
        { type: "math", value: "\\\\text{[[llm-notes]]}" },
      ],
    };

    const transform = remarkObsidianLinks({
      knownLinks: { "llm-notes": "/series/llm-notes/" },
    });
    transform(tree);

    expect(tree).toEqual({
      type: "root",
      children: [
        { type: "code", value: "[[llm-notes]]" },
        {
          type: "paragraph",
          children: [
            { type: "inlineCode", value: "[[llm-notes]]" },
            { type: "inlineMath", value: "\\\\text{[[llm-notes]]}" },
          ],
        },
        { type: "math", value: "\\\\text{[[llm-notes]]}" },
      ],
    });
  });
});
