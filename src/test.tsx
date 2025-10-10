import {
    Action,
    ActionPanel,
    getPreferenceValues,
    Keyboard,
    List,
    openExtensionPreferences,
    useNavigation,
} from "@raycast/api";
import { useState } from "react";
import Gyazo from "./gyazo";

export default function Command() {
    const [searchText, setSearchText] = useState("");
    const preferences = getPreferenceValues<Preferences>();
    const { push } = useNavigation();

    return (
        <List
            onSearchTextChange={setSearchText}
            actions={
                <ActionPanel>
                    <Action.OpenInBrowser
                        title="Web Search"
                        shortcut={{ modifiers: ["shift"], key: "enter" }}
                        url={preferences.searchEngine.replaceAll("{query}", searchText)}
                    />
                    {searchText.length > 0 && (
                        <Action
                            title="Gyazo"
                            shortcut={{
                                windows: { modifiers: ["ctrl"], key: "j" },
                                macOS: { modifiers: ["cmd"], key: "j" },
                            }}
                            onAction={() => {
                                const token = preferences.gyazoAccessToken;
                                if (!token) openExtensionPreferences();
                                else push(<Gyazo searchText={searchText} token={token} />);
                            }}
                        />
                    )}
                    <ActionPanel.Submenu title="Add Label">
                        <Action
                            title="Down"
                            shortcut={{ modifiers: ["opt"], key: "arrowDown" }}
                            onAction={() => console.log("Go down")}
                        />
                        <Action
                            title="Left"
                            shortcut={{ modifiers: ["opt"], key: "arrowLeft" }}
                            onAction={() => console.log("Go left")}
                        />
                        <Action
                            title="Right"
                            shortcut={{ modifiers: ["opt"], key: "arrowRight" }}
                            onAction={() => console.log("Go right")}
                        />
                        <Action
                            title="Open"
                            shortcut={Keyboard.Shortcut.Common.Open}
                            onAction={() => console.log("Open")}
                        />
                    </ActionPanel.Submenu>
                </ActionPanel>
            }
        />
    );
}
