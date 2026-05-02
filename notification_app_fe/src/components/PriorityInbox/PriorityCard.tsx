"use client";

import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import { NotificationType, ScoredNotification } from "@/types/notification";
import { useReadState } from "@/context/ReadStateContext";
import { createLogger } from "@/lib/logger";

const logger = createLogger("PriorityCard", "component");

const TYPE_CONFIG: Record<NotificationType, { color: string; icon: React.ReactElement }> = {
  Placement: { color: "#1565c0", icon: <WorkIcon fontSize="small" /> },
  Result:    { color: "#2e7d32", icon: <SchoolIcon fontSize="small" /> },
  Event:     { color: "#e65100", icon: <EmojiEventsIcon fontSize="small" /> },
};

function getRankStyle(rank: number): { bg: string; color: string } {
  if (rank === 1) return { bg: "#FFD700", color: "#000" };
  if (rank === 2) return { bg: "#C0C0C0", color: "#000" };
  if (rank === 3) return { bg: "#CD7F32", color: "#fff" };
  return { bg: "#424242", color: "#fff" };
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts.replace(" ", "T")).toLocaleString("en-IN", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch { return ts; }
}

interface PriorityCardProps {
  item: ScoredNotification;
}

export default function PriorityCard({ item }: PriorityCardProps) {
  const { notification, score, rank } = item;
  const { isRead, markAsRead } = useReadState();
  const read = isRead(notification.ID);
  const config = TYPE_CONFIG[notification.Type] ?? TYPE_CONFIG.Event;
  const rankStyle = getRankStyle(rank);

  const handleClick = () => {
    if (!read) {
      logger.info("Priority notification marked read", { id: notification.ID, rank });
      markAsRead(notification.ID);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: read ? "divider" : config.color,
        borderRadius: 2,
        transition: "all 0.2s ease",
        bgcolor: read ? "background.paper" : `${config.color}11`,
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
        position: "relative",
        overflow: "visible",
      }}
    >
      {!read && (
        <FiberManualRecordIcon
          sx={{ position: "absolute", top: -5, left: -5, fontSize: 13, color: config.color }}
        />
      )}

      <CardActionArea onClick={handleClick} sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          {/* Rank Badge */}
          <Box
            sx={{
              minWidth: 36, height: 36, borderRadius: "50%",
              bgcolor: rankStyle.bg, color: rankStyle.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 14, flexShrink: 0,
              boxShadow: rank <= 3 ? 2 : 0,
            }}
          >
            #{rank}
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Type chip + score row */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 0.5 }}>
              <Chip
                icon={config.icon}
                label={notification.Type}
                size="small"
                sx={{
                  bgcolor: `${config.color}22`,
                  color: config.color,
                  borderColor: config.color,
                  fontWeight: 700,
                  fontSize: 11,
                  border: "1px solid",
                }}
              />
              <Tooltip title={`Priority Score: ${score.toLocaleString()}`}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                  <EmojiObjectsIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                  <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", fontSize: 10 }}>
                    {score.toLocaleString()}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>

            {/* Message */}
            <Typography
              variant="body2"
              sx={{ mt: 0.8, textTransform: "capitalize", fontWeight: read ? 400 : 600 }}
            >
              {notification.Message}
            </Typography>

            {/* Timestamp + read status */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.8 }}>
              <Typography variant="caption" color="text.disabled">
                {formatTimestamp(notification.Timestamp)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: read ? "text.disabled" : "primary.main", fontWeight: read ? 400 : 600 }}
              >
                {read ? "Read" : "● Unread"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
}
