"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import {
  Box, IconButton, Tooltip, Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import CenterFocusWeakIcon from "@mui/icons-material/CenterFocusWeak";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import DarkModeIcon from "@mui/icons-material/DarkMode";

interface AppShellProps {
  children: React.ReactNode;
  unreadCount?: number;
}

export default function AppShell({ children, unreadCount = 0 }: AppShellProps) {
  const pathname = usePathname();
  const [darkMode] = useState(true);

  const isNotifications = pathname === "/notifications" || pathname === "/";
  const isPriority = pathname === "/priority";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#000" }}>
      {/* ─── Sticky Navbar ─────────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          bgcolor: "#111111",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          px: { xs: 2, sm: 3 },
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left — Logo */}
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 18,
            color: "#fff",
            letterSpacing: "-0.3px",
          }}
        >
          Campus Notifications
        </Typography>

        {/* Right — Nav tabs + icons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
          {/* All Notifications tab */}
          <Box
            component={NextLink}
            href="/notifications"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1,
              py: 0.5,
              textDecoration: "none",
              color: isNotifications ? "#fff" : "#71717A",
              fontWeight: isNotifications ? 500 : 400,
              fontSize: 14,
              whiteSpace: "nowrap",
              position: "relative",
              transition: "color 0.2s ease",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: -4,
                left: 0,
                right: 0,
                height: 2,
                borderRadius: 1,
                bgcolor: isNotifications ? "#3B82F6" : "transparent",
                transition: "background-color 0.2s ease",
              },
              "&:hover": { color: "#fff" },
            }}
          >
            <NotificationsIcon sx={{ fontSize: 16 }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              All Notifications
            </Box>
            {unreadCount > 0 && (
              <Box
                sx={{
                  ml: 0.5,
                  bgcolor: "#3B82F6",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  px: 0.6,
                  py: 0.1,
                  borderRadius: "10px",
                  lineHeight: 1.6,
                  minWidth: 18,
                  textAlign: "center",
                }}
              >
                {unreadCount}
              </Box>
            )}
          </Box>

          {/* Priority tab */}
          <Box
            component={NextLink}
            href="/priority"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1,
              py: 0.5,
              textDecoration: "none",
              color: isPriority ? "#fff" : "#71717A",
              fontWeight: isPriority ? 500 : 400,
              fontSize: 14,
              position: "relative",
              transition: "color 0.2s ease",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: -4,
                left: 0,
                right: 0,
                height: 2,
                borderRadius: 1,
                bgcolor: isPriority ? "#3B82F6" : "transparent",
                transition: "background-color 0.2s ease",
              },
              "&:hover": { color: "#fff" },
            }}
          >
            <StarOutlinedIcon sx={{ fontSize: 16 }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Priority
            </Box>
          </Box>

          {/* Divider */}
          <Box sx={{ width: 1, height: 24, bgcolor: "rgba(255,255,255,0.1)" }} />

          {/* Icon buttons */}
          <Tooltip title="Focus mode">
            <IconButton size="small" sx={{ color: "#71717A", "&:hover": { color: "#fff" } }}>
              <CenterFocusWeakIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Keyboard shortcuts">
            <IconButton size="small" sx={{ color: "#71717A", "&:hover": { color: "#fff" } }}>
              <KeyboardIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Dark mode toggle */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: darkMode ? "#1F2937" : "#374151",
              borderRadius: "20px",
              px: 0.5,
              py: 0.5,
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DarkModeIcon sx={{ fontSize: 16, color: "#3B82F6" }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ─── Page Content ───────────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          maxWidth: 840,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
