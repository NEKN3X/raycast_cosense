import { Action, ActionPanel, Grid, openExtensionPreferences, useNavigation } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { GyazoSearchResponse } from "./types";

export type Props = {
    token: string;
};

export function PushGyazoImagesAction({ token }: { token?: string }) {
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
                else push(<GyazoImages token={token} />);
            }}
        />
    );
}

export default function GyazoImages({ token }: Props) {
    const { pop } = useNavigation();
    const { isLoading, data } = useFetch("https://api.gyazo.com/api/images", {
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
                        title="Back"
                        onAction={pop}
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
                                title="Back"
                                onAction={pop}
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
