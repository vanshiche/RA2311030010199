"use client";

import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";
import PriorityCard from "./PriorityCard";
import { ScoredNotification } from "@/types/notification";

interface PriorityListProps {
  results: ScoredNotification[];
  loading: boolean;
}

export default function PriorityList({ results, loading }: PriorityListProps) {
  if (loading) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={100} animation="wave" />
        ))}
      </Stack>
    );
  }

  return (
    <Box>
      <Stack spacing={1.5}>
        {results.map((item) => (
          <PriorityCard key={item.notification.ID} item={item} />
        ))}
      </Stack>
    </Box>
  );
}
