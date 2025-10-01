interface SearchResponse {
    image_id: string;
    permalink_url: string;
    thumb_url: string;
    url: string;
    type: string;
    created_at: string;
    metadata?: {
        app: string;
        title: string;
        url: string;
        desc: string;
    };
    ocr?: {
        locale: string;
        description: string;
    };
    alt_text: string;
}

export async function searchGyazo(query: string, token?: string, signal?: AbortSignal): Promise<SearchResponse[]> {
    if (!token) {
        return Promise.resolve([]);
    }
    const params = new URLSearchParams({
        query,
    });
    const res = await fetch(query.length > 0 ? `https://api.gyazo.com/api/search?${params}`: 'https://api.gyazo.com/api/images', {
        signal,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const result = await (res.json() as Promise<SearchResponse[]>);
    console.log(result);
    return result.filter((item) => item.image_id !== "");
}
