import { Fzf, FzfResultItem } from "fzf";

/**
 * Fzf で検索し、上位 maxResults 件を返す。
 */
export function fzfSearch<T>(
  items: T[],
  selector: (item: T) => string,
  query: string,
  maxResults: number = 10,
): T[] {
  if (!query || items.length === 0) return [];

  // Fzf のコンストラクタは条件付き型 SyncOptionsTuple<T> を使用しており、
  // ジェネリック T に対して評価できないため、型アサーションでバイパスする。
  const fzf = new (Fzf as unknown as new (list: T[], options: {
    selector: (item: T) => string;
    tiebreakers?: ((a: FzfResultItem<T>, b: FzfResultItem<T>) => number)[];
  }) => Fzf<T[]>)(items, {
    selector,
    tiebreakers: [(a, b) => b.score - a.score],
  });

  return fzf.find(query).slice(0, maxResults).map((r) => r.item);
}

/**
 * Fzf で検索し、entry.id 単位でユニーク化（最もスコアが高いものを採用）した結果を返す。
 */
export function fzfSearchUnique<T extends { id: string }>(
  items: Array<{ id: string; entry: T; expanded: string }>,
  query: string,
  maxResults: number = 10,
): Array<{ entry: T; matchedText: string }> {
  if (!query || items.length === 0) return [];

  type Item = (typeof items)[number];

  const fzf = new (Fzf as unknown as new (list: Item[], options: {
    selector: (item: Item) => string;
    tiebreakers?: ((a: FzfResultItem<Item>, b: FzfResultItem<Item>) => number)[];
  }) => Fzf<Item[]>)(items, {
    selector: (it) => it.expanded,
    tiebreakers: [(a, b) => b.score - a.score],
  });

  const results = fzf.find(query);

  // entry.id 単位でユニーク化
  const uniqueMap = new Map<string, { score: number; item: (typeof results)[0] }>();

  for (const res of results) {
    const entryId = res.item.entry.id;
    if (!uniqueMap.has(entryId) || res.score > (uniqueMap.get(entryId)!.score ?? -Infinity)) {
      uniqueMap.set(entryId, { score: res.score, item: res });
    }
  }

  return Array.from(uniqueMap.values())
    .slice(0, maxResults)
    .map((v) => ({
      entry: v.item.item.entry,
      matchedText: v.item.item.expanded,
    }));
}

/**
 * URL からホスト名を安全に取得する（表示用）。
 */
export function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname.length > 1 ? u.pathname.slice(0, 10) : "");
  } catch {
    return url.replace(/^https?:\/\//, "").slice(0, 30);
  }
}
