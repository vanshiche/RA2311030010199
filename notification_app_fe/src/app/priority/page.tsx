"use client";

import React, { useMemo, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BarChartIcon from "@mui/icons-material/BarChart";
import WorkIcon from "@mui/icons-material/Work";
import CheckIcon from "@mui/icons-material/Check";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AppShell from "@/components/Layout/AppShell";
import EmptyState from "@/components/Notifications/EmptyState";
import { usePriorityInbox, TopNValue } from "@/hooks/usePriorityInbox";
import { useReadState } from "@/context/ReadStateContext";
import { ScoredNotification, NotificationType } from "@/types/notification";
import { createLogger } from "@/lib/logger";

const logger = createLogger("PriorityPage", "page");

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; badgeBg: string; badgeColor: string; iconBg: string; Icon: React.ElementType }
> = {
  Event: {
    label: "Event",
    badgeBg: "#1D4ED8",
    badgeColor: "#fff",
    iconBg: "#1E3A8A",
    Icon: CalendarMonthIcon,
  },
  Result: {
    label: "Result",
    badgeBg: "#166534",
    badgeColor: "#86EFAC",
    iconBg: "#14532D",
    Icon: BarChartIcon,
  },
  Placement: {
    label: "Placement",
    badgeBg: "#92400E",
    badgeColor: "#FDE68A",
    iconBg: "#78350F",
    Icon: WorkIcon,
  },
};

// ─── Rank badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const style =
    rank === 1
      ? { bg: "#854D0E", color: "#FDE68A", text: "🏆" }
      : rank === 2
      ? { bg: "#374151", color: "#D1D5DB", text: "🥈" }
      : rank === 3
      ? { bg: "#7C2D12", color: "#FED7AA", text: "🥉" }
      : { bg: "#1F2937", color: "#9CA3AF", text: String(rank) };

  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        bgcolor: style.bg,
        color: style.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: rank <= 3 ? 16 : 13,
        fontWeight: 700,
        flexShrink: 0,
        mt: "10px",
      }}
    >
      {style.text}
    </Box>
  );
}

// ─── Priority card ────────────────────────────────────────────────────────────

function PriorityCard({ item }: { item: ScoredNotification }) {
  const { markAsRead, isRead } = useReadState();
  const [hovered, setHovered] = useState(false);

  const { notification, rank } = item;
  const read = isRead(notification.ID);
  const config = TYPE_CONFIG[notification.Type];
  const { Icon } = config;

  const relativeTime = (ts: string) => {
    const date = new Date(ts.replace(" ", "T"));
    if (isNaN(date.getTime())) return ts;
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  };

  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <RankBadge rank={rank} />

      <Box
        onClick={() => !read && markAsRead(notification.ID)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          flex: 1,
          bgcolor: "#111111",
          border: "1px solid",
          borderColor: hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)",
          borderRadius: "16px",
          p: "16px 20px",
          cursor: "pointer",
          transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* Top row */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 28, height: 28, borderRadius: "8px",
                bgcolor: config.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon sx={{ fontSize: 14, color: config.badgeColor }} />
            </Box>
            <Box
              sx={{
                px: 1.25, py: 0.3, borderRadius: "20px",
                bgcolor: config.badgeBg, color: config.badgeColor,
                fontSize: 12, fontWeight: 600, lineHeight: 1.6,
              }}
            >
              {config.label}
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {hovered && (
              <>
                <Box
                  component="button"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); markAsRead(notification.ID); }}
                  sx={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#71717A", p: 0.5, borderRadius: "6px",
                    display: "flex", alignItems: "center",
                    "&:hover": { color: "#A1A1AA", bgcolor: "rgba(255,255,255,0.06)" },
                  }}
                >
                  <CheckIcon sx={{ fontSize: 15 }} />
                </Box>
                <Box
                  component="button"
                  sx={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#71717A", p: 0.5, borderRadius: "6px",
                    display: "flex", alignItems: "center",
                    "&:hover": { color: "#A1A1AA", bgcolor: "rgba(255,255,255,0.06)" },
                  }}
                >
                  <ArchiveIcon sx={{ fontSize: 15 }} />
                </Box>
                <Box
                  component="button"
                  sx={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#71717A", p: 0.5, borderRadius: "6px",
                    display: "flex", alignItems: "center",
                    "&:hover": { color: "#EF4444", bgcolor: "rgba(239,68,68,0.08)" },
                  }}
                >
                  <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
                </Box>
              </>
            )}
            {!read && (
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#3B82F6", flexShrink: 0 }} />
            )}
          </Box>
        </Box>

        {/* Message */}
        <Typography
          sx={{
            fontSize: 15, fontWeight: read ? 400 : 500,
            color: read ? "#A1A1AA" : "#FFFFFF",
            lineHeight: 1.55, mb: 0.75,
          }}
        >
          {notification.Message}
        </Typography>

        {/* Timestamp */}
        <Typography sx={{ fontSize: 13, color: "#71717A" }}>
          {relativeTime(notification.Timestamp)}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Top-N dropdown ───────────────────────────────────────────────────────────

