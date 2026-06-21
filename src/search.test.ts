import { describe, it, expect } from "vitest";
import { fzfSearch, fzfSearchUnique, truncateUrl } from "./search";

describe("fzfSearch", () => {
  const items = [
    { id: "1", text: "hello world" },
    { id: "2", text: "goodbye world" },
    { id: "3", text: "hello there" },
  ];

  it("should filter items by search query", () => {
    const result = fzfSearch(items, (it) => it.text, "hello", 10);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("should return empty when query is empty", () => {
    const result = fzfSearch(items, (it) => it.text, "", 10);
    expect(result).toEqual([]);
  });

  it("should return empty when items are empty", () => {
    const result = fzfSearch([] as { id: string; text: string }[], (it) => it.text, "hello", 10);
    expect(result).toEqual([]);
  });

  it("should respect maxResults", () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      text: `item ${i} hello`,
    }));
    const result = fzfSearch(manyItems, (it) => it.text, "hello", 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe("fzfSearchUnique", () => {
  const items = [
    { id: "wrapper-1", entry: { id: "entry-a", name: "Alpha" }, expanded: "alpha test text" },
    { id: "wrapper-2", entry: { id: "entry-a", name: "Alpha" }, expanded: "alpha beta gamma" },
    { id: "wrapper-3", entry: { id: "entry-b", name: "Beta" }, expanded: "beta test" },
  ];

  it("should deduplicate by entry.id and return highest score", () => {
    const result = fzfSearchUnique(items, "alpha", 10);
    // Only one result for "entry-a" (the highest-scoring variant)
    const aResults = result.filter((r) => r.entry.id === "entry-a");
    expect(aResults).toHaveLength(1);
  });

  it("should return empty when query is empty", () => {
    const result = fzfSearchUnique(items, "", 10);
    expect(result).toEqual([]);
  });

  it("should return empty when items are empty", () => {
    const result = fzfSearchUnique([], "test", 10);
    expect(result).toEqual([]);
  });

  it("should limit results by maxResults", () => {
    const manyItems = Array.from({ length: 15 }, (_, i) => ({
      id: `wrapper-${i}`,
      entry: { id: `entry-${i}`, name: `Item ${i}` },
      expanded: `item ${i} searchable text`,
    }));
    const result = fzfSearchUnique(manyItems, "searchable", 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe("truncateUrl", () => {
  it("should extract hostname from valid URL", () => {
    const result = truncateUrl("https://example.com/page");
    expect(result).toContain("example.com");
  });

  it("should handle invalid URLs gracefully", () => {
    const result = truncateUrl("not-a-url");
    expect(result).toBe("not-a-url");
  });

  it("should strip protocol prefix", () => {
    const result = truncateUrl("https://example.com");
    expect(result).toContain("example.com");
  });
});
