/**
 * Parse a description text that may contain helpfeel notation.
 *
 * Format:
 *   ? helpfeel text
 *   % open URL
 *   % copy text
 */
export interface ParsedHelpfeelDescription {
  helpfeelText: string;
  openUrl?: string;
  copyText?: string;
}

export function parseHelpfeelDescription(desc: string): ParsedHelpfeelDescription | null {
  if (!desc.startsWith("? ")) return null;

  const lines = desc.split("\n");
  const helpfeelLine = lines.find((l) => l.startsWith("? "));
  const openUrlLine = lines.find((l) => l.startsWith("% open "));
  const copyLine = lines.find((l) => l.startsWith("% ") && !l.startsWith("% open "));

  if (!helpfeelLine) return null;

  return {
    helpfeelText: helpfeelLine.replace(/^\?\s*/, ""),
    openUrl: openUrlLine?.replace("% open ", "").trim(),
    copyText: copyLine?.replace("% ", "").trim(),
  };
}

/**
 * Scrapbox API の lines から Helpfeel エントリを抽出する。
 * 1行が ? で始まるかをチェックし、次の行が % open / % かを判断する。
 */
export function parseHelpfeelLines(
  lines: { text: string }[],
  pageTitle: string,
): Array<{
  id: string;
  text: string;
  openUrl?: string;
  copyText?: string;
}> {
  const entries: Array<{
    id: string;
    text: string;
    openUrl?: string;
    copyText?: string;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i].text.trim();
    if (!lineText.startsWith("? ")) continue;

    let openUrl: string | undefined;
    let copyText: string | undefined;

    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].text.trim();
      if (nextLine.startsWith("% open ")) {
        openUrl = nextLine.replace("% open ", "").trim();
      } else if (nextLine.startsWith("% ")) {
        copyText = nextLine.replace("% ", "").trim();
      }
    }

    entries.push({
      id: `${pageTitle}-${i}`,
      text: lineText,
      openUrl,
      copyText,
    });
  }

  return entries;
}
