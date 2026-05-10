type Glossary = Record<string, string>;

/**
 * Helpfeel記法を展開する関数
 */
export const expandHelpfeel = (input: string, glossary: Glossary = {}): string[] => {
  // 1. 質問記号の除去と用語集の解決 (Recursive Replace)
  const resolveGlossary = (text: string): string => {
    const next = text.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => glossary[key] ?? `{${key}}`);
    return next === text ? text : resolveGlossary(next);
  };

  // 2. 2つの配列を掛け合わせる（デカルト積）ヘルパー
  const cartesianProduct = (acc: string[], nextOptions: string[]): string[] =>
    acc.flatMap((prefix) => nextOptions.map((option) => prefix + option));

  // 3. トークンを解析して選択肢の配列に変換
  const toOptions = (token: string): string[] => {
    if (token.startsWith("(") && token.endsWith(")")) {
      return token
        .slice(1, -1)
        .split("|")
        .map((s) => s.replace(/^:/, ""));
    }
    // [] は一旦無視（中身だけ残す）
    return [token.replace(/[[\]]/g, "")];
  };

  // メインパイプライン
  const rawText = input.replace(/^\?\s+/, "");
  const resolvedText = resolveGlossary(rawText);

  // 4. 文字列をトークン分割して reduce で畳み込む
  return resolvedText
    .split(/(\(.*?\))/g)
    .filter(Boolean)
    .map(toOptions)
    .reduce(cartesianProduct, [""]);
};
