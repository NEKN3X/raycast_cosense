import { Action, ActionPanel, getPreferenceValues, List } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { ScrapboxSearchResponse } from "./types";
import { PushGyazoImagesAction } from "./gyazo-images";

export type Props = {
    project: string;
    searchText: string;
    sid?: string;
};

export default function ScrapboxSearch({ project, searchText, sid }: Props) {
    const preferences = getPreferenceValues<Preferences>();
    const { isLoading, data } = useFetch(`https://scrapbox.io/api/pages/${project}/search/query?q=${searchText}`, {
        headers: { Cookie: `connect.sid=${sid}` },
        keepPreviousData: true,
        parseResponse: (response) => response.json() as Promise<ScrapboxSearchResponse>,
    });

    return (
        !isLoading &&
        data !== undefined && (
            <List.Section key={data.projectName} title={data.projectName}>
                {data.pages.map((page) => (
                    <List.Item
                        key={page.id}
                        title={page.title}
                        subtitle={page.lines[0]}
                        icon={page.image}
                        actions={
                            <ActionPanel>
                                <Action.OpenInBrowser url={`https://scrapbox.io/${data.projectName}/${page.title}`} />
                                <Action.CopyToClipboard
                                    title="Copy Page URL"
                                    content={`https://scrapbox.io/${data.projectName}/${page.title}`}
                                />
                                <PushGyazoImagesAction token={preferences.gyazoAccessToken} />
                            </ActionPanel>
                        }
                    />
                ))}
            </List.Section>
        )
    );
}
