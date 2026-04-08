import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Alert, Stack, IconButton, Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReplayIcon from "@mui/icons-material/Replay";
import { motion } from "framer-motion";
import type { DiagnoseResult } from "../utils/api";
import { saveHistory } from "../utils/api";
import ScoreCard from "../components/ScoreCard";
import DimensionBars from "../components/DimensionBars";
import RadarChart from "../components/RadarChart";
import BaselineComparison from "../components/BaselineComparison";
import AgentDebate from "../components/AgentDebate";
import SimulatedComments from "../components/SimulatedComments";
import SuggestionList from "../components/SuggestionList";
import DiagnoseCard from "../components/DiagnoseCard";
import { showToast } from "../components/Toast";

const cardStyle = {
  bgcolor: "background.paper",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: 3,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
  p: { xs: 2.5, md: 3 },
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
    borderColor: "rgba(15, 23, 42, 0.12)",
  },
};

function saveToLocalHistory(title: string, score: number, grade: string, category: string) {
  try {
    const raw = localStorage.getItem("noterx_history");
    const history = raw ? JSON.parse(raw) : [];
    history.unshift({ title, score: Math.round(score), grade, category, date: Date.now() });
    localStorage.setItem("noterx_history", JSON.stringify(history.slice(0, 10)));
  } catch { /* ignore */ }
}

