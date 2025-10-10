export interface Preferences {
    sid?: string;
    projects: string;
    gyazoAccessToken?: string;
    searchEngine: string;
}

export interface GyazoSearchResponse {
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

export interface ScrapboxSearchResponse {
    projectName: string;
    searchQuery: string;
    pages: Array<{
        id: string;
        title: string;
        image: string;
        lines: string[];
    }>;
}
