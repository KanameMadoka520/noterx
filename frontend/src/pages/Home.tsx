import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box, Typography, TextField, Button, Stack, Chip,
  CircularProgress, Alert, Paper, useTheme,
  useMediaQuery,
} from "@mui/material";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CategoryPicker from "../components/CategoryPicker";
import UploadZone from "../components/UploadZone";
import { quickRecognize } from "../utils/api";
import type { QuickRecognizeResult } from "../utils/api";

/** @returns A stable key for a File object */
function fkey(f: File) {
  return `${f.name}_${f.size}_${f.lastModified}`;
}

/** 中文垂类 -> 英文 key 映射 */
const CAT_MAP: Record<string, string> = {
  "美食": "food", "食谱": "food", "做饭": "food", "烘焙": "food",
  "穿搭": "fashion", "时尚": "fashion", "服装": "fashion", "outfit": "fashion",
  "科技": "tech", "数码": "tech", "手机": "tech", "电脑": "tech",
  "旅行": "travel", "旅游": "travel", "景点": "travel",
  "美妆": "beauty", "护肤": "beauty", "化妆": "beauty",
  "健身": "fitness", "运动": "fitness", "减肥": "fitness",
  "生活": "lifestyle", "日常": "lifestyle", "vlog": "lifestyle",
  "家居": "home", "装修": "home", "家装": "home",
  // English keys pass through
  "food": "food", "fashion": "fashion", "tech": "tech", "travel": "travel",
  "beauty": "beauty", "fitness": "fitness", "lifestyle": "lifestyle", "home": "home",
};

/** 快识并行路数：略限流可减少总排队，利于接近「单张 <5s」的体感 */
const QUICK_RECOGNIZE_CONCURRENCY = 2;

