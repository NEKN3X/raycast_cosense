import { getPreferenceValues, List } from "@raycast/api";
import { useEffect, useState, useCallback } from "react";
import { debounce } from "./utils";

interface Preferences {
  sid: string;
  projects: string;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const preferences = getPreferenceValues<Preferences>(); // TODO: 検索API実装時に使用

  const debouncedSearch = useCallback(
    debounce((...args) => {
      const query = args[0] as string;
    }, 300),
    [],
  );

  useEffect(() => {
    if (searchText.trim()) {
      debouncedSearch(searchText);
    }
  }, [searchText, debouncedSearch]);

  return (
    <List onSearchTextChange={setSearchText}>
      <List.Section title="Lager">
        <List.Item title="Camden Hells" />
      </List.Section>
      <List.Section title="IPA">
        <List.Item title="Sierra Nevada IPA" />
      </List.Section>
    </List>
  );
}
