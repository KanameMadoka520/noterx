import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import { motion } from "framer-motion";
import { getHistoryList, getHistoryDetail, deleteHistory, type HistoryListItem } from "../utils/api";

const CATEGORY_LABEL: Record<string, string> = {
  food: "美食",
  fashion: "穿搭",
  tech: "科技",
  travel: "旅行",
  beauty: "美妆",
  fitness: "健身",
  life: "生活",
};

export default function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HistoryListItem | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const list = await getHistoryList(50);
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleOpen = async (item: HistoryListItem) => {
    setNavigating(item.id);
    try {
      const detail = await getHistoryDetail(item.id);
      navigate("/report", {
        state: {
          report: detail.report,
          params: { title: detail.title, category: detail.category },
          isFallback: false,
        },
      });
    } finally {
      setNavigating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHistory(deleteTarget.id);
      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return "";
    const d = new Date(ts.includes("T") ? ts : ts.replace(" ", "T"));
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f7f8", px: 2, py: 3 }}>
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate("/")}
            sx={{ color: "#9ca3af", fontSize: "0.72rem", minHeight: 28, px: 0.5 }}
          >
            返回
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <HistoryIcon sx={{ color: "#ff2442", fontSize: 16 }} />
            <Typography sx={{ fontSize: "0.86rem", fontWeight: 700, color: "#1f2937" }}>诊断历史</Typography>
          </Box>
          <Box sx={{ width: 52 }} />
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress size={20} sx={{ color: "#ff2442" }} />
            <Typography sx={{ mt: 1, color: "#9ca3af", fontSize: "0.72rem" }}>加载中…</Typography>
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, border: "1px dashed #e5e7eb", borderRadius: 1.5, bgcolor: "#fff" }}>
            <Typography sx={{ color: "#9ca3af", fontSize: "0.76rem" }}>暂无历史记录</Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {items.map((item, index) => (
              <Box
                key={item.id}
                component={motion.div}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                sx={{
                  border: "1px solid #eceff3",
                  borderRadius: 1.5,
                  bgcolor: "#fff",
                  px: 1,
                  py: 0.95,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 0.7,
                  alignItems: "center",
                }}
              >
                <Box sx={{ minWidth: 0, cursor: "pointer" }} onClick={() => handleOpen(item)}>
                  <Typography
                    sx={{
                      fontSize: "0.76rem",
                      color: "#374151",
                      fontWeight: 600,
                      lineHeight: 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Stack direction="row" spacing={0.6} sx={{ mt: 0.55, alignItems: "center" }}>
                    <Chip
                      size="small"
                      label={CATEGORY_LABEL[item.category] || item.category}
                      sx={{
                        height: 18,
                        borderRadius: 0.9,
                        fontSize: "0.62rem",
                        color: "#6b7280",
                        bgcolor: "#f3f4f6",
                      }}
                    />
                    <Typography sx={{ fontSize: "0.64rem", color: "#9ca3af" }}>{formatTime(item.created_at)}</Typography>
                    <Typography sx={{ fontSize: "0.64rem", color: "#9ca3af" }}>{Math.round(item.overall_score)} 分</Typography>
                    <Typography sx={{ fontSize: "0.64rem", color: "#9ca3af" }}>{item.grade}</Typography>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={0.2} sx={{ alignItems: "center" }}>
                  {navigating === item.id && <CircularProgress size={14} sx={{ color: "#ff2442" }} />}
                  <IconButton
                    size="small"
                    sx={{ color: "#9ca3af" }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteTarget(item);
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 1.8,
              border: "1px solid #eceff3",
              boxShadow: "none",
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 0.8, fontSize: "0.9rem", fontWeight: 700 }}>删除记录</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.78rem", color: "#6b7280" }}>
            确认删除「{deleteTarget?.title}」吗？
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ fontSize: "0.74rem", color: "#9ca3af" }}>
            取消
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ fontSize: "0.74rem", boxShadow: "none" }}>
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
