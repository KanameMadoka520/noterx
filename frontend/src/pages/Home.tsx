import { useState, useEffect } from "react";
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
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CategoryPicker from "../components/CategoryPicker";
import UploadZone from "../components/UploadZone";
import { parseLink } from "../utils/api";

type InputMode = "text" | "screenshot" | "link";

const tabContentMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

const SAMPLES = [
  {
    title: "5步搞定！零失败的懒人蛋炒饭",
    content: "今天教大家做超简单的蛋炒饭，只需要鸡蛋、隔夜饭和葱花。",
    tags: "美食分享,蛋炒饭,快手菜",
    category: "food",
  },
  {
    title: "这件外套也太好看了吧",
    content: "今年秋冬必入的一件外套！面料超舒服，版型也很好。",
    tags: "穿搭,秋冬穿搭,外套推荐",
    category: "fashion",
  },
  {
    title: "用了3个月的平板终于来测评了",
    content: "作为一个重度用户，这款平板的使用体验如何？今天给大家详细聊聊。",
    tags: "科技,平板测评,数码好物",
    category: "tech",
  },
];

interface HistoryItem {
  title: string;
  score: number;
  grade: string;
  category: string;
  date: number;
}

const GRADE_COLOR: Record<string, string> = {
  S: "#10b981",
  A: "#3b82f6",
  B: "#8b5cf6",
  C: "#f59e0b",
  D: "#ef4444",
};

const CATEGORY_LABEL: Record<string, string> = {
  food: "美食",
  fashion: "穿搭",
  tech: "科技",
  travel: "旅行",
  beauty: "美妆",
  fitness: "健身",
};

