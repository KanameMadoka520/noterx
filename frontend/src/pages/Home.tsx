import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import CameraAltOutlined from "@mui/icons-material/CameraAltOutlined";
import LinkIcon from "@mui/icons-material/Link";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import UploadZone, { type UploadMediaState } from "../components/UploadZone";
import { parseLink } from "../utils/api";

type InputMode = "text" | "screenshot" | "link";

const tabContentMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

const CATEGORIES = [
  { key: "food", label: "美食" },
  { key: "fashion", label: "穿搭" },
  { key: "tech", label: "科技" },
  { key: "travel", label: "旅行" },
  { key: "beauty", label: "美妆" },
  { key: "fitness", label: "健身" },
] as const;

const CATEGORY_LABEL: Record<string, string> = {
  food: "美食",
  fashion: "穿搭",
  tech: "科技",
  travel: "旅行",
  beauty: "美妆",
  fitness: "健身",
};

const SAMPLES = [
  {
    title: "5分钟懒人蛋炒饭",
    content: "超简单稳定配方：鸡蛋 + 米饭 + 葱花，忙碌工作日也能快速完成。",
    tags: "美食,家常菜,快手",
    category: "food",
  },
  {
    title: "秋季外套真实测评",
    content: "连续穿两周后，从面料、版型和性价比三个维度做总结。",
    tags: "穿搭,外套,秋冬",
    category: "fashion",
  },
  {
    title: "平板3个月使用报告",
    content: "记录日常效率场景和娱乐场景的真实体验。",
    tags: "数码,平板,测评",
    category: "tech",
  },
] as const;

interface HistoryItem {
  title: string;
  score: number;
  grade: string;
  category: string;
  date: number;
}

