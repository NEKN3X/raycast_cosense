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

export interface HelpfeelEntry {
  /** 展開後のHelpfeel質問文 */
  text: string;
  /** 元のScrapboxページタイトル */
  pageTitle: string;
  /** % open 行で指定された外部URLテンプレート（任意） */
  openUrl?: string;
  copyText?: string;
}

/**
 * Glossaryページから抽出された静的変数マップ
 * 例: { "os": ["Mac", "Windows", "Linux"] }
 */
export type GlossaryMap = Record<string, string[]>;

export interface ProjectCache {
  /** Scrapboxプロジェクト名 */
  project: string;
  /** 最終同期時刻（UNIXタイムスタンプ） */
  lastSyncTime: number;
  /** 各ページのタイトルとupdated時刻のマップ */
  pageUpdatedMap: Record<string, number>;
  /** 展開済みのHelpfeelエントリ一覧 */
  helpfeels: HelpfeelEntry[];
  /** プロジェクト内の全ページタイトル（検索用） */
  titles: string[];
  /** Glossaryページから抽出された変数定義 */
  glossary: GlossaryMap;
}

/** Scrapbox API: /api/pages/:project/search/titles のレスポンス型 */
export interface SearchTitlesResponse {
  id: string;
  title: string;
  updated: number;
  links: string[];
}

/** Scrapbox API: /api/pages/:project/:title のレスポンス型 */
export interface PageResponse {
  id: string;
  title: string;
  updated: number;
  lines: {
    id: string;
    text: string;
    updated: number;
  }[];
  /** ページに含まれるHelpfeel記法のパース済みリスト（Scrapbox標準機能） */
  helpfeels: string[];
}

/**
 * RaycastのPreferences設定
 * extensionsのpackage.jsonで定義した設定と一致させる
 */
export interface Preferences {
  /** カンマ区切りのプロジェクトリスト */
  projects: string;
  /** Scrapboxのconnect.sid (プライベートプロジェクト用) */
  sid?: string;
  /** デフォルトの検索エンジンURLテンプレート */
  searchEngine: string;
  /** Gyazo Access Token (オプション) */
  gyazoAccessToken?: string;
}