export default function Home() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<InputMode>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("food");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("noterx_history");
      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (file) {
          setCoverFile(file);
          setMode("screenshot");
        }
        break;
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const canSubmit = mode === "screenshot" ? coverFile !== null : title.trim().length > 0;

  const handleSubmit = () => {
    navigate("/diagnosing", {
      state: { title, content, tags, category, coverFile },
    });
  };

  const fillSample = (sample: (typeof SAMPLES)[0]) => {
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
        setLinkError(result.error || "解析失败");
      } else {
        setTitle(result.title);
        setContent(result.content);
        setTags(result.tags.join(","));
        setMode("text");
      }
    } catch {
      setLinkError("网络错误，请稍后重试");
    } finally {
      setLinkLoading(false);
    }
  };

  const tabIndex = mode === "text" ? 0 : mode === "screenshot" ? 1 : 2;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #fafafa 0%, #f1f5f9 100%)",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: "1.75rem", md: "2rem" },
                fontWeight: 700,
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              薯医 NoteRx
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                fontSize: "0.9375rem",
                color: "text.secondary",
                fontWeight: 400,
              }}
            >
              AI 驱动的小红书笔记诊断工作台
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon sx={{ fontSize: 18 }} />}
            onClick={() => navigate("/history")}
            sx={{
              minWidth: 120,
              borderColor: "rgba(15, 23, 42, 0.12)",
              color: "text.secondary",
              fontWeight: 500,
              "&:hover": {
                borderColor: "rgba(15, 23, 42, 0.2)",
                backgroundColor: "rgba(15, 23, 42, 0.02)",
              },
            }}
          >
            历史记录
          </Button>
        </Box>

        {/* Main Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.5fr 1fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          {/* Main Input Card */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 3,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 20px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: "1.125rem",
                letterSpacing: "-0.01em",
                mb: 0.5,
              }}
            >
              新建诊断
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 3,
                fontSize: "0.875rem",
              }}
            >
              选择输入方式，填写内容后开始诊断
            </Typography>

            {/* Tabs */}
            <Tabs
              value={tabIndex}
              onChange={(_, value) => setMode((["text", "screenshot", "link"] as InputMode[])[value])}
              variant="fullWidth"
              sx={{
                borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                mb: 3,
                minHeight: 44,
                "& .MuiTabs-flexContainer": {
                  gap: 1,
                },
              }}
            >
              <Tab
                icon={<DescriptionOutlined sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="文字"
                sx={{ minHeight: 44, textTransform: "none" }}
              />
              <Tab
                icon={<CameraAltOutlined sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="截图"
                sx={{ minHeight: 44, textTransform: "none" }}
              />
              <Tab
                icon={<LinkIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="链接"
                sx={{ minHeight: 44, textTransform: "none" }}
              />
            </Tabs>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {mode === "text" && (
                <motion.div key="text" {...tabContentMotion}>
                  <Stack spacing={2.5}>
                    <TextField
                      label="笔记标题"
                      required
                      fullWidth
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="输入你的笔记标题"
                      slotProps={{ htmlInput: { maxLength: 100 } }}
                      helperText={`${title.length}/100`}
                      sx={{
                        "& .MuiInputLabel-root": {
                          fontWeight: 500,
                          color: "text.secondary",
                        },
                        "& .MuiFormHelperText-root": {
                          fontSize: "0.75rem",
                          color: "text.tertiary",
                          ml: 0,
                        },
                      }}
                    />
                    <TextField
                      label="笔记正文"
                      fullWidth
                      multiline
                      minRows={5}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="粘贴笔记正文（可选）"
                      sx={{
                        "& .MuiInputLabel-root": {
                          fontWeight: 500,
                          color: "text.secondary",
                        },
                      }}
                    />
                    <TextField
                      label="标签"
                      fullWidth
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="用逗号分隔，如：美食分享,减脂餐"
                      sx={{
                        "& .MuiInputLabel-root": {
                          fontWeight: 500,
                          color: "text.secondary",
                        },
                      }}
                    />
                  </Stack>
                </motion.div>
              )}

              {mode === "screenshot" && (
                <motion.div key="screenshot" {...tabContentMotion}>
                  <Stack spacing={2.5}>
                    <UploadZone onFileSelect={setCoverFile} />
                    <TextField
                      label="笔记标题（可选）"
                      fullWidth
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="留空则由 AI 自动识别"
                      sx={{
                        "& .MuiInputLabel-root": {
                          fontWeight: 500,
                          color: "text.secondary",
                        },
                      }}
                    />
                  </Stack>
                </motion.div>
              )}

              {mode === "link" && (
                <motion.div key="link" {...tabContentMotion}>
                  <Stack spacing={2}>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <TextField
                        fullWidth
                        label="小红书笔记链接"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="粘贴小红书分享链接"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <LinkIcon sx={{ color: "text.tertiary", fontSize: 18 }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                        sx={{
                          "& .MuiInputLabel-root": {
                            fontWeight: 500,
                            color: "text.secondary",
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        disabled={linkLoading || !linkUrl.trim()}
                        onClick={handleParseLink}
                        sx={{
                          minWidth: 88,
                          flexShrink: 0,
                          px: 3,
                        }}
                      >
                        {linkLoading ? <CircularProgress size={18} color="inherit" /> : "解析"}
                      </Button>
                    </Box>
                    {linkError && (
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {linkError}
                      </Alert>
                    )}
                    {title && (
                      <Alert severity="success" sx={{ borderRadius: 2 }}>
                        已解析：{title}
                      </Alert>
                    )}
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>

            <Divider sx={{ my: 3, borderColor: "rgba(15, 23, 42, 0.06)" }} />

            {/* Category */}
            <Typography
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "text.primary",
                mb: 1.5,
                letterSpacing: "-0.005em",
              }}
            >
              选择垂类
            </Typography>
            <CategoryPicker value={category} onChange={setCategory} />

            {/* Submit Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubmit}
              disabled={!canSubmit}
              endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
              sx={{
                mt: 3.5,
                height: 48,
                fontWeight: 600,
                fontSize: "0.9375rem",
                background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                "&:hover": {
                  background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
                  boxShadow: "0 6px 20px rgba(124, 58, 237, 0.45)",
                  transform: "translateY(-1px)",
                },
                "&:disabled": {
                  background: "rgba(15, 23, 42, 0.08)",
                  color: "rgba(15, 23, 42, 0.3)",
                  boxShadow: "none",
                },
                transition: "all 0.2s ease",
              }}
            >
              开始诊断
            </Button>
          </Paper>

          {/* Sidebar */}
          <Stack spacing={3}>
            {/* Quick Samples */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid rgba(15, 23, 42, 0.08)",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  mb: 2,
                  letterSpacing: "-0.005em",
                }}
              >
                快速体验
              </Typography>
              <Stack spacing={1.5}>
                {SAMPLES.map((sample, index) => (
                  <Box
                    key={sample.title}
                    component={motion.div}
                    whileHover={{ x: 2, backgroundColor: "rgba(124, 58, 237, 0.04)" }}
                    transition={{ duration: 0.15 }}
                    onClick={() => fillSample(sample)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: "rgba(15, 23, 42, 0.08)",
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      transition: "border-color 0.15s ease",
                      "&:hover": {
                        borderColor: "rgba(124, 58, 237, 0.3)",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "text.tertiary",
                        fontWeight: 500,
                        mb: 0.5,
                      }}
                    >
                      示例 {index + 1} · {CATEGORY_LABEL[sample.category]}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "text.primary",
                        lineHeight: 1.4,
                      }}
                    >
                      {sample.title}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Recent History */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid rgba(15, 23, 42, 0.08)",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  mb: 2,
                  letterSpacing: "-0.005em",
                }}
              >
                最近诊断
              </Typography>
              {history.length === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    textAlign: "center",
                    color: "text.tertiary",
                    fontSize: "0.875rem",
                  }}
                >
                  <Typography sx={{ fontSize: "2rem", mb: 1 }}>📝</Typography>
                  <Typography sx={{ fontSize: "0.875rem" }}>
                    还没有诊断记录
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", mt: 0.5, opacity: 0.7 }}>
                    完成一次诊断后会在这里出现
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {history.slice(0, 5).map((item, index) => (
                    <Box
                      key={`${item.title}-${index}`}
                      sx={{
                        px: 2,
                        py: 1.5,
                        border: "1px solid",
                        borderColor: "rgba(15, 23, 42, 0.06)",
                        borderRadius: 2,
                        display: "grid",
                        gridTemplateColumns: "52px 1fr",
                        gap: 1.5,
                        alignItems: "center",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: "rgba(15, 23, 42, 0.12)",
                          backgroundColor: "rgba(15, 23, 42, 0.02)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "12px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          background: `linear-gradient(135deg, ${GRADE_COLOR[item.grade]}15, ${GRADE_COLOR[item.grade]}08)`,
                          border: `1.5px solid ${GRADE_COLOR[item.grade]}40`,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "1rem",
                            color: GRADE_COLOR[item.grade],
                            lineHeight: 1,
                          }}
                        >
                          {Math.round(item.score)}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.625rem",
                            fontWeight: 700,
                            color: GRADE_COLOR[item.grade],
                            mt: 0.25,
                          }}
                        >
                          {item.grade}
                        </Typography>
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "text.primary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: "text.tertiary",
                            mt: 0.25,
                          }}
                        >
                          {CATEGORY_LABEL[item.category] || item.category} · {new Date(item.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Box>

        {/* Footer */}
        <Typography
          sx={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "text.tertiary",
            mt: 6,
            pb: 2,
          }}
        >
          薯医 NoteRx · AI 驱动的小红书笔记诊断
        </Typography>
      </Box>
    </Box>
  );
}
