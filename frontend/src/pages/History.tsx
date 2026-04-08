import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardActionArea,
  CardContent,
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
import {
  getHistoryList,
  getHistoryDetail,
  deleteHistory,
} from "../utils/api";
import type { HistoryListItem } from "../utils/api";

const CATEGORY_LABEL: Record<string, string> = {
  food: "美食",
  fashion: "时尚",
  tech: "科技",
  travel: "旅行",
  beauty: "美妆",
  fitness: "健身",
  life: "生活",
};

const GRADE_COLOR: Record<string, string> = {
  S: "#10b981",
  A: "#3b82f6",
  B: "#8b5cf6",
  C: "#f59e0b",
  D: "#ef4444",
};

const GRADE_BG: Record<string, string> = {
  S: "rgba(16, 185, 129, 0.08)",
  A: "rgba(59, 130, 246, 0.08)",
  B: "rgba(139, 92, 246, 0.08)",
  C: "rgba(245, 158, 11, 0.08)",
  D: "rgba(239, 68, 68, 0.08)",
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
    } catch (e) {
      console.error("获取历史记录失败", e);
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
    } catch (e) {
      console.error("获取报告详情失败", e);
      setNavigating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHistory(deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } catch (e) {
      console.error("删除失败", e);
    }
    setDeleteTarget(null);
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
        }}
      >
        <Box
          sx={{
            maxWidth: 720,
            mx: "auto",
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 20 }} />}
            onClick={() => navigate("/")}
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              fontSize: "0.875rem",
              textTransform: "none",
              "&:hover": { color: "text.primary", backgroundColor: "rgba(15, 23, 42, 0.04)" }
            }}
          >
            首页
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <HistoryIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Typography sx={{ fontWeight: 600, fontSize: "1rem", color: "text.primary", letterSpacing: "-0.01em" }}>
              诊断历史
            </Typography>
          </Box>
          <Box sx={{ width: 80 }} />
        </Box>
      </Box>

      <Box sx={{ maxWidth: 720, mx: "auto", px: 2, mt: 4 }}>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 12 }}>
            <CircularProgress size={28} sx={{ color: "primary.main" }} />
            <Typography sx={{ mt: 2.5, color: "text.secondary", fontSize: "0.875rem" }}>
              加载中...
            </Typography>
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 12 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "24px",
                bgcolor: "rgba(15, 23, 42, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                fontSize: "2rem",
              }}
            >
              📝
            </Box>
            <Typography sx={{ color: "text.secondary", fontSize: "0.9375rem", fontWeight: 500 }}>
              暂无诊断记录
            </Typography>
            <Typography sx={{ color: "text.tertiary", fontSize: "0.8125rem", mt: 0.5 }}>
              完成一次诊断后会在这里出现
            </Typography>
            <Button
              variant="contained"
              sx={{ 
                mt: 3.5,
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
                  boxShadow: "0 6px 20px rgba(124, 58, 237, 0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
              onClick={() => navigate("/")}
            >
              去诊断一篇笔记
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
              >
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    borderRadius: 3,
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                    position: "relative",
                    "&:hover": {
                      borderColor: "rgba(124, 58, 237, 0.25)",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleOpen(item)}
                    disabled={navigating === item.id}
                    sx={{ p: 0 }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2.5,
                        p: 2.5,
                        pr: 8,
                        "&:last-child": { pb: 2.5 },
                      }}
                    >
                      {/* Grade Badge */}
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: "14px",
                          flexShrink: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background: GRADE_BG[item.grade] || "rgba(15, 23, 42, 0.04)",
                          border: `2px solid ${GRADE_COLOR[item.grade] || "rgba(15, 23, 42, 0.12)"}30`,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "1.125rem",
                            color: GRADE_COLOR[item.grade] || "text.secondary",
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {Math.round(item.overall_score)}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            color: GRADE_COLOR[item.grade] || "text.tertiary",
                            mt: 0.25,
                            letterSpacing: "0.025em",
                          }}
                        >
                          {item.grade}
                        </Typography>
                      </Box>

                      {/* Text Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "0.9375rem",
                            fontWeight: 600,
                            color: "text.primary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.4,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            mt: 0.75,
                          }}
                        >
                          <Chip
                            label={CATEGORY_LABEL[item.category] || item.category}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: "text.secondary",
                              bgcolor: "rgba(15, 23, 42, 0.05)",
                              border: "none",
                              borderRadius: 1,
                            }}
                          />
                          <Typography variant="caption" sx={{ color: "text.tertiary", fontSize: "0.75rem" }}>
                            {formatTime(item.created_at)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Loading indicator */}
                      {navigating === item.id && (
                        <CircularProgress size={20} sx={{ color: "primary.main" }} />
                      )}
                    </CardContent>
                  </CardActionArea>

                  {/* Delete button */}
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "text.tertiary",
                      width: 36,
                      height: 36,
                      "&:hover": { 
                        color: "error.main",
                        backgroundColor: "rgba(239, 68, 68, 0.08)",
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(item);
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Card>
              </motion.div>
            ))}
          </Stack>
        )}
      </Box>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600, fontSize: "1.0625rem" }}>
          删除记录
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
            确定删除「{deleteTarget?.title}」的诊断记录吗？此操作不可恢复。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button 
            onClick={() => setDeleteTarget(null)}
            sx={{ 
              color: "text.secondary",
              fontWeight: 500,
              "&:hover": { backgroundColor: "rgba(15, 23, 42, 0.04)" }
            }}
          >
            取消
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            variant="contained"
            sx={{ 
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)" }
            }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
