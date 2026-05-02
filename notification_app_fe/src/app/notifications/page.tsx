"use client";

import React, { useMemo, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BarChartIcon from "@mui/icons-material/BarChart";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import SearchIcon from "@mui/icons-material/Search";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import NotificationCard from "@/components/Notifications/NotificationCard";
import AppShell from "@/components/Layout/AppShell";
import EmptyState from "@/components/Notifications/EmptyState";
import { useNotifications } from "@/hooks/useNotifications";
import { useReadState } from "@/context/ReadStateContext";
import { Notification, FilterType } from "@/types/notification";
import { createLogger } from "@/lib/logger";

const logger = createLogger("NotificationsPage", "page");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function parseTs(ts: string): Date {
  return new Date(ts.replace(" ", "T"));
}

function isToday(ts: string): boolean {
  const d = parseTs(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isYesterday(ts: string): boolean {
  const d = parseTs(ts);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
}

function dateLabel(ts: string): string {
  if (isToday(ts)) return "TODAY";
  if (isYesterday(ts)) return "YESTERDAY";
  return parseTs(ts).toLocaleDateString("en-US", { month: "long", day: "numeric" }).toUpperCase();
}

interface DateGroup { label: string; items: Notification[]; }

function groupByDate(notifications: Notification[]): DateGroup[] {
  const groups: Map<string, Notification[]> = new Map();
  // notifications already sorted newest→oldest by the hook
  for (const n of notifications) {
    const label = dateLabel(n.Timestamp);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(n);
  }

  // Sort groups: TODAY first, YESTERDAY second, then older dates newest→oldest
  const order = (label: string) => {
    if (label === "TODAY") return 0;
    if (label === "YESTERDAY") return 1;
    return 2; // older, but insertion order already newest→oldest
  };

  return Array.from(groups.entries())
    .sort(([a], [b]) => order(a) - order(b))
    .map(([label, items]) => ({ label, items }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroCard({ unreadCount }: { unreadCount: number }) {
  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)",
        borderRadius: "20px",
        p: "24px 28px",
        mb: 3,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
        <AutoAwesomeIcon sx={{ fontSize: 16, color: "#3B82F6" }} />
        <Typography sx={{ fontSize: 14, color: "#3B82F6", fontWeight: 500 }}>
          {greeting()}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#fff", mb: 0.5 }}>
        Welcome back, Student
      </Typography>
      <Typography sx={{ fontSize: 14, color: "#A1A1AA" }}>
        You have {unreadCount} new notification{unreadCount !== 1 ? "s" : ""}
      </Typography>
    </Box>
  );
}

function StatsGrid({
  total, unread, read, today,
}: { total: number; unread: number; read: number; today: number }) {
  const stats = [
    { label: "Total",  value: total,  Icon: NotificationsIcon,      iconBg: "#1D4ED8",  iconColor: "#93C5FD" },
    { label: "Unread", value: unread, Icon: AccessTimeIcon,          iconBg: "#92400E",  iconColor: "#FCD34D" },
    { label: "Read",   value: read,   Icon: CheckCircleOutlinedIcon,  iconBg: "#166534",  iconColor: "#86EFAC" },
    { label: "Today",  value: today,  Icon: TrendingUpIcon,          iconBg: "#581C87",  iconColor: "#D8B4FE" },
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5, mb: 3 }}>
      {stats.map(({ label, value, Icon, iconBg, iconColor }) => (
        <Box
          key={label}
          sx={{
            bgcolor: "#151515",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px",
            p: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 36, height: 36, borderRadius: "10px",
              bgcolor: iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 18, color: iconColor }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
              {value}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#71717A", mt: 0.25 }}>
              {label}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Box
      sx={{
        display: "flex", alignItems: "center",
        bgcolor: "#151515",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        px: 2, py: 1.25,
        mb: 2.5, gap: 1.25,
      }}
    >
      <SearchIcon sx={{ fontSize: 18, color: "#71717A", flexShrink: 0 }} />
      <Box
        component="input"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="Search notifications..."
        sx={{
          flex: 1, background: "none", border: "none", outline: "none",
          color: "#fff", fontSize: 14, fontFamily: "inherit",
          "&::placeholder": { color: "#71717A" },
        }}
      />
      <Box
        sx={{
          px: 1, py: 0.25, borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#71717A", fontSize: 11, fontFamily: "monospace",
          letterSpacing: 0.5,
        }}
      >
        ⌘K
      </Box>
    </Box>
  );
}

function FilterTabs({
  filter,
  onChange,
}: {
  filter: FilterType;
  onChange: (f: FilterType) => void;
}) {
  const filters: FilterType[] = ["All", "Event", "Result", "Placement"];
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
      {filters.map((f) => (
        <Box
          key={f}
          component="button"
          onClick={() => onChange(f)}
          sx={{
            px: 2, py: 0.75,
            borderRadius: "20px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: "1px solid",
            fontFamily: "inherit",
            ...(filter === f
              ? {
                  bgcolor: "#3B82F6",
                  color: "#fff",
                  borderColor: "#3B82F6",
                }
              : {
                  bgcolor: "#151515",
                  color: "#A1A1AA",
                  borderColor: "rgba(255,255,255,0.1)",
                  "&:hover": { borderColor: "rgba(255,255,255,0.2)", color: "#fff" },
                }),
          }}
        >
          {f}
        </Box>
      ))}
    </Box>
  );
}

function DateGroupHeader({ label }: { label: string }) {
  return (
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        color: "#71717A",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        mb: 1.5,
        mt: 0.5,
      }}
    >
      {label}
    </Typography>
  );
}

function PaginationBar({
  page, total, onChange,
}: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mt: 3 }}>
      <Box
        component="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        sx={{
          width: 36, height: 36, borderRadius: "10px",
          bgcolor: "#151515", border: "1px solid rgba(255,255,255,0.08)",
          color: page === 1 ? "#3A3A3A" : "#A1A1AA",
          cursor: page === 1 ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontFamily: "inherit",
          transition: "all 0.2s",
          "&:hover:not(:disabled)": { borderColor: "rgba(255,255,255,0.2)", color: "#fff" },
        }}
      >
        ‹
      </Box>
      {pages.map((p) => (
        <Box
          key={p}
          component="button"
          onClick={() => onChange(p)}
          sx={{
            width: 36, height: 36, borderRadius: "10px",
            fontFamily: "inherit",
            fontSize: 14, fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
            ...(p === page
              ? { bgcolor: "#3B82F6", color: "#fff", border: "1px solid #3B82F6" }
              : {
                  bgcolor: "#151515",
                  color: "#A1A1AA",
                  border: "1px solid rgba(255,255,255,0.08)",
                  "&:hover": { borderColor: "rgba(255,255,255,0.2)", color: "#fff" },
                }),
          }}
        >
          {p}
        </Box>
      ))}
      <Box
        component="button"
        onClick={() => onChange(Math.min(total, page + 1))}
        disabled={page === total}
        sx={{
          width: 36, height: 36, borderRadius: "10px",
          bgcolor: "#151515", border: "1px solid rgba(255,255,255,0.08)",
          color: page === total ? "#3A3A3A" : "#A1A1AA",
          cursor: page === total ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontFamily: "inherit",
          transition: "all 0.2s",
          "&:hover:not(:disabled)": { borderColor: "rgba(255,255,255,0.2)", color: "#fff" },
        }}
      >
        ›
      </Box>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const {
    allNotifications, loading, error, filter, setFilter, retry,
  } = useNotifications();
  const { markAllAsRead, unreadCount, isRead } = useReadState();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const allIds = allNotifications.map((n) => n.ID);
  const unread = unreadCount(allIds);
  const readCount = allIds.length - unread;

  const todayCount = useMemo(
    () => allNotifications.filter((n) => isToday(n.Timestamp)).length,
    [allNotifications]
  );

  // Filter by search + type (allNotifications already sorted newest→oldest)
  const filtered = useMemo(() => {
    let result = allNotifications;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.Message.toLowerCase().includes(q) ||
          n.Type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allNotifications, search]);

  // Paginate the sorted+filtered list (10 per page), then group
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage, PAGE_SIZE]);

  // Group only the current page's 10 items — correct order guaranteed by sort
  const groups = useMemo(() => groupByDate(pageSlice), [pageSlice]);

  const handleSetPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to page 1 on filter/search change
  const handleFilterChange = (f: FilterType) => { setFilter(f); setSearch(""); setPage(1); };
  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };

  const handleMarkAllRead = () => {
    logger.info("Mark all read triggered");
    markAllAsRead(allIds);
  };

  logger.debug("NotificationsPage render", { count: allNotifications.length, filter, loading });

  return (
    <AppShell unreadCount={unread}>
      {/* Hero */}
      <HeroCard unreadCount={unread} />

      {/* Section header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 600, color: "#fff" }}>
          All Notifications
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer",
              color: "#3B82F6", fontSize: 13, fontWeight: 500, "&:hover": { color: "#60A5FA" } }}
          >
            <BarChartIcon sx={{ fontSize: 15 }} />
            Insights
          </Box>
          <Box
            component="button"
            onClick={handleMarkAllRead}
            sx={{
              display: "flex", alignItems: "center", gap: 0.75,
              background: "none", border: "none",
              cursor: "pointer", color: "#3B82F6", fontSize: 13,
              fontWeight: 500, fontFamily: "inherit",
              "&:hover": { color: "#60A5FA" },
            }}
          >
            <DoneAllIcon sx={{ fontSize: 15 }} />
            Mark all read
          </Box>
        </Box>
      </Box>

      {/* Stats */}
      <StatsGrid
        total={allNotifications.length}
        unread={unread}
        read={readCount}
        today={todayCount}
      />

      {/* Search */}
      <SearchBar value={search} onChange={handleSearchChange} />

      {/* Filter tabs */}
      <FilterTabs filter={filter} onChange={handleFilterChange} />

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2, bgcolor: "#1A0000", color: "#FCA5A5", border: "1px solid #7F1D1D" }}
          action={
            <Box
              component="button"
              onClick={retry}
              sx={{ background: "none", border: "none", color: "#FCA5A5", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
            >
              Retry
            </Box>
          }
        >
          {error}
        </Alert>
      )}

      {/* Content */}
      {error ? (
        <EmptyState type="error" message={error} onRetry={retry} />
      ) : !loading && filtered.length === 0 ? (
        <EmptyState
          type="empty"
          message={
            search ? `No results for "${search}"` :
            filter !== "All" ? `No ${filter} notifications found.` :
            "No notifications available."
          }
        />
      ) : (
        <>
          {/* Loading skeleton */}
          {loading && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {[1, 2, 3].map((i) => (
                <Box
                  key={i}
                  sx={{
                    bgcolor: "#111", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "16px", p: "20px",
                    animation: "pulse 1.5s ease-in-out infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.4 },
                    },
                  }}
                >
                  <Box sx={{ height: 12, bgcolor: "#222", borderRadius: 1, width: "30%", mb: 1.5 }} />
                  <Box sx={{ height: 14, bgcolor: "#222", borderRadius: 1, width: "80%", mb: 1 }} />
                  <Box sx={{ height: 12, bgcolor: "#222", borderRadius: 1, width: "20%" }} />
                </Box>
              ))}
            </Box>
          )}

          {/* Grouped cards */}
          {!loading && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {groups.map((group) => (
                <Box key={group.label} sx={{ mb: 2 }}>
                  <DateGroupHeader label={group.label} />
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {group.items.map((n) => (
                      <NotificationCard key={n.ID} notification={n} />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Pagination */}
          {!loading && <PaginationBar page={currentPage} total={totalPages} onChange={handleSetPage} />}
        </>
      )}
    </AppShell>
  );
}
