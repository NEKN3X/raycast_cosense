import { parseGlossary, expandWithGlossary, expandHelpfeel, resolveQueryGlossary, buildFinalUrl } from "./helpfeel";
import { HelpfeelEntry, GlossaryMap } from "./types";
import { describe, it, expect } from "vitest";

describe("helpfeel.ts", () => {
  describe("parseGlossary", () => {
    it("Glossary記法を正しくパースできること", () => {
      const lines = [
        { text: "target:`([Mac]|Windows|:Linux)`" },
        { text: "browser:`(Chrome|Firefox)`" },
        { text: "無関係な行" },
      ];
      const expected: GlossaryMap = {
        target: ["Mac", "Windows", "Linux"],
        browser: ["Chrome", "Firefox"],
      };
      expect(parseGlossary(lines)).toEqual(expected);
    });
  });

  describe("expandWithGlossary", () => {
    it("Glossary変数を用いて文字列を展開できること", () => {
      const glossary: GlossaryMap = {
        os: ["Mac", "Win"],
      };
      const text = "? {os}の設定方法";
      const result = expandWithGlossary(text, glossary);
      expect(result).toEqual(["? Macの設定方法", "? Winの設定方法"]);
    });

    it("変数が含まれない場合はそのまま返すこと", () => {
      const result = expandWithGlossary("? テスト", { os: ["Mac"] });
      expect(result).toEqual(["? テスト"]);
    });
  });

  describe("expandHelpfeel", () => {
    it("Helpfeel標準の括弧記法を展開できること", () => {
      const text = "? (A|B)の(中|小)項目";
      const result = expandHelpfeel(text);
      expect(result).toEqual(["? Aの中項目", "? Aの小項目", "? Bの中項目", "? Bの小項目"]);
    });
  });

  describe("resolveQueryGlossary", () => {
    it("クエリから変数とクリーンなテキストを分離できること", () => {
      const input = "てすと入力 q=キーワード pc=(ノート パソコン)";
      const { cleanSearchText, variables } = resolveQueryGlossary(input);

      expect(cleanSearchText).toBe("てすと入力");
      expect(variables).toEqual({
        q: "キーワード",
        pc: "ノート パソコン",
      });
    });

    it("変数がない場合は空のオブジェクトを返すこと", () => {
      const { cleanSearchText, variables } = resolveQueryGlossary("単なる検索");
      expect(cleanSearchText).toBe("単なる検索");
      expect(variables).toEqual({});
    });
  });

  describe("buildFinalUrl", () => {
    const entry: HelpfeelEntry = {
      id: "TestPage-0",
      text: "テスト",
      pageTitle: "TestPage",
      openUrl: "https://example.com/search?q={query}&v={v}",
    };

    it("テンプレート変数を正しく置換したURLを生成すること", () => {
      const queryVars = { v: "123" };
      const url = buildFinalUrl(entry, "検索語", queryVars, "my-project");
      expect(url).toBe("https://example.com/search?q=%E6%A4%9C%E7%B4%A2%E8%AA%9E&v=123");
    });

    it("openUrlがない場合はScrapboxのURLを返すこと", () => {
      const scrapboxEntry: HelpfeelEntry = { id: "TestPage-0", text: "テスト", pageTitle: "TestPage" };
      const url = buildFinalUrl(scrapboxEntry, "hoge", {}, "my-project");
      expect(url).toBe("https://scrapbox.io/my-project/TestPage");
    });
  });
});
