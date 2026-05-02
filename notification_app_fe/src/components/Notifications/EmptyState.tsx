"use client";

import React from "react";
import { Box, Button } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { Typography } from "@mui/material";

interface EmptyStateProps {
  type: "empty" | "error" | "loading-failed";
  message?: string;
  onRetry?: () => void;
}

export default function EmptyState({ type, message, onRetry }: EmptyStateProps) {
  const config = {
    empty: {
      icon: <InboxIcon sx={{ fontSize: 64, color: "text.disabled" }} />,
      title: "No notifications found",
      subtitle: message || "Try changing the filter or check back later.",
      showRetry: false,
    },
    error: {
      icon: <ReportProblemIcon sx={{ fontSize: 64, color: "error.main" }} />,
      title: "Something went wrong",
      subtitle: message || "Failed to load notifications.",
      showRetry: true,
    },
    "loading-failed": {
      icon: <WifiOffIcon sx={{ fontSize: 64, color: "warning.main" }} />,
      title: "Could not reach the API",
      subtitle: message || "Check your network and try again.",
      showRetry: true,
    },
  }[type];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 300,
        gap: 2,
        p: 4,
        borderRadius: 3,
        bgcolor: "background.paper",
        border: "1px dashed",
        borderColor: "divider",
      }}
    >
      {config.icon}
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
          {config.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {config.subtitle}
        </Typography>
      </Box>
      {config.showRetry && onRetry && (
        <Button variant="contained" onClick={onRetry} sx={{ mt: 1, textTransform: "none" }}>
          Try Again
        </Button>
      )}
    </Box>
  );
}
