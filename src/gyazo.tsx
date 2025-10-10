import { Action, ActionPanel, Grid, useNavigation } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { GyazoSearchResponse } from "./types";

export type Props = {
    searchText: string;
    token: string;
};

export default function Gyazo({ searchText, token }: Props) {
    const { pop } = useNavigation();
    const { isLoading, data } = useFetch(`https://api.gyazo.com/api/search?query=${encodeURIComponent(searchText)}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        keepPreviousData: true,
        parseResponse: (response) => response.json() as Promise<GyazoSearchResponse[]>,
    });

    return (
        <Grid
            isLoading={isLoading}
            actions={
                <ActionPanel>
                    <Action
                        onAction={pop}
                        title={"Back"}
                        shortcut={{
                            windows: { modifiers: ["ctrl"], key: "j" },
                            macOS: { modifiers: ["cmd"], key: "j" },
                        }}
                    />
                </ActionPanel>
            }
        >
            {data?.map((item) => (
                <Grid.Item
                    key={item.image_id}
                    content={item.url}
                    subtitle={item.ocr?.description || item.metadata?.title}
                    actions={
                        <ActionPanel>
                            <Action.OpenInBrowser url={item.permalink_url} />
                            <Action.CopyToClipboard title="Copy Image URL" content={item.url} />
                            <Action
                                onAction={pop}
                                title={"Back"}
                                shortcut={{
                                    windows: { modifiers: ["ctrl"], key: "j" },
                                    macOS: { modifiers: ["cmd"], key: "j" },
                                }}
                            />
                        </ActionPanel>
                    }
                />
            ))}
        </Grid>
    );
}
