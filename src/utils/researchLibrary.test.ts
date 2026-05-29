import { describe, expect, it } from "vitest";
import {
  assertKnownReferences,
  filterPublicEntries,
  getSeriesEntries,
  sortByDateDesc,
} from "./researchLibrary";

const entries = [
  {
    id: "older",
    data: { title: "Older", date: new Date("2026-01-01"), draft: false },
  },
  {
    id: "draft",
    data: { title: "Draft", date: new Date("2026-05-01"), draft: true },
  },
  {
    id: "newer",
    data: { title: "Newer", date: new Date("2026-05-28"), draft: false },
  },
];

describe("research library utilities", () => {
  it("filters draft entries", () => {
    expect(filterPublicEntries(entries).map(entry => entry.id)).toEqual([
      "older",
      "newer",
    ]);
  });

  it("sorts entries by date descending", () => {
    expect(sortByDateDesc(filterPublicEntries(entries)).map(entry => entry.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("returns series entries in explicit order", () => {
    const ordered = getSeriesEntries(["newer", "older"], entries);
    expect(ordered.map(entry => entry.id)).toEqual(["newer", "older"]);
  });

  it("throws when a series references a missing post", () => {
    expect(() => getSeriesEntries(["missing"], entries)).toThrow(
      "Series references missing post: missing"
    );
  });

  it("throws when an entry references an unknown topic", () => {
    expect(() =>
      assertKnownReferences({
        entryId: "post-a",
        fieldName: "topics",
        referencedSlugs: ["llm-reasoning", "missing-topic"],
        knownSlugs: ["llm-reasoning"],
      })
    ).toThrow("post-a references unknown topics: missing-topic");
  });
});
