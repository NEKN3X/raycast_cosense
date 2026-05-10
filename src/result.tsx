import { Action, ActionPanel, List, getPreferenceValues, Icon } from "@raycast/api";
import { useState, useMemo } from "react";
import { Fzf } from "fzf";
import { useScrapboxProject } from "./use-scrapbox";
import { PushGyazoSearchAction } from "./gyazo-search";
import { PushGyazoImagesAction } from "./gyazo-images";
import { buildCopyText, buildFinalUrl, extractDynamicQuery, resolveQueryGlossary } from "./helpfeel";
import { HelpfeelEntry } from "./types";

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
  const { dynamicQuery, fixedPart } = useMemo(() => extractDynamicQuery(searchText), [searchText]);

  // 1. 固定部分 (fixedPart) を使ってHelpfeelを検索
  const filteredHelpfeels = useMemo(() => {
    const { fixedPart } = extractDynamicQuery(searchText);
    if (!fixedPart) return [];

    // 1. Fzf インスタンスの作成
    const fzf = new Fzf(data.helpfeels, {
      // 検索対象のキーを指定
      selector: (item) => `${item.text}`,
      // 先頭一致を優先するなどの調整が可能
      tiebreakers: [(a, b) => b.score - a.score],
    });

    // 2. 検索実行
    const results = fzf.find(fixedPart);

    // 3. IDでユニーク化（最もスコアが高いもの1つだけを抽出）
    const uniqueMap = new Map<string, (typeof results)[0]>();

    for (const res of results) {
      const id = res.item.id;
      // fzf はスコアが高いほど一致度が高い
      if (!uniqueMap.has(id) || res.score > (uniqueMap.get(id)?.score ?? -Infinity)) {
        console.log(res);
        uniqueMap.set(id, res);
      }
    }

    return Array.from(uniqueMap.values()).map((r) => r.item);
  }, [searchText, data.helpfeels]);

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

  const { cleanSearchText, variables } = resolveQueryGlossary(searchText);

  return (
    <>
      {/* Helpfeel セクション (質問文へのマッチ) */}
      {filteredHelpfeels.length > 0 && (
        <List.Section title={`Helpfeel: ${project}`}>
          {filteredHelpfeels.slice(0, 10).map((hf, i) => {
            // 2. buildFinalUrl に抽出した dynamicQuery を渡す
            const { dynamicQuery } = extractDynamicQuery(searchText);
            const targetCopyText = buildCopyText(hf, dynamicQuery, variables);
            const targetUrl = buildFinalUrl(hf, dynamicQuery, variables, project);

            return (
              <List.Item
                key={`hf-${project}-${i}`}
                title={hf.text.replace(/^\?\s*/, "").replace("{query}", dynamicQuery || "...")}
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
