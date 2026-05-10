import { HelpfeelEntry, GlossaryMap } from "./types";

/**
 * Glossary ページの本文から変数を抽出する
 * 形式: word:`([言葉A]|言葉B|:言葉C)`
 */
export const parseGlossary = (lines: { text: string }[]): GlossaryMap => {
  const regex = /^([^:]+):`\((.+)\)`$/;

  return lines.reduce((acc, line) => {
    const match = line.text.trim().match(regex);
    if (!match) return acc;

    const [_, key, values] = match;
    // Scrapbox記法のブラケット [ ] や : を除去して分割
    const options = values.split("|").map((v) => v.replace(/[[\]:]/g, "").trim());

    return { ...acc, [key]: options };
  }, {} as GlossaryMap);
};

/**
 * 文字列内の {key} を Glossary に基づいて全展開する
 */
export const expandWithGlossary = (text: string, glossary: GlossaryMap = {}): string[] => {
  // glossary が null や undefined の場合の安全策
  const safeGlossary = glossary ?? {};
  let patterns = [text];

  Object.entries(safeGlossary).forEach(([key, values]) => {
    const placeholder = `{${key}}`;
    // values が配列であることを確認
    if (!Array.isArray(values)) return;

    patterns = patterns.flatMap((p) => (p.includes(placeholder) ? values.map((v) => p.replace(placeholder, v)) : [p]));
  });

  return patterns;
};

/**
 * Helpfeel 記法の ( ) 部分を展開する (標準の Helpfeel 展開)
 * 例: "? (A|B)のテスト" -> ["? Aのテスト", "? Bのテスト"]
 */
export const expandHelpfeel = (text: string): string[] => {
  const regex = /\(([^)]+)\)/;
  const match = text.match(regex);

  if (!match) return [text];

  const [fullMatch, optionsText] = match;
  const options = optionsText.split("|");

  return options.flatMap((opt) => expandHelpfeel(text.replace(fullMatch, opt)));
};

/**
 * Raycast の検索クエリから glossary (key=value) を抽出する
 * 入力: "てすと q=キーワード pc=(ノートパソコン)"
 */
export const resolveQueryGlossary = (input: string) => {
  const variables: Record<string, string> = {};
  const regex = /(\w+)=([^(\s]+|\([^)]+\))/g;

  let cleanSearchText = input;
  let match;

  while ((match = regex.exec(input)) !== null) {
    const [fullMatch, key, value] = match;
    variables[key] = value.replace(/^\(|\)$/g, "");
    cleanSearchText = cleanSearchText.replace(fullMatch, "");
  }

  return {
    cleanSearchText: cleanSearchText.trim(),
    variables,
  };
};

/**
 * 最終的なURLを組み立てる
 */
export const buildFinalUrl = (
  entry: HelpfeelEntry,
  dynamicQuery: string, // 追加
  queryVariables: Record<string, string>,
  project: string,
): string => {
  if (!entry.openUrl) {
    return `https://scrapbox.io/${project}/${encodeURIComponent(entry.pageTitle)}`;
  }

  let url = entry.openUrl;

  // {query} を動的なクエリで置換
  url = url.replace(/{query}/g, encodeURIComponent(dynamicQuery));

  // その他の変数置換
  Object.entries(queryVariables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{${key}}`, "g");
    url = url.replace(placeholder, encodeURIComponent(value));
  });

  return url;
};

/**
 * 検索文字列をスペースで分割し、最後の要素を {query} として抽出する
 * 入力: "you test" -> { query: "test", fixedPart: "you" }
 * 入力: "help"     -> { query: "",     fixedPart: "help" }
 */
export const extractDynamicQuery = (inputText: string): { dynamicQuery: string; fixedPart: string } => {
  const trimmedInput = inputText.trim();
  const parts = trimmedInput.split(/\s+/); // 1つ以上のスペースで分割

  // 単語が1つしかない場合は、それを固定部分とし、クエリは空とする
  if (parts.length <= 1) {
    return {
      dynamicQuery: "",
      fixedPart: trimmedInput,
    };
  }

  // 最後の要素をクエリ、それ以外を結合して固定部分とする
  const dynamicQuery = parts[parts.length - 1];
  const fixedPart = parts.slice(0, -1).join(" ");

  return {
    dynamicQuery,
    fixedPart,
  };
};

/**
 * コピー用のテキストを組み立てる
 */
export const buildCopyText = (
  entry: HelpfeelEntry,
  dynamicQuery: string,
  queryVariables: Record<string, string>,
): string | undefined => {
  if (!entry.copyText) return undefined;

  let text = entry.copyText;

  // {query} の置換
  text = text.replace(/{query}/g, dynamicQuery);

  // 変数置換
  Object.entries(queryVariables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{${key}}`, "g");
    text = text.replace(placeholder, value);
  });

  return text;
};