async function saveToServer(title: string, category: string, report: DiagnoseResult) {
  try {
    await saveHistory({ title, category, report });
  } catch { /* server history is best-effort */ }
}

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    report: DiagnoseResult;
    params: { title: string; category: string; content?: string; tags?: string };
    isFallback?: boolean;
  } | null;

  useEffect(() => {
    document.title = `诊断报告 - 薯医 NoteRx`;
    if (state && !state.isFallback) {
      saveToLocalHistory(state.params.title, state.report.overall_score, state.report.grade, state.params.category);
      saveToServer(state.params.title, state.params.category, state.report);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "text.tertiary", fontSize: "0.9375rem", mb: 2 }}>暂无诊断数据</Typography>
          <Button
            onClick={() => navigate("/")}
            sx={{
              color: "primary.main",
              fontWeight: 600,
              "&:hover": { backgroundColor: "rgba(124, 58, 237, 0.04)" }
            }}
          >
            返回首页
          </Button>
        </Box>
      </Box>
    );
  }

  const { report, params, isFallback } = state;
  const userTags = typeof params.tags === "string"
    ? params.tags.split(",").filter(Boolean)
    : Array.isArray(params.tags) ? params.tags : [];

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label}已复制`);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 6 }}>
      {/* Top bar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          bgcolor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
        }}
      >
        <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 2, md: 3 }, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate("/")}
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              fontSize: "0.875rem",
              "&:hover": { color: "text.primary", backgroundColor: "rgba(15, 23, 42, 0.04)" }
            }}
          >
            首页
          </Button>
          <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem", color: "text.primary", letterSpacing: "-0.01em" }}>
            诊断报告
          </Typography>
          <Button
            startIcon={<ReplayIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate("/diagnosing", { state: params })}
            sx={{ color: "#999", fontWeight: 500, fontSize: 13, "&:hover": { color: "#262626" } }}
          >
            再次诊断
          </Button>
        </Box>
      </Box>

      {isFallback && (
        <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 2, md: 3 }, mt: 3 }}>
          <Alert
            severity="warning"
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(245, 158, 11, 0.2)",
              bgcolor: "rgba(245, 158, 11, 0.05)",
            }}
          >
            当前展示的是演示数据
          </Alert>
        </Box>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
        <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 2, md: 3 }, mt: 3 }}>

          {/* Row 1: Score + Dimension Bars + Radar */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2.5, mb: 2.5 }}>
            <Box sx={cardStyle}>
              <ScoreCard score={report.overall_score} grade={report.grade} title={params.title} />
            </Box>
            <Box sx={cardStyle}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem", color: "text.primary", mb: 2, letterSpacing: "-0.005em" }}>
                维度评分
              </Typography>
              <DimensionBars data={report.radar_data} />
            </Box>
            <Box sx={cardStyle}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem", color: "text.primary", mb: 1, letterSpacing: "-0.005em" }}>
                五维雷达
              </Typography>
              <RadarChart data={report.radar_data} />
            </Box>
          </Box>

          {/* Row 2: Baseline comparison + Suggestions */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 3fr" }, gap: 2.5, mb: 2.5 }}>
            <Box sx={cardStyle}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem", color: "text.primary", mb: 2, letterSpacing: "-0.005em" }}>
                基线对比
              </Typography>
              <BaselineComparison category={params.category} userTitle={params.title} userTags={userTags} />
              <Typography sx={{ fontSize: "0.75rem", color: "text.tertiary", mt: 2 }}>
                与该垂类历史数据对比
              </Typography>
            </Box>
            <Box sx={cardStyle}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem", color: "text.primary", mb: 2, letterSpacing: "-0.005em" }}>
                优化建议
              </Typography>
              <SuggestionList suggestions={report.suggestions} />
            </Box>
          </Box>

          {/* Row 3: Optimized content */}
          {(report.optimized_title || report.optimized_content || report.cover_direction) && (
            <Box sx={{ ...cardStyle, mb: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem", color: "text.primary", letterSpacing: "-0.005em" }}>
                  AI 优化方案
                </Typography>
                {report.optimized_title && report.optimized_content && (
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                    onClick={() => {
                      const all = `标题：${report.optimized_title}\n\n${report.optimized_content}`;
                      navigator.clipboard.writeText(all);
                      showToast("已复制标题和正文");
                    }}
                    sx={{ color: "#999", fontSize: 12, "&:hover": { color: "#262626" } }}
                  >
                    复制全部
                  </Button>
                )}
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                {report.optimized_title && (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: "rgba(124, 58, 237, 0.04)",
                      border: "1px solid rgba(124, 58, 237, 0.12)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 1.5,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: "rgba(124, 58, 237, 0.2)",
                        boxShadow: "0 2px 8px rgba(124, 58, 237, 0.08)",
                      }
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "primary.main", mb: 0.75, letterSpacing: "0.025em" }}>
                        建议标题
                      </Typography>
                      <Typography sx={{ fontSize: "0.9375rem", color: "text.primary", lineHeight: 1.5, fontWeight: 500 }}>
                        {report.optimized_title}
                      </Typography>
                    </Box>
                    <Tooltip title="复制">
                      <IconButton
                        size="small"
                        onClick={() => copyText(report.optimized_title || "", "标题")}
                        sx={{
                          color: "text.tertiary",
                          flexShrink: 0,
                          width: 32,
                          height: 32,
                          "&:hover": { color: "primary.main", bgcolor: "rgba(124, 58, 237, 0.08)" }
                        }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
                {report.optimized_content && (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: "rgba(59, 130, 246, 0.04)",
                      border: "1px solid rgba(59, 130, 246, 0.12)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 1.5,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: "rgba(59, 130, 246, 0.2)",
                        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.08)",
                      }
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "info.main", mb: 0.75, letterSpacing: "0.025em" }}>
                        优化正文
                      </Typography>
                      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                        {report.optimized_content}
                      </Typography>
                    </Box>
                    <Tooltip title="复制">
                      <IconButton
                        size="small"
                        onClick={() => copyText(report.optimized_content || "", "正文")}
                        sx={{
                          color: "text.tertiary",
                          flexShrink: 0,
                          width: 32,
                          height: 32,
                          "&:hover": { color: "info.main", bgcolor: "rgba(59, 130, 246, 0.08)" }
                        }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
              {report.cover_direction && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: "rgba(15, 23, 42, 0.03)",
                    border: "1px solid rgba(15, 23, 42, 0.08)"
                  }}
                >
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.tertiary", mb: 1.25, letterSpacing: "0.025em" }}>
                    封面方向
                  </Typography>
                  <Stack spacing={0.75}>
                    {report.cover_direction.layout && (
                      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                        <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>构图：</Box>
                        {report.cover_direction.layout}
                      </Typography>
                    )}
                    {report.cover_direction.color_scheme && (
                      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                        <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>配色：</Box>
                        {report.cover_direction.color_scheme}
                      </Typography>
                    )}
                    {report.cover_direction.text_style && (
                      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                        <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>文字：</Box>
                        {report.cover_direction.text_style}
                      </Typography>
                    )}
                    {report.cover_direction.tips?.map((tip: string, i: number) => (
                      <Typography key={i} sx={{ fontSize: "0.875rem", color: "text.secondary", pl: 1.5, position: "relative", "&::before": { content: '"·"', position: "absolute", left: 0, color: "text.tertiary" } }}>
                        {tip}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          )}

          {/* Row 4: Agent debate + Comments */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" }, gap: 2.5, mb: 2.5 }}>
            <Box sx={cardStyle}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem", color: "text.primary", mb: 2, letterSpacing: "-0.005em" }}>
                Agent 诊断详情
              </Typography>
              <AgentDebate opinions={report.agent_opinions} summary={report.debate_summary} timeline={report.debate_timeline} />
            </Box>
            <Box sx={cardStyle}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem", color: "text.primary", mb: 2, letterSpacing: "-0.005em" }}>
                模拟评论区
              </Typography>
              <SimulatedComments
                comments={report.simulated_comments}
                noteTitle={params.title}
                noteContent={params.content || ""}
                noteCategory={params.category}
              />
            </Box>
          </Box>

          {/* Row 5: Export */}
          <Box sx={cardStyle}>
            <DiagnoseCard report={report} title={params.title} />
          </Box>

          {/* Footer */}
          <Typography
            sx={{
              textAlign: "center",
              fontSize: "0.75rem",
              color: "text.tertiary",
              mt: 4,
              letterSpacing: "0.01em"
            }}
          >
            本报告由 AI 多 Agent 协作生成，仅供参考
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
}
