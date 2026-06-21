import { describe, it, expect } from "vitest";
import { parseHelpfeelDescription, parseHelpfeelLines } from "./parse-helpfeel";

describe("parseHelpfeelDescription", () => {
  it("should parse a simple helpfeel line", () => {
    const result = parseHelpfeelDescription("? テスト");
    expect(result).toEqual({
      helpfeelText: "テスト",
      openUrl: undefined,
      copyText: undefined,
    });
  });

  it("should parse helpfeel with % open URL", () => {
    const desc = "? テスト\n% open https://example.com";
    const result = parseHelpfeelDescription(desc);
    expect(result).toEqual({
      helpfeelText: "テスト",
      openUrl: "https://example.com",
      copyText: undefined,
    });
  });

  it("should parse helpfeel with % copy text", () => {
    const desc = "? テスト\n% コピーするテキスト";
    const result = parseHelpfeelDescription(desc);
    expect(result).toEqual({
      helpfeelText: "テスト",
      openUrl: undefined,
      copyText: "コピーするテキスト",
    });
  });

  it("should parse helpfeel with both % open and % copy", () => {
    const desc = "? テスト\n% open https://example.com\n% コピーするテキスト";
    const result = parseHelpfeelDescription(desc);
    expect(result).toEqual({
      helpfeelText: "テスト",
      openUrl: "https://example.com",
      copyText: "コピーするテキスト",
    });
  });

  it("should return null for non-helpfeel descriptions", () => {
    expect(parseHelpfeelDescription("普通の説明")).toBeNull();
    expect(parseHelpfeelDescription("")).toBeNull();
    expect(parseHelpfeelDescription("? ")).toEqual({
      helpfeelText: "",
      openUrl: undefined,
      copyText: undefined,
    });
  });

  it("should handle multiline descriptions with extra lines", () => {
    const desc = "? テスト\n% open https://example.com\n何かのメモ\n追加情報";
    const result = parseHelpfeelDescription(desc);
    expect(result).toEqual({
      helpfeelText: "テスト",
      openUrl: "https://example.com",
      copyText: undefined,
    });
  });

  it("should ignore % lines that are not % open or % ", () => {
    const desc = "? テスト\n%open https://example.com\n%something";
    // %open (no space after %) and %something should be ignored
    const result = parseHelpfeelDescription(desc);
    expect(result).toEqual({
      helpfeelText: "テスト",
      openUrl: undefined,
      copyText: undefined,
    });
  });
});

describe("parseHelpfeelLines", () => {
  it("should extract helpfeel entries from lines", () => {
    const lines = [
      { text: "通常の行" },
      { text: "? これは質問です" },
      { text: "別の行" },
    ];
    const result = parseHelpfeelLines(lines, "TestPage");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "TestPage-1",
      text: "? これは質問です",
      openUrl: undefined,
      copyText: undefined,
    });
  });

  it("should extract % open URL from the next line", () => {
    const lines = [
      { text: "? 質問" },
      { text: "% open https://example.com" },
      { text: "通常の行" },
    ];
    const result = parseHelpfeelLines(lines, "TestPage");
    expect(result).toHaveLength(1);
    expect(result[0].openUrl).toBe("https://example.com");
  });

  it("should extract % copy text from the next line", () => {
    const lines = [{ text: "? 質問" }, { text: "% コピーテキスト" }];
    const result = parseHelpfeelLines(lines, "TestPage");
    expect(result).toHaveLength(1);
    expect(result[0].copyText).toBe("コピーテキスト");
  });

  it("should extract multiple helpfeel entries", () => {
    const lines = [
      { text: "? 最初の質問" },
      { text: "% open https://example.com" },
      { text: "途中の行" },
      { text: "? 2番目の質問" },
      { text: "% 2番目のコピー" },
    ];
    const result = parseHelpfeelLines(lines, "TestPage");
    expect(result).toHaveLength(2);
    expect(result[0].openUrl).toBe("https://example.com");
    expect(result[1].copyText).toBe("2番目のコピー");
  });

  it("should prefer % open over % on the next line", () => {
    const lines = [{ text: "? 質問" }, { text: "% open https://example.com" }];
    const result = parseHelpfeelLines(lines, "TestPage");
    expect(result).toHaveLength(1);
    expect(result[0].openUrl).toBe("https://example.com");
    expect(result[0].copyText).toBeUndefined();
  });

  it("should handle empty lines array", () => {
    const result = parseHelpfeelLines([], "TestPage");
    expect(result).toEqual([]);
  });
});
