"use client";

import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import { TopNValue } from "@/hooks/usePriorityInbox";
import { createLogger } from "@/lib/logger";

const logger = createLogger("TopNSelector", "component");

const OPTIONS: TopNValue[] = [10, 15, 20];

interface TopNSelectorProps {
  value: TopNValue;
  onChange: (n: TopNValue) => void;
}

export default function TopNSelector({ value, onChange }: TopNSelectorProps) {
  const handleChange = (e: SelectChangeEvent<number>) => {
    const n = Number(e.target.value) as TopNValue;
    logger.info("TopNSelector: value changed", { from: value, to: n });
    onChange(n);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <LeaderboardIcon color="primary" />
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
        Show top
      </Typography>
      <FormControl size="small" sx={{ minWidth: 80 }}>
        <InputLabel id="topn-label">N</InputLabel>
        <Select
          labelId="topn-label"
          id="topn-select"
          value={value}
          label="N"
          onChange={handleChange}
        >
          {OPTIONS.map((n) => (
            <MenuItem key={n} value={n}>{n}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography variant="body2" color="text.secondary">
        priority notifications
      </Typography>
    </Box>
  );
}
