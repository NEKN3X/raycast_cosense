interface SearchResponse {
    projectName: string;
    searchQuery: string;
    pages: Array<{
        id: string;
        title: string;
        image: string;
        lines: string[];
    }>;
}

export async function searchPages(query: string, projects: string[], sid?: string, signal?: AbortSignal): Promise<SearchResponse[]> {
    if (projects.length === 0 || query.trim() === "") {
        return Promise.resolve([]);
    }
    const urlList = projects.map((project) => `https://scrapbox.io/api/pages/${project}/search/query?q=${query}`);
    const responses = await Promise.all(
        urlList.map((u) => fetch(u, {
            signal,
            headers: { Cookie: `connect.sid=${sid}` },
        })));
    const result = await Promise.all(responses.map((r) => r.json()));
    console.log(result);
    return result as SearchResponse[];
}
