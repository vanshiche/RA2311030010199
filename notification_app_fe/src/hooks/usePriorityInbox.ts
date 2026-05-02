/**
 * usePriorityInbox Hook
 *
 * Fetches all notifications then runs the client-side min-heap
 * priority engine to return the top-N highest priority items.
 * Supports dynamic N (10, 15, 20).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { ScoredNotification } from "@/types/notification";
import { fetchNotifications } from "@/services/notificationService";
import { getTopN } from "@/lib/priorityEngine";
import { createLogger } from "@/lib/logger";

const logger = createLogger("usePriorityInbox", "hook");

const VALID_N = [10, 15, 20] as const;
export type TopNValue = (typeof VALID_N)[number];

interface UsePriorityInboxReturn {
  results: ScoredNotification[];
  loading: boolean;
  error: string | null;
  topN: TopNValue;
  setTopN: (n: TopNValue) => void;
  retry: () => void;
}

export function usePriorityInbox(): UsePriorityInboxReturn {
  const [results, setResults] = useState<ScoredNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topN, setTopNState] = useState<TopNValue>(10);
  const [trigger, setTrigger] = useState(0);

  const retry = useCallback(() => {
    logger.info("Retry triggered");
    setError(null);
    setTrigger((t) => t + 1);
  }, []);

  const setTopN = useCallback((n: TopNValue) => {
    logger.info("Top-N changed", { from: topN, to: n });
    setTopNState(n);
  }, [topN]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      logger.info("Loading priority inbox", { topN });

      try {
        // Fetch all notifications — no type filter for priority inbox
        const data = await fetchNotifications();

        if (cancelled) return;

        logger.info("Raw data fetched for priority computation", {
          count: data.length,
          topN,
        });

        // Run min-heap priority engine
        const scored = getTopN(data, topN);

        logger.info("Priority inbox state updated", {
          resultCount: scored.length,
          topN,
          topItem: scored[0]?.notification?.Type,
        });

        setResults(scored);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("Failed to load priority inbox", { error: msg });
        setError(msg);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [topN, trigger]);

  return { results, loading, error, topN, setTopN, retry };
}
