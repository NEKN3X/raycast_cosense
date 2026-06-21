import { Action, ActionPanel, List, getPreferenceValues } from "@raycast/api";
import { useState, useMemo } from "react";
import { HelpfeelSection } from "./helpfeel-section";
import { useGyazoImages, GyazoHelpfeelSection, GyazoImagesSection } from "./gyazo-section";
import { ProjectPagesSection } from "./project-section";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const preferences = getPreferenceValues<Preferences>();
  const projects = useMemo(() => preferences.projects.split(","), [preferences.projects]);

  // Gyazo のデータは1回だけ取得して両方のセクションに渡す
  const { data: gyazoData } = useGyazoImages(preferences.gyazoAccessToken);

  return (
    <List
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Scrapbox or Helpfeel..."
      actions={
        <ActionPanel>
          {searchText.length > 0 && (
            <Action.OpenInBrowser
              title="Web Search"
              shortcut={{ modifiers: ["shift"], key: "enter" }}
              url={preferences.searchEngine.replaceAll("{query}", searchText)}
            />
          )}
        </ActionPanel>
      }
    >
      {/* 1. Helpfeel (Scrapbox) */}
      {projects.map((project) => (
        <HelpfeelSection key={`helpfeel-${project}`} project={project} searchText={searchText} sid={preferences.sid} />
      ))}
      {/* 2. Helpfeel (Gyazo) */}
      {preferences.gyazoAccessToken && gyazoData && (
        <GyazoHelpfeelSection searchText={searchText} data={gyazoData} />
      )}
      {/* 3. Scrapbox Pages */}
      {projects.map((project) => (
        <ProjectPagesSection key={`pages-${project}`} project={project} searchText={searchText} sid={preferences.sid} />
      ))}
      {/* 4. Gyazo Images */}
      {preferences.gyazoAccessToken && gyazoData && (
        <GyazoImagesSection searchText={searchText} data={gyazoData} />
      )}
    </List>
  );
}
