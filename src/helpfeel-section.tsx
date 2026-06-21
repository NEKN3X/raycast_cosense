import { Action, ActionPanel, List, Icon } from "@raycast/api";
import { useMemo } from "react";
import { useScrapboxProject } from "./use-scrapbox";
import {
  buildCopyText,
  buildFinalUrl,
  extractDynamicQuery,
  resolveQueryGlossary,
  expandWithGlossary,
  expandHelpfeel,
} from "./helpfeel";
import { fzfSearchUnique } from "./search";

/**
 * Scrapbox プロジェクトの Helpfeel 検索セクション。
 */
export function HelpfeelSection({
  project,
  searchText,
  sid,
}: {
  project: string;
  searchText: string;
  sid?: string;
}) {
  const { data } = useScrapboxProject(project, sid);

  const filteredHelpfeels = useMemo(() => {
    const { fixedPart, dynamicQuery } = extractDynamicQuery(searchText);
    if (!fixedPart) return [];

    const items = data.helpfeels.flatMap((hf) => {
      const template = hf.originalText ?? hf.text;

      const afterGlossaryList = expandWithGlossary(template, data.glossary ?? {});

      const expandedAll = afterGlossaryList.flatMap((afterGlossary) => {
        const afterQuery = afterGlossary.replace(/{query}/g, dynamicQuery || "");
        return expandHelpfeel(afterQuery);
      });

      return expandedAll.map((s) => ({ id: hf.id, entry: hf, expanded: s }));
    });

    return fzfSearchUnique(items, fixedPart, 10);
  }, [searchText, data.helpfeels, data.glossary]);

  const { variables } = resolveQueryGlossary(searchText);

  if (filteredHelpfeels.length === 0) return null;

  return (
    <List.Section title={`Helpfeel: ${project}`}>
      {filteredHelpfeels.slice(0, 10).map((item, i) => {
        const hf = item.entry;
        const matchedText = item.matchedText;
        const { dynamicQuery } = extractDynamicQuery(searchText);
        const targetCopyText = buildCopyText(hf, dynamicQuery, variables);
        const targetUrl = buildFinalUrl(hf, dynamicQuery, variables, project);

        const displayTitle = matchedText.replace(/^\?\s*/, "").replace("{query}", dynamicQuery || "...");

        return (
          <List.Item
            key={`hf-${project}-${i}`}
            title={displayTitle}
            subtitle={hf.pageTitle}
            icon={Icon.QuestionMark}
            accessories={
              hf.openUrl
                ? [{ text: hf.openUrl.replace(/^https?:\/\//, "").slice(0, 30), icon: Icon.Globe }]
                : []
            }
            actions={
              <ActionPanel>
                {targetCopyText && <Action.CopyToClipboard title="Copy to Clipboard" content={targetCopyText} />}
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
  );
}