export default function Home() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<InputMode>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("food");
  const [uploadMedia, setUploadMedia] = useState<UploadMediaState>({ images: [], video: null });
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("noterx_history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (file) {
          setUploadMedia((prev) => ({
            images: [...prev.images, file].slice(0, 9),
            video: null,
          }));
          setMode("screenshot");
        }
        break;
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => { document.title = "薯医 NoteRx"; }, []);

  const canSubmit =
    mode === "screenshot"
      ? uploadMedia.images.length > 0 || uploadMedia.video !== null
      : title.trim().length > 0;

  const submitText = useMemo(() => {
    if (!canSubmit) return "开始诊断";
    return mode === "screenshot" ? "开始媒体诊断" : "开始诊断";
  }, [canSubmit, mode]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    navigate("/diagnosing", {
      state: {
        title,
        content,
        tags,
        category,
        coverFile: uploadMedia.images[0] ?? null,
        coverImages: uploadMedia.images,
        videoFile: uploadMedia.video,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit && mode === "text") {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      e.preventDefault();
      handleSubmit();
    }
  };

  const fillSample = (sample: (typeof SAMPLES)[number]) => {
    setTitle(sample.title);
    setContent(sample.content);
    setTags(sample.tags);
    setCategory(sample.category);
    setMode("text");
  };

  const handleParseLink = async () => {
    if (!linkUrl.trim()) return;
    setLinkLoading(true);
    setLinkError("");
    try {
      const result = await parseLink(linkUrl);
      if (!result.success) {
        setLinkError(result.error || "链接解析失败。请重试。");
      } else {
        setTitle(result.title);
        setContent(result.content);
        setTags(result.tags.join(","));
        setMode("text");
      }
    } catch {
      setLinkError("网络异常，请稍后重试。");
    } finally {
      setLinkLoading(false);
    }
  };

  const tabIndex = mode === "text" ? 0 : mode === "screenshot" ? 1 : 2;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f7f8",
        px: 2,
        py: { xs: 2.5, sm: 4 },
      }}
    >
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="text"
            startIcon={<HistoryIcon sx={{ fontSize: 15 }} />}
            onClick={() => navigate("/history")}
            sx={{
              minHeight: 28,
              px: 0.75,
              color: "#9ca3af",
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            历史记录
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.25 }}>
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: 1,
              bgcolor: "#ff2442",
              color: "#fff",
              fontSize: "0.72rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            薯
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.96rem", fontWeight: 700, color: "#1f2937", lineHeight: 1.2 }}>
              薯医 NoteRx
            </Typography>
            <Typography sx={{ fontSize: "0.69rem", color: "#9ca3af", mt: 0.25 }}>
              AI 驱动的笔记诊断工具
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "1px solid #eceff3",
            bgcolor: "#fff",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={(_, value) => setMode(([
              "text",
              "screenshot",
              "link",
            ] as InputMode[])[value])}
            variant="fullWidth"
            sx={{
              minHeight: 42,
              borderBottom: "1px solid #f1f3f5",
              "& .MuiTab-root": {
                minHeight: 42,
                fontSize: "0.77rem",
                color: "#9ca3af",
                fontWeight: 500,
                textTransform: "none",
              },
              "& .MuiTab-root.Mui-selected": {
                color: "#1f2937",
                fontWeight: 600,
              },
              "& .MuiTabs-indicator": {
                height: 2,
                borderRadius: "2px 2px 0 0",
                bgcolor: "#ff2442",
              },
            }}
          >
            <Tab icon={<DescriptionOutlined sx={{ fontSize: 14 }} />} iconPosition="start" label="文字" />
            <Tab icon={<CameraAltOutlined sx={{ fontSize: 14 }} />} iconPosition="start" label="媒体" />
            <Tab icon={<LinkIcon sx={{ fontSize: 14 }} />} iconPosition="start" label="链接" />
          </Tabs>

          <Box sx={{ p: 1.5 }} onKeyDown={handleKeyDown}>
            <AnimatePresence mode="wait">
              {mode === "text" && (
                <motion.div key="text" {...tabContentMotion}>
                  <Stack spacing={1.2}>
                    <TextField
                      size="small"
                      label="笔记标题 *"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="输入笔记标题"
                      slotProps={{ htmlInput: { maxLength: 100 } }}
                      helperText={`${title.length}/100`}
                    />
                    <TextField
                      size="small"
                      label="笔记正文"
                      multiline
                      minRows={4}
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="输入笔记正文（可选）"
                    />
                    <TextField
                      size="small"
                      label="标签"
                      value={tags}
                      onChange={(event) => setTags(event.target.value)}
                      placeholder="用英文逗号分隔，如：穿搭,秋冬,通勤"
                    />
                  </Stack>
                </motion.div>
              )}

              {mode === "screenshot" && (
                <motion.div key="screenshot" {...tabContentMotion}>
                  <Stack spacing={1.2}>
                    <UploadZone value={uploadMedia} onChange={setUploadMedia} />
                    <TextField
                      size="small"
                      label="标题（可选）"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="留空则尝试 OCR 自动识别"
                    />
                  </Stack>
                </motion.div>
              )}

              {mode === "link" && (
                <motion.div key="link" {...tabContentMotion}>
                  <Stack spacing={1.2}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="笔记分享链接"
                        value={linkUrl}
                        onChange={(event) => setLinkUrl(event.target.value)}
                        placeholder="粘贴小红书分享链接"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <LinkIcon sx={{ color: "#9ca3af", fontSize: 15 }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        disabled={linkLoading || !linkUrl.trim()}
                        onClick={handleParseLink}
                        sx={{ minWidth: 72, fontSize: "0.75rem" }}
                      >
                        {linkLoading ? <CircularProgress size={14} color="inherit" /> : "解析"}
                      </Button>
                    </Box>
                    {linkError && <Alert severity="error">{linkError}</Alert>}
                    {title && <Alert severity="success">已解析标题：{title}</Alert>}
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>

            <Divider sx={{ my: 1.5 }} />

            <Typography sx={{ fontSize: "0.73rem", color: "#6b7280", fontWeight: 600, mb: 1 }}>
              选择垂类
            </Typography>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {CATEGORIES.map((item) => {
                const active = category === item.key;
                return (
                  <Box
                    key={item.key}
                    onClick={() => setCategory(item.key)}
                    sx={{
                      px: 1.15,
                      py: 0.45,
                      borderRadius: 1,
                      fontSize: "0.72rem",
                      border: "1px solid",
                      borderColor: active ? "#ff2442" : "#e5e7eb",
                      color: active ? "#ff2442" : "#6b7280",
                      bgcolor: active ? "rgba(255,36,66,0.06)" : "#fff",
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </Box>
                );
              })}
            </Stack>

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit}
              endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
              sx={{
                mt: 1.5,
                height: 36,
                borderRadius: 1.25,
                fontSize: "0.78rem",
                fontWeight: 600,
                boxShadow: "none",
                bgcolor: canSubmit ? "#ff2442" : "#f3f4f6",
                color: canSubmit ? "#fff" : "#9ca3af",
                "&:hover": {
                  bgcolor: canSubmit ? "#ef1b3a" : "#f3f4f6",
                  boxShadow: "none",
                },
              }}
            >
              {submitText}
            </Button>
          </Box>
        </Paper>

        <Box sx={{ mt: 1.5 }}>
          <Typography sx={{ fontSize: "0.68rem", color: "#9ca3af", mb: 0.6 }}>快速体验</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 0.7 }}>
            {SAMPLES.map((sample, index) => (
              <Box
                key={sample.title}
                onClick={() => fillSample(sample)}
                sx={{
                  px: 0.8,
                  py: 0.75,
                  border: "1px solid #eceff3",
                  borderRadius: 1,
                  bgcolor: "#fff",
                  cursor: "pointer",
                }}
              >
                <Typography sx={{ fontSize: "0.62rem", color: "#9ca3af" }}>
                  示例 {index + 1}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: "0.68rem",
                    color: "#374151",
                    fontWeight: 500,
                    lineHeight: 1.35,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {sample.title}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 1.2 }}>
          <Typography sx={{ fontSize: "0.68rem", color: "#9ca3af", mb: 0.6 }}>历史</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 0.7 }}>
            {history.slice(0, 3).map((item, index) => (
              <Box
                key={`${item.title}-${index}`}
                sx={{
                  px: 0.8,
                  py: 0.75,
                  border: "1px solid #eceff3",
                  borderRadius: 1,
                  bgcolor: "#fff",
                }}
              >
                <Typography sx={{ fontSize: "0.62rem", color: "#9ca3af" }}>
                  {CATEGORY_LABEL[item.category] || item.category}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: "0.68rem",
                    color: "#374151",
                    fontWeight: 500,
                    lineHeight: 1.35,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {item.title}
                </Typography>
              </Box>
            ))}
            {history.length === 0 && (
              <Box
                sx={{
                  gridColumn: "1 / -1",
                  px: 0.8,
                  py: 0.9,
                  border: "1px dashed #e5e7eb",
                  borderRadius: 1,
                  color: "#9ca3af",
                  fontSize: "0.7rem",
                  textAlign: "center",
                }}
              >
                暂无历史记录
              </Box>
            )}
          </Box>
        </Box>

        <Typography sx={{ mt: 2.2, textAlign: "center", fontSize: "0.62rem", color: "#d1d5db" }}>
          薯医 NoteRx · AI 驱动笔记诊断
        </Typography>
      </Box>
    </Box>
  );
}
