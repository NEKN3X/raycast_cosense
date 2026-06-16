import { Action, ActionPanel, List, getPreferenceValues, Icon } from "@raycast/api";
import { useState, useMemo } from "react";
import { Fzf } from "fzf";
import { useScrapboxProject } from "./use-scrapbox";
import { PushGyazoSearchAction } from "./gyazo-search";
import { PushGyazoImagesAction } from "./gyazo-images";
import {
  buildCopyText,
  buildFinalUrl,
  extractDynamicQuery,
  resolveQueryGlossary,
  expandWithGlossary,
  expandHelpfeel,
} from "./helpfeel";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const preferences = getPreferenceValues<Preferences>();
  const projects = useMemo(() => preferences.projects.split(","), [preferences.projects]);

  return (
    <List
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Scrapbox or Helpfeel..."
      actions={
        <ActionPanel>
          {searchText.length > 0 && (
            <>
              <Action.OpenInBrowser
                title="Web Search"
                shortcut={{ modifiers: ["shift"], key: "enter" }}
                url={preferences.searchEngine.replaceAll("{query}", searchText)}
              />
              <PushGyazoSearchAction searchText={searchText} token={preferences.gyazoAccessToken} />
            </>
          )}
          {searchText.length === 0 && <PushGyazoImagesAction token={preferences.gyazoAccessToken} />}
        </ActionPanel>
      }
    >
      {projects.map((project) => (
        <ProjectSearchSection key={project} project={project} searchText={searchText} sid={preferences.sid} />
      ))}
    </List>
  );
}

/**
 * プロジェクトごとの検索セクション
 */
function ProjectSearchSection({ project, searchText, sid }: { project: string; searchText: string; sid?: string }) {
  const { data, isLoading } = useScrapboxProject(project, sid);

  // 1. 固定部分 (fixedPart) を使ってHelpfeelを検索
  //    Glossary と dynamic query を先に展開し、その後括弧を展開してから FZF で検索します。
  const filteredHelpfeels = useMemo(() => {
    const { fixedPart, dynamicQuery } = extractDynamicQuery(searchText);
    if (!fixedPart) return [];

    // Build flattened list of expanded variants for each helpfeel entry
    const items = data.helpfeels.flatMap((hf) => {
      const template = hf.originalText ?? hf.text;

      // 1) Glossary のプレースホルダを展開 (例: {doc} -> (doc|ドキュメント))
      const afterGlossaryList = expandWithGlossary(template, data.glossary ?? {});

      // 2) 各候補に {query} を置換し、括弧を展開して具体的な候補文字列に分解
      const expandedAll = afterGlossaryList.flatMap((afterGlossary) => {
        const afterQuery = afterGlossary.replace(/{query}/g, dynamicQuery || "");
        const expanded = expandHelpfeel(afterQuery);
        return expanded;
      });

      return expandedAll.map((s) => ({ id: hf.id, entry: hf, expanded: s }));
    });

    // FZF インスタンスを作成して expanded を検索対象にする
    const fzf = new Fzf(items, {
      selector: (it) => it.expanded,
      tiebreakers: [(a, b) => b.score - a.score],
    });

    const results = fzf.find(fixedPart);

    // ID 単位でユニーク化し、最もスコアが高い結果を採用
    const uniqueMap = new Map<string, { score: number; item: (typeof results)[0] }>();

    for (const res of results) {
      const id = res.item.id;
      if (!uniqueMap.has(id) || res.score > (uniqueMap.get(id)!.score ?? -Infinity)) {
        uniqueMap.set(id, { score: res.score, item: res });
      }
    }

    // 戻り値は展開後の文字列と元エントリを含むオブジェクト配列
    return Array.from(uniqueMap.values()).map((v) => ({ entry: v.item.item.entry, matchedText: v.item.item.expanded }));
  }, [searchText, data.helpfeels, data.glossary]);

  // タイトル検索のフィルタリング
  const filteredPages = useMemo(() => {
    if (!searchText) return [];

    // 1. Fzf インスタンスの作成 (ページ検索用)
    const fzf = new Fzf(data.titles, {
      tiebreakers: [(a, b) => b.score - a.score],
    });

    // 2. 検索実行
    // ページ検索の場合は extractDynamicQuery を通さず、searchText 全体を使う
    const results = fzf.find(searchText);

    // 3. 上位の結果を返す (重複排除は通常不要だが、件数制限をかけると見やすい)
    return results.slice(0, 20).map((r) => r.item);
  }, [searchText, data.titles]);

  const { variables } = resolveQueryGlossary(searchText);

  return (
    <>
      {/* Helpfeel セクション (質問文へのマッチ) */}
      {filteredHelpfeels.length > 0 && (
        <List.Section title={`Helpfeel: ${project}`}>
          {filteredHelpfeels.slice(0, 10).map((item, i) => {
            const hf = item.entry;
            const matchedText = item.matchedText;
            // 2. buildFinalUrl に抽出した dynamicQuery を渡す
            const { dynamicQuery } = extractDynamicQuery(searchText);
            const targetCopyText = buildCopyText(hf, dynamicQuery, variables);
            const targetUrl = buildFinalUrl(hf, dynamicQuery, variables, project);

            return (
              <List.Item
                key={`hf-${project}-${i}`}
                title={matchedText.replace(/^\?\s*/, "").replace("{query}", dynamicQuery || "...")}
                icon={Icon.QuestionMark}
                accessories={[{ text: hf.pageTitle, icon: Icon.Link }]}
                actions={
                  <ActionPanel>
                    {/* copyText があればコピーを最優先にする */}
                    {targetCopyText && <Action.CopyToClipboard title="Copy to Clipboard" content={targetCopyText} />}

                    {/* openUrl があればブラウザで開く */}
                    {hf.openUrl && (
                      <>
                        <Action.OpenInBrowser url={targetUrl} />
                        <Action.CopyToClipboard title="Copy URL" content={hf.openUrl} />
                      </>
                    )}

                    <Action.OpenInBrowser
                      shortcut={{ modifiers: ["shift"], key: "enter" }}
                      url={`https://scrapbox.io/${project}/${encodeURIComponent(hf.pageTitle)}`}
                      title="Open Scrapbox Page"
                    />

                    <Action.CopyToClipboard
                      shortcut={{ modifiers: ["shift", "ctrl"], key: "enter" }}
                      title="Copy Scrapbox URL"
                      content={`https://scrapbox.io/${project}/${encodeURIComponent(hf.pageTitle)}`}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      )}

      {/* ページタイトル セクション */}
      {filteredPages.length > 0 && (
        <List.Section title={`Pages: ${project}`} subtitle={isLoading ? "Syncing..." : ""}>
          {filteredPages.slice(0, 20).map((title) => (
            <List.Item
              key={`title-${project}-${title}`}
              title={title}
              icon={Icon.Document}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser
                    title="Open Scrapbox Page"
                    url={`https://scrapbox.io/${project}/${encodeURIComponent(title)}`}
                  />
                  <Action.CopyToClipboard
                    title="Copy URL"
                    content={`https://scrapbox.io/${project}/${encodeURIComponent(title)}`}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </>
  );
}
