import { Action, ActionPanel, getPreferenceValues, List } from "@raycast/api";
import { useState } from "react";
import ScrapboxSearch from "./scrapbox-search";
import { PushGyazoSearchAction } from "./gyazo-search";
import { PushGyazoImagesAction } from "./gyazo-images";

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const preferences = getPreferenceValues<Preferences>();

    return (
        <List
            onSearchTextChange={setSearchText}
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
            {searchText &&
                preferences.projects
                    .split(",")
                    .map((project) => (
                        <ScrapboxSearch key={project} project={project} searchText={searchText} sid={preferences.sid} />
                    ))}
        </List>
    );
}