/** 首页：桌面端双栏布局，移动端单页布局 */
export default function Home() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("food");

  const [aiRecogs, setAiRecogs] = useState<Record<string, QuickRecognizeResult>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [uploadingPulse, setUploadingPulse] = useState(false);
  const [analyzingPulse, setAnalyzingPulse] = useState(false);

  const [userEdited, setUserEdited] = useState({ title: false, content: false, category: false });

  const uploadPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyzePulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognizeInFlightRef = useRef<Set<string>>(new Set());
  const prevPendingRecognitionRef = useRef(false);

  useEffect(() => { document.title = "薯医 NoteRx"; }, []);

  useEffect(() => {
    return () => {
      if (uploadPulseTimerRef.current) clearTimeout(uploadPulseTimerRef.current);
      if (analyzePulseTimerRef.current) clearTimeout(analyzePulseTimerRef.current);
    };
  }, []);

  const triggerUploadPulse = useCallback(() => {
    if (uploadPulseTimerRef.current) clearTimeout(uploadPulseTimerRef.current);
    setUploadingPulse(true);
    uploadPulseTimerRef.current = setTimeout(() => {
      setUploadingPulse(false);
      uploadPulseTimerRef.current = null;
    }, 500);
  }, []);

  const handleFilesChange = useCallback(
    (newFiles: File[]) => {
      setFiles(newFiles.slice(0, 9));
      if (newFiles.length > 0) triggerUploadPulse();
    },
    [triggerUploadPulse],
  );

  const appendFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;
      setFiles((prev) => [...prev, ...incoming].slice(0, 9));
      triggerUploadPulse();
    },
    [triggerUploadPulse],
  );

  /** Ctrl+V paste images */
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pasted: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/") || item.type.startsWith("video/")) {
          const file = item.getAsFile();
          if (file) pasted.push(file);
        }
      }
      appendFiles(pasted);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [appendFiles]);

  const anyLoading = useMemo(() => Object.values(aiLoading).some(Boolean), [aiLoading]);
  const allResults = useMemo(() => Object.values(aiRecogs), [aiRecogs]);
  const successRecogEntries = useMemo(
    () => Object.entries(aiRecogs).filter(([, r]) => r.success),
    [aiRecogs],
  );
  const successResults = useMemo(
    () => successRecogEntries.map(([, r]) => r),
    [successRecogEntries],
  );

  const aggregated = useMemo(() => {
    let bestTitle = "";
    let bestContent = "";
    let bestCategory = "";
    let bestSummary = "";

    // 优先从 content 类型提取，但如果没有 content 类型，也从其他类型提取
    for (const [, r] of successRecogEntries) {
      if ((r.slot_type || "").toLowerCase() === "content") {
        if (!bestTitle && r.title?.trim()) bestTitle = r.title.trim();
        if (!bestContent && r.content_text?.trim()) bestContent = r.content_text.trim();
      }
      if (!bestCategory && r.category?.trim()) bestCategory = r.category.trim();
      if (!bestSummary && r.summary?.trim()) bestSummary = r.summary.trim();
    }
    // Fallback: 如果 content 类型没提取到，从任意类型取
    if (!bestTitle || !bestContent) {
      for (const [, r] of successRecogEntries) {
        if (!bestTitle && r.title?.trim()) bestTitle = r.title.trim();
        if (!bestContent && r.content_text?.trim()) bestContent = r.content_text.trim();
      }
    }

    return { bestTitle, bestContent, bestCategory, bestSummary };
  }, [successRecogEntries]);

  const imageFileKeys = useMemo(
    () => new Set(files.filter((f) => f.type.startsWith("image/")).map(fkey)),
    [files],
  );

  const pendingRecognition = useMemo(() => {
    if (imageFileKeys.size === 0) return false;
    for (const key of imageFileKeys) {
      if (aiLoading[key] || !aiRecogs[key]) return true;
    }
    return false;
  }, [imageFileKeys, aiLoading, aiRecogs]);

  const allRecognitionDone = useMemo(() => {
    if (imageFileKeys.size === 0) return false;
    for (const k of imageFileKeys) {
      if (!aiRecogs[k] && !aiLoading[k]) return false;
      if (aiLoading[k]) return false;
    }
    return true;
  }, [imageFileKeys, aiRecogs, aiLoading]);

  useEffect(() => {
    const { bestTitle, bestContent, bestCategory } = aggregated;

    if (!userEdited.title && bestTitle) {
      setTitle(bestTitle.slice(0, 100));
    }
    if (!userEdited.content && bestContent) {
      setContent(bestContent);
    }
    if (!userEdited.category && bestCategory) {
      const mapped = CAT_MAP[bestCategory];
      if (mapped) setCategory(mapped);
    }
  }, [aggregated, userEdited]);

  const allFailed = allRecognitionDone && successResults.length === 0 && allResults.length > 0;

  const showWarnings = allRecognitionDone && files.length > 0 && !allFailed;
  const warnings = useMemo(() => {
    if (!showWarnings) return { title: false, content: false, category: false };
    const { bestTitle, bestContent, bestCategory, bestSummary } = aggregated;
    return {
      title: !bestTitle && !bestSummary,
      content: !bestContent,
      category: !bestCategory,
    };
  }, [showWarnings, aggregated]);

  const autoFilled = useMemo(() => {
    const { bestTitle, bestContent, bestCategory, bestSummary } = aggregated;
    return {
      title: !userEdited.title && !!(bestTitle || bestSummary),
      content: !userEdited.content && !!bestContent,
      category: !userEdited.category && !!bestCategory && !!CAT_MAP[bestCategory],
    };
  }, [aggregated, userEdited]);

  const runRecognition = useCallback(async (file: File, slotHint?: "cover" | "content" | "profile" | "comments") => {
    const key = fkey(file);
    if (recognizeInFlightRef.current.has(key)) return;
    recognizeInFlightRef.current.add(key);
    setAiLoading((p) => {
      if (p[key]) return p;
      return { ...p, [key]: true };
    });
    try {
      const res = await quickRecognize(file, slotHint);
      setAiRecogs((p) => ({ ...p, [key]: res }));
    } catch {
      setAiRecogs((p) => ({ ...p, [key]: { success: false, slot_type: "unknown", category: "", summary: "", error: "识别失败" } }));
    } finally {
      recognizeInFlightRef.current.delete(key);
      setAiLoading((p) => ({ ...p, [key]: false }));
    }
  }, []);

  useEffect(() => {
    const validKeys = new Set(files.map(fkey));
    setAiRecogs((prev) => {
      let changed = false;
      const next: Record<string, QuickRecognizeResult> = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (validKeys.has(key)) next[key] = value;
        else changed = true;
      });
      return changed ? next : prev;
    });
    setAiLoading((prev) => {
      let changed = false;
      const next: Record<string, boolean> = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (validKeys.has(key)) next[key] = value;
        else changed = true;
      });
      return changed ? next : prev;
    });
    recognizeInFlightRef.current.forEach((key) => {
      if (!validKeys.has(key)) recognizeInFlightRef.current.delete(key);
    });
  }, [files]);

  useEffect(() => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const inFlight = imageFiles.filter((f) => aiLoading[fkey(f)]).length;
    const freeSlots = Math.max(0, QUICK_RECOGNIZE_CONCURRENCY - inFlight);
    const need = imageFiles.filter((f) => {
      const k = fkey(f);
      return !aiRecogs[k] && !aiLoading[k];
    });
    need.slice(0, freeSlots).forEach((file) => {
      void runRecognition(file);
    });
  }, [files, aiRecogs, aiLoading, runRecognition]);

  useEffect(() => {
    if (!prevPendingRecognitionRef.current && pendingRecognition && analyzePulseTimerRef.current) {
      clearTimeout(analyzePulseTimerRef.current);
      analyzePulseTimerRef.current = null;
      setAnalyzingPulse(false);
    }
    if (prevPendingRecognitionRef.current && !pendingRecognition && imageFileKeys.size > 0) {
      if (analyzePulseTimerRef.current) clearTimeout(analyzePulseTimerRef.current);
      setAnalyzingPulse(true);
      analyzePulseTimerRef.current = setTimeout(() => {
        setAnalyzingPulse(false);
        analyzePulseTimerRef.current = null;
      }, 700);
    }
    prevPendingRecognitionRef.current = pendingRecognition;
  }, [pendingRecognition, imageFileKeys.size]);

  useEffect(() => {
    if (files.length === 0) {
      setAiRecogs({});
      setAiLoading({});
      recognizeInFlightRef.current.clear();
      setUserEdited({ title: false, content: false, category: false });
      setTitle("");
      setContent("");
      setCategory("food");
      setUploadingPulse(false);
      setAnalyzingPulse(false);
      if (uploadPulseTimerRef.current) {
        clearTimeout(uploadPulseTimerRef.current);
        uploadPulseTimerRef.current = null;
      }
      if (analyzePulseTimerRef.current) {
        clearTimeout(analyzePulseTimerRef.current);
        analyzePulseTimerRef.current = null;
      }
    }
  }, [files.length]);

  const processingStatus = useMemo(() => {
    if (files.length === 0) return null;
    if (uploadingPulse) {
      return { label: "上传中", tone: "info" as const, text: "素材已接收，正在准备识别..." };
    }
    if (pendingRecognition) {
      return { label: "识别中", tone: "info" as const, text: "AI 正在自动识别封面/详情/主页/评论区..." };
    }
    if (analyzingPulse) {
      return { label: "分析中", tone: "info" as const, text: "正在汇总识别结果并回填表单..." };
    }
    if (allRecognitionDone) {
      return { label: "已就绪", tone: "success" as const, text: "识别完成，可以继续发起诊断。" };
    }
    return null;
  }, [files.length, uploadingPulse, pendingRecognition, analyzingPulse, allRecognitionDone]);

  const lockInputs = !!processingStatus && processingStatus.label !== "已就绪";
  const isFormBlocked = files.length > 0 && !allRecognitionDone;

  const handleSubmit = () => {
    if (!canSubmit) return;
    navigate("/diagnosing", {
      state: {
        title, content, tags: "", category,
        coverFile: files.find((f) => f.type.startsWith("image/")) ?? null,
        coverImages: files.filter((f) => f.type.startsWith("image/")),
        videoFile: files.find((f) => f.type.startsWith("video/")) ?? null,
      },
    });
  };

  const recognizedSlots = useMemo(
    () => new Set(
      successRecogEntries
        .map(([, r]) => (typeof r.slot_type === "string" ? r.slot_type.toLowerCase() : ""))
        .filter(Boolean),
    ),
    [successRecogEntries],
  );
  const hasDetailScreenshot = recognizedSlots.has("content");
  const canSubmit = files.length > 0 && title.trim().length > 0 && !lockInputs && !isFormBlocked;
  const aiSuggestion = useMemo(() => {
    if (files.length === 0) return "";
    if (!allRecognitionDone) return "";
    const hasBody = Boolean(content.trim() || aggregated.bestContent);
    const hasCover = recognizedSlots.has("cover");
    const hasProfile = recognizedSlots.has("profile");
    const hasComments = recognizedSlots.has("comments");

    if (!hasDetailScreenshot) return "建议补充笔记详情页截图（含标题+正文），AI 提取效果更好。也可手动输入后直接诊断。";
    if (!hasBody) return "已检测到详情页，但正文仍不清晰，建议补充一张更清晰的详情截图。";
    if (!hasCover) return "可补充封面截图，提升视觉内容判断。";
    if (!hasProfile) return "可补充主页截图，帮助判断账号定位。";
    if (!hasComments) return "可补充评论区截图，分析互动质量。";
    return "信息较完整，可以直接开始诊断。";
  }, [files.length, allRecognitionDone, content, aggregated.bestContent, recognizedSlots, hasDetailScreenshot]);
  const slotLabelMap: Record<string, string> = {
    content: "详情",
    cover: "封面",
    profile: "主页",
    comments: "评论区",
  };

  /* ── Step flow indicator ── */
  const flowStep = files.length === 0 ? 0 : !allRecognitionDone ? 1 : 2;
  const flowLabels = ["上传素材", "AI 识别", "开始诊断"];

  return (
    <Box sx={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(168deg, #f8f6fa 0%, #eeedf2 40%, #f9f8fb 100%)",
    }}>
      {/* ── Header ── */}
      <Box
        component="header"
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, md: 3 },
          py: 1.5,
          borderBottom: "1px solid rgba(0,0,0,0.04)",
          bgcolor: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }} aria-hidden>
            <defs>
              <linearGradient id="hLogo" x1="4" y1="4" x2="26" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ff5c6f" /><stop offset="1" stopColor="#e61e3d" />
              </linearGradient>
            </defs>
            <rect width="28" height="28" rx="7" fill="url(#hLogo)" />
            <text x="14" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="Inter,system-ui,sans-serif">Rx</text>
          </svg>
          <Box>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#1a1a1a" }}>
              薯医 NoteRx
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "#888", lineHeight: 1.3 }}>
              AI 笔记诊断 · 基于 874 条真实数据
            </Typography>
          </Box>
        </Box>
        <Button
          startIcon={<HistoryOutlined sx={{ fontSize: 16 }} />}
          onClick={() => navigate("/history")}
          size="small"
          sx={{
            color: "#888", fontSize: 12, fontWeight: 600, flexShrink: 0,
            borderRadius: "10px", px: 1.25,
            "&:hover": { color: "#1a1a1a", bgcolor: "rgba(255,36,66,0.06)" },
          }}
        >
          历史记录
        </Button>
      </Box>

      {/* ── Main ── */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: { xs: 2, md: 2.5 },
          py: { xs: 2, md: 1.5 },
          overflow: "auto",
          pb: { xs: 10, md: 2 },
        }}
      >
        {/* ── Step flow (mobile: horizontal, desktop: above grid) ── */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 0.5,
          mb: { xs: 2, md: 2 }, width: "100%", maxWidth: 1060,
          justifyContent: "center",
        }}>
          {flowLabels.map((label, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{
                width: 22, height: 22, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                bgcolor: i < flowStep ? "#10b981" : i === flowStep ? "#ff2442" : "rgba(0,0,0,0.06)",
                color: i <= flowStep ? "#fff" : "#bbb",
                transition: "all 0.3s ease",
                boxShadow: i === flowStep ? "0 0 12px rgba(255,36,66,0.25)" : "none",
              }}>
                {i < flowStep ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  i + 1
                )}
              </Box>
              <Typography sx={{
                fontSize: 12, fontWeight: i === flowStep ? 700 : 500,
                color: i <= flowStep ? "#262626" : "#bbb",
                transition: "color 0.3s",
              }}>
                {label}
              </Typography>
              {i < flowLabels.length - 1 && (
                <Box sx={{
                  width: 20, height: 1.5, mx: 0.25,
                  bgcolor: i < flowStep ? "#10b981" : "rgba(0,0,0,0.08)",
                  borderRadius: 1, transition: "background-color 0.3s",
                }} />
              )}
            </Box>
          ))}
        </Box>

        {/* ── Grid ── */}
        <Box sx={{
          width: "100%",
          maxWidth: 1060,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" },
          gap: { xs: 2, md: 2.5 },
          alignItems: "start",
        }}>
          {/* ── Left: Upload ── */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.85)",
              p: { xs: 2.5, md: 2.5 },
              bgcolor: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px rgba(25,20,35,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
                  上传笔记素材
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#888", mt: 0.25, lineHeight: 1.5 }}>
                  截图或视频拖入即可，AI 自动识别并回填标题、正文、分类
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`${files.length}/9`}
                sx={{
                  height: 24, fontSize: 10, fontWeight: 700,
                  bgcolor: files.length > 0 ? "rgba(16,185,129,0.1)" : "rgba(37,99,235,0.1)",
                  color: files.length > 0 ? "#059669" : "#1d4ed8",
                  border: files.length > 0 ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(37,99,235,0.2)",
                  transition: "all 0.3s ease",
                }}
              />
            </Box>

            <Box sx={{ flex: 1, minHeight: 0 }}>
              <UploadZone files={files} onFilesChange={handleFilesChange} maxFiles={9} compact={isDesktop} />
            </Box>

            {/* Slot indicators */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    {Object.entries(slotLabelMap).map(([slot, label]) => (
                      <Chip
                        key={slot} size="small" label={label}
                        color={recognizedSlots.has(slot) ? "success" : "default"}
                        variant={recognizedSlots.has(slot) ? "filled" : "outlined"}
                        sx={{ fontSize: 11, height: 24, transition: "all 0.3s ease" }}
                      />
                    ))}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Paper>

          {/* ── Right: Form ── */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.85)",
              p: { xs: 2.5, md: 2.5 },
              bgcolor: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px rgba(25,20,35,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
              display: "flex",
              flexDirection: "column",
              gap: 1.75,
            }}
          >
            <Typography sx={{
              fontSize: 15, fontWeight: 700, color: "#1a1a1a",
              borderLeft: "3px solid #ff2442", pl: 1, py: 0.25,
            }}>
              笔记信息
            </Typography>

            {/* AI Status */}
            <AnimatePresence>
              {(processingStatus || anyLoading || allFailed || successResults.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: "hidden" }}
                >
                  <Box sx={{
                    p: 1.5, borderRadius: "12px",
                    bgcolor: allFailed ? "rgba(254,243,199,0.35)" : "rgba(248,250,252,0.9)",
                    border: allFailed ? "1px solid rgba(245,158,11,0.28)" : "1px solid rgba(0,0,0,0.05)",
                    display: "flex", flexDirection: "column", gap: 0.75,
                  }}>
                    {processingStatus && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {processingStatus.tone === "info" && (
                          <CircularProgress size={12} thickness={5} sx={{ color: "#ff2442" }} />
                        )}
                        {processingStatus.tone === "success" && (
                          <CheckCircleIcon sx={{ fontSize: 14, color: "#059669" }} />
                        )}
                        <Typography sx={{
                          fontSize: 12, fontWeight: 600,
                          color: processingStatus.tone === "success" ? "#059669" : "#555",
                        }}>
                          {processingStatus.text}
                        </Typography>
                      </Box>
                    )}
                    {!processingStatus && anyLoading && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={12} thickness={5} sx={{ color: "#ff2442" }} />
                        <Typography sx={{ fontSize: 12, color: "#999" }}>AI 正在识别...</Typography>
                      </Box>
                    )}
                    {allFailed && (
                      <Typography sx={{ fontSize: 12, color: "#92400e" }}>
                        AI 识别失败，请检查后端配置或手动输入
                      </Typography>
                    )}
                    {successResults.length > 0 && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {successResults.map((r, i) => (
                          <Chip key={i}
                            icon={<CheckCircleIcon sx={{ fontSize: 12 }} />}
                            label={r.category ? `${r.category}${r.summary ? ` · ${r.summary.slice(0, 20)}` : ""}` : r.summary?.slice(0, 20) || "已识别"}
                            size="small"
                            sx={{
                              bgcolor: "rgba(16,185,129,0.1)", color: "#047857", fontWeight: 600,
                              fontSize: 10, height: 22, border: "1px solid rgba(16,185,129,0.2)",
                              "& .MuiChip-icon": { color: "#059669" },
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            {isFormBlocked && (
              <Alert severity="info" sx={{ py: 0.25 }}>
                <Typography sx={{ fontSize: 12 }}>AI 正在识别，完成后可编辑</Typography>
              </Alert>
            )}

            <Box sx={{
              opacity: isFormBlocked ? 0.5 : 1,
              pointerEvents: isFormBlocked ? "none" : "auto",
              transition: "opacity 0.3s",
            }}>
              <Stack spacing={2}>
                <Box>
                  <TextField
                    label="笔记标题" required fullWidth size="small"
                    disabled={lockInputs} value={title}
                    onChange={(e) => { setTitle(e.target.value); setUserEdited((p) => ({ ...p, title: true })); }}
                    placeholder="上传后 AI 自动识别，也可手动输入"
                    slotProps={{ htmlInput: { maxLength: 100 } }}
                    helperText={lockInputs ? "AI 处理中" : autoFilled.title ? "AI 已自动回填，可修改" : `${title.length}/100`}
                  />
                  {showWarnings && warnings.title && !title.trim() && !userEdited.title && (
                    <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ mt: 0.5, py: 0, fontSize: 11 }}>
                      AI 未识别到标题，请手动输入
                    </Alert>
                  )}
                </Box>
                <Box>
                  <TextField
                    label="笔记正文" fullWidth multiline rows={isDesktop ? 3 : 4} size="small"
                    disabled={lockInputs} value={content}
                    onChange={(e) => { setContent(e.target.value); setUserEdited((p) => ({ ...p, content: true })); }}
                    placeholder="上传后 AI 自动提取正文"
                    helperText={lockInputs ? "AI 处理中" : autoFilled.content ? "AI 已自动提取，可修改" : undefined}
                  />
                  {showWarnings && warnings.content && !content.trim() && !userEdited.content && (
                    <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ mt: 0.5, py: 0, fontSize: 11 }}>
                      AI 未提取到正文，可补充截图或手动输入
                    </Alert>
                  )}
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                    <Typography sx={{ fontSize: 12, color: "#999", fontWeight: 500 }}>选择垂类</Typography>
                    {autoFilled.category && (
                      <Chip label="AI 已识别" size="small" sx={{
                        fontSize: 10, height: 22, fontWeight: 600,
                        bgcolor: "rgba(16,185,129,0.12)", color: "#047857",
                        border: "1px solid rgba(16,185,129,0.22)",
                      }} />
                    )}
                  </Box>
                  <CategoryPicker value={category} onChange={(v) => { setCategory(v); setUserEdited((p) => ({ ...p, category: true })); }} />
                  {showWarnings && warnings.category && !userEdited.category && (
                    <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ mt: 0.5, py: 0, fontSize: 11 }}>
                      AI 未识别垂类，请手动选择
                    </Alert>
                  )}
                </Box>
              </Stack>
            </Box>

            {/* Submit (inline on desktop) */}
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Button
                variant="contained" fullWidth disabled={!canSubmit} onClick={handleSubmit}
                sx={{ py: 1.25, fontSize: "0.9rem", fontWeight: 600, borderRadius: "14px", minHeight: 44 }}
              >
                开始诊断
              </Button>
            </Box>

            {files.length > 0 && allRecognitionDone && !hasDetailScreenshot && (
              <Alert severity="warning" sx={{ py: 0.25 }}>
                <Typography sx={{ fontSize: 12, lineHeight: 1.5 }}>
                  建议补充笔记详情页截图，也可手动输入后直接诊断。
                </Typography>
              </Alert>
            )}

            {aiSuggestion && !allFailed && !aiSuggestion.includes("补充笔记详情页截图") && (
              <Typography sx={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, textAlign: "center" }}>
                {aiSuggestion}
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* ── Mobile sticky bottom CTA ── */}
      <Box sx={{
        display: { xs: "block", md: "none" },
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        px: 2, py: 1.5,
        bgcolor: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        zIndex: 20,
      }}>
        <Button
          variant="contained" fullWidth disabled={!canSubmit} onClick={handleSubmit}
          sx={{ py: 1.25, fontSize: "0.95rem", fontWeight: 700, borderRadius: "14px", minHeight: 48 }}
        >
          开始诊断
        </Button>
      </Box>

      {/* ── Footer (desktop only) ── */}
      <Typography sx={{
        display: { xs: "none", md: "block" },
        textAlign: "center", py: 1.25, fontSize: 11, color: "#ccc", flexShrink: 0,
      }}>
        薯医 NoteRx · AI 诊断仅供参考
      </Typography>
    </Box>
  );
}
