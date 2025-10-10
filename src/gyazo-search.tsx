import { Action, ActionPanel, Grid, openExtensionPreferences, useNavigation } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { GyazoSearchResponse } from "./types";

export type Props = {
    searchText: string;
    token: string;
};

export function PushGyazoSearchAction({ searchText, token }: { searchText: string; token?: string }) {
    const { push } = useNavigation();
    return (
        <Action
            title="Gyazo Images"
            shortcut={{
                windows: { modifiers: ["ctrl"], key: "j" },
                macOS: { modifiers: ["cmd"], key: "j" },
            }}
            onAction={() => {
                if (!token) openExtensionPreferences();
                else push(<GyazoSearch searchText={searchText} token={token} />);
            }}
        />
    );
}

function PopAction() {
    const { pop } = useNavigation();
    return (
        <Action
            onAction={pop}
            title={"Back"}
            shortcut={{
                windows: { modifiers: ["ctrl"], key: "j" },
                macOS: { modifiers: ["cmd"], key: "j" },
            }}
        />
    );
}

export default function GyazoSearch({ searchText, token }: Props) {
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
                    <PopAction />
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
                            <PopAction />
                        </ActionPanel>
                    }
                />
            ))}
        </Grid>
    );
}
