import { Action, ActionPanel, List, Icon } from "@raycast/api";
import { useMemo } from "react";
import { Fzf } from "fzf";
import { useScrapboxProject } from "./use-scrapbox";

/**
 * 1つの Scrapbox プロジェクトのページタイトル検索セクション。
 * Helpfeel セクションは別コンポーネント（helpfeel-section.tsx）に分離。
 */
export function ProjectPagesSection({
  project,
  searchText,
  sid,
}: {
  project: string;
  searchText: string;
  sid?: string;
}) {
  const { data, isLoading } = useScrapboxProject(project, sid);

  const filteredPages = useMemo(() => {
    if (!searchText || data.titles.length === 0) return [];

    const fzf = new Fzf(data.titles, {
      tiebreakers: [(a, b) => b.score - a.score],
    });

    return fzf.find(searchText).slice(0, 20).map((r) => r.item);
  }, [searchText, data.titles]);

  if (filteredPages.length === 0) return null;

  return (
    <List.Section title={`Pages: ${project}`} subtitle={isLoading ? "Syncing..." : ""}>
      {filteredPages.map((title) => {
        const pageUrl = `https://scrapbox.io/${project}/${encodeURIComponent(title)}`;
        return (
          <List.Item
            key={`title-${project}-${title}`}
            title={title}
            subtitle={pageUrl.replace(/^https?:\/\//, "")}
            icon={Icon.Document}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Open Scrapbox Page" url={pageUrl} />
                <Action.CopyToClipboard title="Copy URL" content={pageUrl} />
              </ActionPanel>
            }
          />
        );
      })}
    </List.Section>
  );
}
