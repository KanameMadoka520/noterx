import { Box, Typography, Stack } from "@mui/material";

interface Suggestion {
  priority: number;
  description: string;
  expected_impact: string;
}

interface Props {
  suggestions: Suggestion[];
}

const PRIORITY_COLOR: Record<number, string> = {
  1: "#dc2626",
  2: "#d97706",
  3: "#2563eb",
};

export default function SuggestionList({ suggestions }: Props) {
  if (!suggestions.length) {
    return <Typography sx={{ fontSize: 14, color: "#8e8e8e" }}>暂无优化建议</Typography>;
  }

  const sorted = [...suggestions].sort((a, b) => a.priority - b.priority);

  return (
    <Stack spacing={1.5}>
      {sorted.map((s, i) => {
        const color = PRIORITY_COLOR[s.priority] || PRIORITY_COLOR[3];
        return (
          <Box
            key={i}
            sx={{
              borderLeft: `3px solid ${color}`,
              pl: 2,
            }}
          >
            <Typography sx={{ fontSize: 14, color: "#505050", lineHeight: 1.6 }}>
              {s.description}
            </Typography>
            {s.expected_impact && (
              <Typography sx={{ fontSize: 13, color: "#8e8e8e", mt: 0.25 }}>
                {s.expected_impact}
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
