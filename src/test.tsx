import { Action, ActionPanel, Keyboard, List } from "@raycast/api";

export default function Command() {
    return (
        <List
            actions={
                <ActionPanel title="Game controls">
                    <Action
                        title="Up"
                        shortcut={{ modifiers: ["opt"], key: "arrowUp" }}
                        onAction={() => console.log("Go up")}
                    />
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
                </ActionPanel>
            }
        />
    );
}
