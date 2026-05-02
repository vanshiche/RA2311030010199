"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BarChartIcon from "@mui/icons-material/BarChart";
import WorkIcon from "@mui/icons-material/Work";
import CheckIcon from "@mui/icons-material/Check";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { Notification, NotificationType } from "@/types/notification";
import { useReadState } from "@/context/ReadStateContext";
import { createLogger } from "@/lib/logger";

const logger = createLogger("NotificationCard", "component");

// ─── Type Config ──────────────────────────────────────────────────────────────

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

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(timestamp: string): string {
  const date = new Date(timestamp.replace(" ", "T"));
  if (isNaN(date.getTime())) return timestamp;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationCardProps {
  notification: Notification;
}

export default function NotificationCard({ notification }: NotificationCardProps) {
  const { markAsRead, isRead } = useReadState();
  const [hovered, setHovered] = useState(false);

  const read = isRead(notification.ID);
  const config = TYPE_CONFIG[notification.Type];
  const { Icon } = config;

  const handleClick = () => {
    if (!read) {
      logger.info("Notification marked as read", { id: notification.ID });
      markAsRead(notification.ID);
    }
  };

  return (
    <Box
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        bgcolor: "#111111",
        border: "1px solid",
        borderColor: hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)",
        borderRadius: "16px",
        p: "16px 20px",
        cursor: "pointer",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.4)" : "none",
        userSelect: "none",
      }}
    >
      {/* Top row: icon + badge + actions + dot */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Type icon */}
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              bgcolor: config.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 14, color: config.badgeColor }} />
          </Box>

          {/* Type badge */}
          <Box
            sx={{
              px: 1.25,
              py: 0.3,
              borderRadius: "20px",
              bgcolor: config.badgeBg,
              color: config.badgeColor,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.6,
            }}
          >
            {config.label}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {/* Action icons — show on hover */}
          {hovered && (
            <>
              <Box
                component="button"
                title="Mark as read"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); markAsRead(notification.ID); }}
                sx={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#71717A", p: 0.5, borderRadius: "6px",
                  display: "flex", alignItems: "center",
                  "&:hover": { color: "#A1A1AA", bgcolor: "rgba(255,255,255,0.06)" },
                  transition: "all 0.15s ease",
                }}
              >
                <CheckIcon sx={{ fontSize: 15 }} />
              </Box>
              <Box
                component="button"
                title="Archive"
                sx={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#71717A", p: 0.5, borderRadius: "6px",
                  display: "flex", alignItems: "center",
                  "&:hover": { color: "#A1A1AA", bgcolor: "rgba(255,255,255,0.06)" },
                  transition: "all 0.15s ease",
                }}
              >
                <ArchiveIcon sx={{ fontSize: 15 }} />
              </Box>
              <Box
                component="button"
                title="Delete"
                sx={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#71717A", p: 0.5, borderRadius: "6px",
                  display: "flex", alignItems: "center",
                  "&:hover": { color: "#EF4444", bgcolor: "rgba(239,68,68,0.08)" },
                  transition: "all 0.15s ease",
                }}
              >
                <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
              </Box>
            </>
          )}

          {/* Unread dot */}
          {!read && (
            <Box
              sx={{
                width: 8, height: 8,
                borderRadius: "50%",
                bgcolor: "#3B82F6",
                flexShrink: 0,
              }}
            />
          )}
        </Box>
      </Box>

      {/* Message */}
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: read ? 400 : 500,
          color: read ? "#A1A1AA" : "#FFFFFF",
          lineHeight: 1.55,
          mb: 0.75,
        }}
      >
        {notification.Message}
      </Typography>

      {/* Timestamp */}
      <Typography sx={{ fontSize: 13, color: "#71717A" }}>
        {relativeTime(notification.Timestamp)}
      </Typography>
    </Box>
  );
}
