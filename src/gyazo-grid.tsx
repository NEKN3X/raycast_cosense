import { Action, ActionPanel, Grid, Icon } from "@raycast/api";
import { GyazoSearchResponse } from "./types";

/**
 * Gyazo の画像グループを Grid で表示する。
 */
export function GyazoGroupGrid({
  images,
  title,
}: {
  images: GyazoSearchResponse[];
  title: string;
}) {
  return (
    <Grid
      navigationTitle={title}
      searchBarPlaceholder="Filter images..."
    >
      <Grid.Section title={title}>
        {images.map((img) => (
          <Grid.Item
            key={img.image_id}
            content={img.thumb_url}
            subtitle={img.metadata?.app}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser url={img.permalink_url} title="Open Gyazo" />
                {img.metadata?.url && (
                  <Action.OpenInBrowser url={img.metadata.url} title="Open Capture Source" />
                )}
                <Action.CopyToClipboard title="Copy Image URL" content={img.url} />
                {img.ocr?.description && (
                  <Action.CopyToClipboard title="Copy OCR Text" content={img.ocr.description} />
                )}
              </ActionPanel>
            }
          />
        ))}
      </Grid.Section>
    </Grid>
  );
}
