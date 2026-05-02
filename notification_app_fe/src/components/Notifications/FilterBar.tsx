"use client";

import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { FilterType } from "@/types/notification";
import { createLogger } from "@/lib/logger";

const logger = createLogger("FilterBar", "component");

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All",       value: "All"       },
  { label: "Placement", value: "Placement" },
  { label: "Result",    value: "Result"    },
  { label: "Event",     value: "Event"     },
];

interface FilterBarProps {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  totalCount: number;
  onMarkAllRead: () => void;
}

export default function FilterBar({ filter, onFilterChange, totalCount, onMarkAllRead }: FilterBarProps) {
  const handleChange = (_: React.MouseEvent<HTMLElement>, newFilter: FilterType | null) => {
    if (!newFilter) return;
    logger.info("Filter selected", { filter: newFilter });
    onFilterChange(newFilter);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 1.5,
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FilterListIcon color="action" fontSize="small" />
        <Typography variant="body2" color="text.secondary">Filter:</Typography>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleChange}
          size="small"
          color="primary"
        >
          {FILTERS.map((f) => (
            <ToggleButton
              key={f.value}
              value={f.value}
              sx={{ px: 1.5, py: 0.5, fontSize: 12, textTransform: "none" }}
            >
              {f.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="caption" color="text.disabled">
          {totalCount} notification{totalCount !== 1 ? "s" : ""}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => { logger.info("Mark all read clicked"); onMarkAllRead(); }}
          sx={{ textTransform: "none", fontSize: 12 }}
        >
          Mark All Read
        </Button>
      </Box>
    </Box>
  );
}
