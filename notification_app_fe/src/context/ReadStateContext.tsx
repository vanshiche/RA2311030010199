/**
 * ReadStateContext — Read/Unread Notification State
 *
 * Manages which notifications have been read.
 * State is persisted to localStorage so it survives page refreshes.
 * No backend required — pure frontend state management.
 */

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ReadStateContext", "state");

const STORAGE_KEY = "campus_notifications_read_ids";

interface ReadStateContextType {
  readIds: Set<string>;
  markAsRead: (id: string) => void;
  markAllAsRead: (ids: string[]) => void;
  isRead: (id: string) => boolean;
  unreadCount: (ids: string[]) => number;
}

const ReadStateContext = createContext<ReadStateContextType | null>(null);

export function ReadStateProvider({ children }: { children: React.ReactNode }) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Load persisted read state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        logger.info("Read state loaded from localStorage", {
          count: parsed.length,
        });
        setReadIds(new Set(parsed));
      }
    } catch (err) {
      logger.warn("Failed to parse read state from localStorage", { err });
    }
  }, []);

  const persist = useCallback((ids: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
      logger.debug("Read state persisted", { count: ids.size });
    } catch (err) {
      logger.warn("Failed to persist read state", { err });
    }
  }, []);

  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        logger.info("Notification marked as read", { id });
        const next = new Set(prev);
        next.add(id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const markAllAsRead = useCallback(
    (ids: string[]) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        logger.info("All visible notifications marked as read", {
          count: ids.length,
          total: next.size,
        });
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const isRead = useCallback(
    (id: string) => readIds.has(id),
    [readIds]
  );

  const unreadCount = useCallback(
    (ids: string[]) => ids.filter((id) => !readIds.has(id)).length,
    [readIds]
  );

  return (
    <ReadStateContext.Provider
      value={{ readIds, markAsRead, markAllAsRead, isRead, unreadCount }}
    >
      {children}
    </ReadStateContext.Provider>
  );
}

export function useReadState(): ReadStateContextType {
  const ctx = useContext(ReadStateContext);
  if (!ctx) {
    throw new Error("useReadState must be used within a ReadStateProvider");
  }
  return ctx;
}