function TopNDropdown({ value, onChange }: { value: TopNValue; onChange: (n: TopNValue) => void }) {
  const [open, setOpen] = useState(false);
  const options: TopNValue[] = [10, 15, 20];

  return (
    <Box sx={{ position: "relative" }}>
      <Box
        component="button"
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: "flex", alignItems: "center", gap: 0.75,
          px: 2, py: 1,
          bgcolor: "#151515",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "10px",
          color: "#fff", fontSize: 14, fontWeight: 500,
          cursor: "pointer", fontFamily: "inherit",
          transition: "border-color 0.2s",
          "&:hover": { borderColor: "rgba(255,255,255,0.25)" },
        }}
      >
        Top {value}
        <KeyboardArrowDownIcon
          sx={{
            fontSize: 18,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </Box>

      {open && (
        <Box
          sx={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            bgcolor: "#1A1A1A",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "10px",
            overflow: "hidden", zIndex: 50, minWidth: 110,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          }}
        >
          {options.map((opt) => (
            <Box
              key={opt}
              component="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              sx={{
                display: "block", width: "100%", px: 2, py: 1.25,
                background: "none", border: "none",
                color: opt === value ? "#3B82F6" : "#A1A1AA",
                fontSize: 14, fontWeight: opt === value ? 600 : 400,
                cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)", color: "#fff" },
                transition: "all 0.15s",
              }}
            >
              Top {opt}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Box
      sx={{
        display: "flex", alignItems: "center",
        bgcolor: "#151515", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px", px: 2, py: 1.25, mb: 3, gap: 1.25,
      }}
    >
      <SearchIcon sx={{ fontSize: 18, color: "#71717A", flexShrink: 0 }} />
      <Box
        component="input"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="Search priority notifications..."
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
          color: "#71717A", fontSize: 11, fontFamily: "monospace", letterSpacing: 0.5,
        }}
      >
        ⌘K
      </Box>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PriorityPage() {
  const { results, loading, error, topN, setTopN, retry } = usePriorityInbox();
  const { unreadCount } = useReadState();
  const [search, setSearch] = useState("");

  const visibleIds = results.map((r) => r.notification.ID);
  const unread = unreadCount(visibleIds);

  const filtered = useMemo(() => {
    if (!search.trim()) return results;
    const q = search.toLowerCase();
    return results.filter(
      (r) =>
        r.notification.Message.toLowerCase().includes(q) ||
        r.notification.Type.toLowerCase().includes(q)
    );
  }, [results, search]);

  logger.debug("PriorityPage render", { resultCount: results.length, topN, loading, error: !!error });

  return (
    <AppShell unreadCount={unread}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#fff", mb: 0.5 }}>
            Priority Inbox
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#71717A" }}>
            {unread} unread · Top {topN} important notifications
          </Typography>
        </Box>
        <TopNDropdown value={topN} onChange={setTopN} />
      </Box>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

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
            "No notifications available for priority ranking."
          }
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {/* Loading skeletons */}
          {loading && [1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: "flex", gap: 1.5 }}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: "50%",
                  bgcolor: "#1F2937", flexShrink: 0, mt: "10px",
                  animation: "pulse 1.5s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.4 },
                  },
                }}
              />
              <Box
                sx={{
                  flex: 1, bgcolor: "#111", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px", p: "20px",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <Box sx={{ height: 12, bgcolor: "#222", borderRadius: 1, width: "30%", mb: 1.5 }} />
                <Box sx={{ height: 14, bgcolor: "#222", borderRadius: 1, width: "80%", mb: 1 }} />
                <Box sx={{ height: 12, bgcolor: "#222", borderRadius: 1, width: "20%" }} />
              </Box>
            </Box>
          ))}

          {/* Priority cards */}
          {!loading && filtered.map((item) => (
            <PriorityCard key={item.notification.ID} item={item} />
          ))}
        </Box>
      )}
    </AppShell>
  );
}
