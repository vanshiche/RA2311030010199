"use client";

import React from "react";
import { Box, Pagination, Skeleton, Stack } from "@mui/material";
import NotificationCard from "./NotificationCard";
import { Notification } from "@/types/notification";

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export default function NotificationList({
  notifications,
  loading,
  page,
  totalPages,
  onPageChange,
}: NotificationListProps) {
  if (loading) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={96} animation="wave" />
        ))}
      </Stack>
    );
  }

  return (
    <Box>
      <Stack spacing={1.5}>
        {notifications.map((n) => (
          <NotificationCard key={n.ID} notification={n} />
        ))}
      </Stack>

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}
