import { Action, ActionPanel, List, getPreferenceValues, Icon } from "@raycast/api";
import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { useScrapboxProject } from "./use-scrapbox";
import { PushGyazoSearchAction } from "./gyazo-search";
import { PushGyazoImagesAction } from "./gyazo-images";
import { buildCopyText, buildFinalUrl, extractDynamicQuery, resolveQueryGlossary } from "./helpfeel";

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
    if (!fixedPart) return [];
    const fuse = new Fuse(data.helpfeels, { keys: ["text"], threshold: 0.5 });
    return fuse.search(fixedPart).map((r) => r.item);
  }, [fixedPart, data.helpfeels]);

  // タイトル検索のフィルタリング
  const filteredTitles = useMemo(() => {
    if (!searchText) return [];
    const fuse = new Fuse(data.titles, {
      threshold: 0.4,
    });
    return fuse.search(searchText).map((r) => r.item);
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
      {filteredTitles.length > 0 && (
        <List.Section title={`Pages: ${project}`} subtitle={isLoading ? "Syncing..." : ""}>
          {filteredTitles.slice(0, 20).map((title) => (
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
