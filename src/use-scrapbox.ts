import { useState, useEffect, useRef } from "react";
import { Cache } from "@raycast/api";
import { ProjectCache } from "./types";
import { syncProject } from "./scrapbox-sync";

const cache = new Cache();

/**
 * Scrapboxプロジェクトのデータを管理するカスタムフック
 * キャッシュからの即時復帰と、バックグラウンドでの差分同期を行う
 */
export function useScrapboxProject(project: string, sid?: string) {
  const cacheKey = `data-${project}`;

  // 1. キャッシュから初期データを読み込む（useStateの初期化関数を使用）
  const [data, setData] = useState<ProjectCache>(() => {
    const cached = cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as ProjectCache;
      } catch (e) {
        console.error(`Failed to parse cache for ${project}`, e);
      }
    }
    // 初期値
    return {
      project,
      lastSyncTime: 0,
      pageUpdatedMap: {},
      helpfeels: [],
      titles: [],
      glossary: {},
    };
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // マウント状態を追跡するRef（非同期処理完了後の状態更新を安全にするため）
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    async function performSync() {
      // プロジェクトが空の場合は何もしない
      if (!project) return;

      setIsLoading(true);
      setError(null);

      try {
        // バックグラウンドで差分同期を実行
        const updatedData = await syncProject(project, sid);

        if (isMounted.current) {
          setData(updatedData);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          console.error(`[Sync Error: ${project}]`, err);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    }

    performSync();

    // クリーンアップ関数
    return () => {
      isMounted.current = false;
    };
  }, [project, sid]); // プロジェクトやSIDが変わった時に再実行

  return {
    data,
    isLoading,
    error,
    // 手動でリフレッシュしたい場合のための関数
    revalidate: () => {
      // 既存の pageUpdatedMap をクリアして再実行するロジックなどを追加可能
    },
  };
}
