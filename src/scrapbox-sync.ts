import { Cache } from "@raycast/api";
import { ProjectCache, SearchTitlesResponse, PageResponse, HelpfeelEntry } from "./types";
import { parseGlossary } from "./helpfeel";

const cache = new Cache();

export async function syncProject(project: string, sid?: string): Promise<ProjectCache> {
  const headers = { Cookie: sid ? `connect.sid=${sid}` : "" };
  const cacheKey = `data-${project}`;

  // 1. キャッシュの読み込み
  const rawCache = cache.get(cacheKey);
  const prevCache: ProjectCache = rawCache
    ? JSON.parse(rawCache)
    : { project, lastSyncTime: 0, pageUpdatedMap: {}, helpfeels: [], titles: [], glossary: {} };

  if (!prevCache.glossary) {
    prevCache.glossary = {};
  }

  // 2. 最新のページ一覧を取得
  const res = await fetch(`https://scrapbox.io/api/pages/${project}/search/titles`, { headers });
  if (!res.ok) throw new Error(`Fetch titles failed: ${res.status}`);
  const latestPages = (await res.json()) as SearchTitlesResponse[];

  // 3. Glossary ページの更新確認と取得
  let currentGlossary = prevCache.glossary;
  let isGlossaryUpdated = false; // Glossaryが更新されたかどうかのフラグ
  const glossaryPage = latestPages.find((p) => p.title === "Glossary");

  if (glossaryPage) {
    const cachedUpdated = prevCache.pageUpdatedMap["Glossary"];
    if (!cachedUpdated || glossaryPage.updated > cachedUpdated) {
      const gRes = await fetch(`https://scrapbox.io/api/pages/${project}/Glossary`, { headers });
      if (gRes.ok) {
        const gData = (await gRes.json()) as PageResponse;
        currentGlossary = parseGlossary(gData.lines);
        isGlossaryUpdated = true; // 更新があったことをマーク
      }
    }
  }

  // 4. 更新が必要なページ（dirty）を特定
  const dirtyPages = latestPages.filter((p) => {
    if (p.title === "Glossary") return false;
    // 【重要】Glossaryが更新された場合は、全ページを「dirty（要再計算）」として扱う
    if (isGlossaryUpdated) return true;

    const cachedUpdated = prevCache.pageUpdatedMap[p.title];
    return !cachedUpdated || p.updated > cachedUpdated;
  });

  // 5. キャッシュの整理
  const latestTitlesSet = new Set(latestPages.map((p) => p.title));
  const dirtyTitlesSet = new Set(dirtyPages.map((p) => p.title));

  // 既存のキャッシュから「削除されておらず、かつ今回更新（再計算）対象になっていない」クリーンなデータを残す
  const cleanHelpfeels = prevCache.helpfeels.filter(
    (h) => latestTitlesSet.has(h.pageTitle) && !dirtyTitlesSet.has(h.pageTitle),
  );

  // 6. Dirty ページの詳細取得と Helpfeel 展開
  const fetchTasks = dirtyPages.map(async (p): Promise<HelpfeelEntry[]> => {
    try {
      const pageRes = await fetch(`https://scrapbox.io/api/pages/${project}/${encodeURIComponent(p.title)}`, {
        headers,
      });
      if (!pageRes.ok) return [];
      const pageData = (await pageRes.json()) as PageResponse;

      const entries: HelpfeelEntry[] = [];
      const lines = pageData.lines;

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i].text.trim();

        if (lineText.startsWith("? ")) {
          let openUrl: string | undefined;
          let copyText: string | undefined;

          // 次の行のメタデータをチェック
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].text.trim();
            if (nextLine.startsWith("% open ")) {
              openUrl = nextLine.replace("% open ", "").trim();
            } else if (nextLine.startsWith("% ")) {
              copyText = nextLine.replace("% ", "").trim();
            }
          }

          // --- 変更: キャッシュには展開済みテキストを保存せず、元のテンプレート行を保存する ---
          // ここでは Glossary や {query}、および括弧を展開せずに原文をそのまま保存します。
          // 実際の展開（Glossary と query を先に展開してから括弧を展開する）は検索時に行います。

          entries.push({
            id: `${p.title}-${i}`,
            text: lineText,
            originalText: lineText,
            pageTitle: p.title,
            openUrl,
            copyText,
          });
        }
      }
      return entries;
    } catch (e) {
      console.error(`Sync error on page ${p.title}:`, e);
      return [];
    }
  });

  const newHelpfeels = (await Promise.all(fetchTasks)).flat();

  // 7. 新しいキャッシュの構築と保存
  const newCache: ProjectCache = {
    project,
    lastSyncTime: Math.floor(Date.now() / 1000),
    pageUpdatedMap: Object.fromEntries(latestPages.map((p) => [p.title, p.updated])),
    helpfeels: [...cleanHelpfeels, ...newHelpfeels],
    titles: latestPages.map((p) => p.title),
    glossary: currentGlossary,
  };

  cache.set(cacheKey, JSON.stringify(newCache));
  return newCache;
}
