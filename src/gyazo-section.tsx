import { Action, ActionPanel, List, Icon, useNavigation } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useMemo } from "react";
import { GyazoSearchResponse } from "./types";
import { parseHelpfeelDescription } from "./parse-helpfeel";
import { expandHelpfeel } from "./helpfeel";
import { fzfSearch } from "./search";
import { GyazoGroupGrid } from "./gyazo-grid";

/**
 * Gyazo API から画像一覧を取得するフック。
 */
export function useGyazoImages(token: string | undefined) {
  return useFetch("https://api.gyazo.com/api/images?per_page=100", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    keepPreviousData: true,
    parseResponse: (response) => response.json() as Promise<GyazoSearchResponse[]>,
    execute: !!token,
  });
}

/**
 * 画像の検索用テキストを生成する。
 */
function buildSearchText(img: GyazoSearchResponse): string {
  return [img.metadata?.title, img.metadata?.desc, img.ocr?.description, img.alt_text, img.metadata?.app]
    .filter(Boolean)
    .join(" ");
}

// ============================================================
// Gyazo Helpfeel セクション
// ============================================================

/**
 * Gyazo 画像のうち、説明文が Helpfeel 記法（? で始まる）のものを
 * ファジー検索して表示する。
 */
export function GyazoHelpfeelSection({
  searchText,
  data,
}: {
  searchText: string;
  data: GyazoSearchResponse[];
}) {
  const filteredHelpfeel = useMemo(() => {
    if (!data || !searchText) return [];

    const items = data.flatMap((img) => {
      const parsed = parseHelpfeelDescription(img.metadata?.desc || "");
      if (!parsed) return [];

      const expandedVariants = expandHelpfeel(parsed.helpfeelText);

      return expandedVariants.map((variant) => ({
        image: img,
        displayText: variant,
        openUrl: parsed.openUrl,
        copyText: parsed.copyText,
      }));
    });

    return fzfSearch(items, (it) => it.displayText, searchText, 10);
  }, [data, searchText]);

  if (filteredHelpfeel.length === 0) return null;

  return (
    <List.Section title="Gyazo Helpfeel">
      {filteredHelpfeel.map((item) => {
        const subtitle =
          item.image.ocr?.description ||
          item.image.metadata?.desc?.split("\n").find((l) => !l.startsWith("? ") && !l.startsWith("% ")) ||
          undefined;
        return (
          <List.Item
            key={item.image.image_id}
            title={item.displayText}
            subtitle={subtitle}
            icon={item.image.thumb_url}
            accessories={[{ icon: Icon.Image, text: item.image.metadata?.app }]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser
                  url={item.openUrl || item.image.permalink_url}
                  title={item.openUrl ? "Open" : "Open Gyazo"}
                />
                {item.openUrl && <Action.OpenInBrowser url={item.image.permalink_url} title="Open Gyazo" />}
                {item.image.metadata?.url && (
                  <Action.OpenInBrowser url={item.image.metadata.url} title="Open Capture Source" />
                )}
                {item.copyText && <Action.CopyToClipboard title="Copy to Clipboard" content={item.copyText} />}
                <Action.CopyToClipboard title="Copy Image URL" content={item.image.url} />
                {item.image.ocr?.description && (
                  <Action.CopyToClipboard title="Copy OCR Text" content={item.image.ocr.description} />
                )}
              </ActionPanel>
            }
          />
        );
      })}
    </List.Section>
  );
}

// ============================================================
// Gyazo 通常画像（グループ化）セクション
// ============================================================

/**
 * URL から hostname を抽出する。
 */
function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * グループ化キーを生成する。
 * 条件: title が完全一致 + URLのhostnameが一致
 */
function groupKey(img: GyazoSearchResponse): string | undefined {
  const sourceUrl = img.metadata?.url;
  const title = img.metadata?.title;

  if (title && sourceUrl) {
    return `${title}::${extractHostname(sourceUrl)}`;
  }

  if (sourceUrl) {
    return `host:${extractHostname(sourceUrl)}`;
  }

  if (title) {
    return `title:${title}`;
  }

  return undefined;
}

