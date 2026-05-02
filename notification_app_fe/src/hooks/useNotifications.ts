/**
 * useNotifications Hook
 *
 * Manages the All Notifications page state:
 *   - Fetching with pagination (page, limit)
 *   - Filtering by notification_type
 *   - Loading, error, and empty states
 *   - Logging every state transition
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Notification, FilterType } from "@/types/notification";
import { fetchNotifications } from "@/services/notificationService";
import { createLogger } from "@/lib/logger";

const logger = createLogger("useNotifications", "hook");

const PAGE_SIZE = 10;

interface UseNotificationsReturn {
  notifications: Notification[];    // current page slice
  allNotifications: Notification[]; // all fetched, sorted newest-first
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  filter: FilterType;
  setPage: (p: number) => void;
  setFilter: (f: FilterType) => void;
  retry: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [filter, setFilterState] = useState<FilterType>("All");
  const [totalPages, setTotalPages] = useState(1);
  const [trigger, setTrigger] = useState(0);

  const retry = useCallback(() => {
    logger.info("Retrying fetch");
    setError(null);
    setTrigger((t) => t + 1);
  }, []);

  const setPage = useCallback((p: number) => {
    logger.debug("Page changed", { from: page, to: p });
    setPageState(p);
  }, [page]);

  const setFilter = useCallback((f: FilterType) => {
    logger.info("Filter changed", { from: filter, to: f });
    setFilterState(f);
    setPageState(1); // reset to page 1 on filter change
  }, [filter]);

  // Fetch ALL notifications once (API supports filtering via param)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      logger.info("Loading notifications", { filter, page });

      try {
        const params =
          filter !== "All"
            ? { notification_type: filter }
            : {};

        const data = await fetchNotifications(params);

        if (cancelled) return;

        // Sort newest → oldest so TODAY always appears before YESTERDAY
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.Timestamp.replace(" ", "T")).getTime() -
            new Date(a.Timestamp.replace(" ", "T")).getTime()
        );

        logger.info("State update: allNotifications", { count: sorted.length, filter });
        setAllNotifications(sorted);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        logger.error("Failed to load notifications", { error: msg });
        setError(msg);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [filter, trigger]);

  // Slice for current page whenever allNotifications or page changes
  useEffect(() => {
    if (!allNotifications.length && !loading) {
      setNotifications([]);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    const total = Math.max(1, Math.ceil(allNotifications.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const slice = allNotifications.slice(start, start + PAGE_SIZE);

    logger.debug("Paginating", { page, total, sliceSize: slice.length });

    setTotalPages(total);
    setNotifications(slice);
    setLoading(false);
  }, [allNotifications, page, loading]);

  return {
    notifications,
    allNotifications,
    loading,
    error,
    page,
    totalPages,
    filter,
    setPage,
    setFilter,
    retry,
  };
}
