import { Action, ActionPanel, getPreferenceValues, Grid } from "@raycast/api";
import { useState, useRef } from "react";
import { usePromise } from "@raycast/utils";
import { searchGyazo } from "./search-gyazo";
import { searchPages } from "./search-pages";

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const preferences = getPreferenceValues<Preferences>();
    const projects = preferences.projects.split(",").map((p) => p.trim());

    const abortable = useRef<AbortController>(undefined);
    const { isLoading: isLoadingGyazoSearch, data: gyazoSearchResult } = usePromise(
        async (searchText: string) => searchGyazo(searchText, preferences.gyazoAccessToken, abortable.current?.signal),
        [searchText.trim()],
        { abortable },
    );
    const abortable2 = useRef<AbortController>(undefined);
    const { isLoading: isLoadingpagesSearch, data: pagesSearchResult } = usePromise(
        async (searchText: string) => searchPages(searchText, projects, preferences.sid, abortable2.current?.signal),
        [searchText.trim()],
        { abortable: abortable2 },
    );

    return (
        <Grid
            columns={4}
            inset={Grid.Inset.Large}
            onSearchTextChange={setSearchText}
            isLoading={isLoadingGyazoSearch || isLoadingpagesSearch}
        >
            {pagesSearchResult?.map((item) => (
                <Grid.Section key={item.projectName} title={item.projectName}>
                    {item.pages.map((page) => (
                        <Grid.Item
                            key={page.id}
                            content={page.image}
                            title={page.title}
                            subtitle={page.lines[0]}
                            actions={
                                <ActionPanel>
                                    <Action.OpenInBrowser
                                        url={`https://scrapbox.io/${item.projectName}/${page.title}`}
                                    />
                                </ActionPanel>
                            }
                        />
                    ))}
                </Grid.Section>
            ))}
            {gyazoSearchResult?.length ? (
                <Grid.Section key="gyazo_images" title="Gyazo">
                    {gyazoSearchResult.map((item) => (
                        <Grid.Item
                            key={item.image_id}
                            content={item.url}
                            subtitle={item.ocr?.description || item.metadata?.title}
                            actions={
                                <ActionPanel>
                                    <Action.OpenInBrowser url={item.permalink_url} />
                                </ActionPanel>
                            }
                        />
                    ))}
                </Grid.Section>
            ) : null}
        </Grid>
    );
}
