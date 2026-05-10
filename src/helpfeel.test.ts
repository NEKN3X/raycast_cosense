import { describe, it, expect } from "vitest";
import { expandHelpfeel } from "./helpfeel";

describe("expandHelpfeel", () => {
  const glossary = {
    pc: "(パソコン|PC)",
    action: "(捨てたい|:破棄したい)",
    trash: "{pc}の(捨て方|処分方法)",
  };

  it("基本的な展開ができること", () => {
    const input = "? (犬|猫)が好き";
    const result = expandHelpfeel(input);

    expect(result).toContain("犬が好き");
    expect(result).toContain("猫が好き");
    expect(result).toHaveLength(2);
  });

  it("用語集が正しく展開されること", () => {
    const input = "? {pc}を買う";
    const result = expandHelpfeel(input, glossary);

    expect(result).toEqual(expect.arrayContaining(["パソコンを買う", "PCを買う"]));
    expect(result).toHaveLength(2);
  });

  it('劣後記号 ":" が無視（削除）されて展開されること', () => {
    const input = "? {action}";
    const result = expandHelpfeel(input, glossary);

    expect(result).toContain("捨てたい");
    expect(result).toContain("破棄したい"); // ":" が消えていること
    expect(result).toHaveLength(2);
  });

  it("用語集の中に用語集がある（再帰的な定義）を解決できること", () => {
    const input = "? {trash}";
    const result = expandHelpfeel(input, glossary);

    // {pc} が展開され、さらに (捨て方|処分方法) が展開される
    expect(result).toContain("パソコンの捨て方");
    expect(result).toContain("パソコンの処分方法");
    expect(result).toContain("PCの捨て方");
    expect(result).toContain("PCの処分方法");
    expect(result).toHaveLength(4);
  });

  it("複数の括弧が組み合わさったデカルト積が正しく生成されること", () => {
    const input = "? (A|B)は(1|2)";
    const result = expandHelpfeel(input);

    expect(result).toEqual(["Aは1", "Aは2", "Bは1", "Bは2"]);
  });

  it("角括弧 [] が除去されること（読み替え機能は未実装のため）", () => {
    const input = "? [質問]の仕方";
    const result = expandHelpfeel(input);

    expect(result).toEqual(["質問の仕方"]);
  });

  it('行頭の "? " がなくても動作すること', () => {
    const input = "括弧がない文章";
    const result = expandHelpfeel(input);

    expect(result).toEqual(["括弧がない文章"]);
  });

  it("空文字や異常な入力に対して空の配列を返さないこと", () => {
    expect(expandHelpfeel("")).toEqual([""]);
  });
});
