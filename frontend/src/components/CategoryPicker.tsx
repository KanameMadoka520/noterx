import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const CATEGORIES = [
  { key: "food", label: "美食", emoji: "🍜" },
  { key: "fashion", label: "穿搭", emoji: "👗" },
  { key: "tech", label: "科技", emoji: "💻" },
  { key: "travel", label: "旅行", emoji: "✈️" },
  { key: "beauty", label: "美妆", emoji: "💄" },
  { key: "fitness", label: "健身", emoji: "🏋️" },
];

export default function CategoryPicker({ value, onChange }: Props) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
      {CATEGORIES.map((cat) => {
        const selected = value === cat.key;
        return (
          <motion.div
            key={cat.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Box
              onClick={() => onChange(cat.key)}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 2,
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "all 0.15s ease",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                border: "1.5px solid",
                ...(selected
                  ? {
                      bgcolor: "rgba(124, 58, 237, 0.08)",
                      color: "primary.main",
                      borderColor: "rgba(124, 58, 237, 0.3)",
                      boxShadow: "0 2px 8px rgba(124, 58, 237, 0.12)",
                    }
                  : {
                      bgcolor: "background.paper",
                      color: "text.secondary",
                      borderColor: "rgba(15, 23, 42, 0.1)",
                      "&:hover": {
                        bgcolor: "rgba(15, 23, 42, 0.03)",
                        borderColor: "rgba(15, 23, 42, 0.2)",
                        color: "text.primary",
                      },
                    }),
              }}
            >
              <Typography sx={{ fontSize: "1rem", lineHeight: 1 }}>{cat.emoji}</Typography>
              <Typography sx={{ fontSize: "inherit", fontWeight: "inherit", lineHeight: 1.4 }}>
                {cat.label}
              </Typography>
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
}