/**
 * Gyazo 画像のうち Helpfeel 以外のものを、タイトルとキャプチャ元URLで
 * グループ化して表示する。
 */
export function GyazoImagesSection({
  searchText,
  data,
}: {
  searchText: string;
  data: GyazoSearchResponse[];
}) {
  const { push } = useNavigation();

  const groups = useMemo(() => {
    if (!data || !searchText) return [];

    const query = searchText.toLowerCase();

    // 1. 全画像を先にグループ化する
    const groupMap = new Map<string, GyazoSearchResponse[]>();
    const ungrouped: GyazoSearchResponse[] = [];

    for (const img of data) {
      // Helpfeel画像は除外
      if ((img.metadata?.desc || "").startsWith("? ")) continue;

      const key = groupKey(img);
      if (key) {
        const existing = groupMap.get(key) ?? [];
        existing.push(img);
        groupMap.set(key, existing);
      } else {
        ungrouped.push(img);
      }
    }

    // 2. グループ内のいずれかの画像が検索クエリにマッチするか判定
    function groupMatches(images: GyazoSearchResponse[]): boolean {
      return images.some((img) => buildSearchText(img).toLowerCase().includes(query));
    }

    // 3. マッチしたグループのみ抽出
    const matchedGroups = Array.from(groupMap.entries()).filter(([, images]) => groupMatches(images));

    // 4. グループなしの画像も個別にフィルタ
    const matchedUngrouped = ungrouped.filter((img) => buildSearchText(img).toLowerCase().includes(query));

    // デバッグログ
    console.log("=== Gyazo Grouping Debug ===");
    console.log("Query:", query);
    console.log("Total non-Helpfeel images:", groupMap.size + ungrouped.length);
    console.log("Groups created:", groupMap.size);
    let multiImageGroups = 0;
    for (const [key, images] of groupMap) {
      console.log(`  [${images.length}] ${key.slice(0, 100)}`);
      if (images.length > 1) multiImageGroups++;
    }
    console.log("Groups with >1 images:", multiImageGroups);
    console.log("Matched groups:", matchedGroups.length);
    console.log("Ungrouped images:", ungrouped.length);
    console.log("Matched ungrouped:", matchedUngrouped.length);
    console.log("=== End ===");

    // グループ情報を返す
    return [
      ...matchedGroups.map(([key, images]) => {
        const first = images[0];
        return {
          key,
          title: first.metadata?.title || "Gyazo Image",
          images,
          sourceUrl: first.metadata?.url,
          app: first.metadata?.app,
        };
      }),
      ...matchedUngrouped.map((img) => ({
        key: img.image_id,
        title: img.metadata?.title || img.alt_text || "Gyazo Image",
        images: [img] as GyazoSearchResponse[],
        sourceUrl: img.metadata?.url,
        app: img.metadata?.app,
      })),
    ];
  }, [data, searchText]);

  if (groups.length === 0) return null;

  return (
    <List.Section title="Gyazo Images">
      {groups.map((group) => (
        <List.Item
          key={group.key}
          title={group.title}
          subtitle={group.images.length > 1 ? `${group.images.length} images` : undefined}
          icon={group.images[0].thumb_url || Icon.Image}
          accessories={[
            { icon: Icon.Image, text: group.app },
            ...(group.sourceUrl
              ? [{ text: group.sourceUrl.replace(/^https?:\/\//, "").slice(0, 30), icon: Icon.Globe }]
              : []),
          ]}
          actions={
            <ActionPanel>
              {group.images.length > 1 && (
                <Action
                  title="Show in Grid"
                  icon={Icon.Image}
                  onAction={() => push(<GyazoGroupGrid images={group.images} title={group.title} />)}
                />
              )}
              <Action.OpenInBrowser url={group.images[0].permalink_url} title="Open Gyazo" />
              {group.sourceUrl && <Action.OpenInBrowser url={group.sourceUrl} title="Open Capture Source" />}
              <Action.CopyToClipboard title="Copy Image URL" content={group.images[0].url} />
            </ActionPanel>
          }
        />
      ))}
    </List.Section>
  );
}
