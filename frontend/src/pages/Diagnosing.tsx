import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Typography } from "@mui/material";
import { diagnoseNote } from "../utils/api";
import type { DiagnoseResult } from "../utils/api";
import { saveHistory } from "../utils/api";
import { FALLBACK_REPORT } from "../utils/fallback";

const STEPS = [
  "解析笔记内容",
  "分析封面视觉",
  "对比垂类数据",
  "内容分析师诊断中",
  "视觉诊断师诊断中",
  "增长策略师诊断中",
  "用户模拟器运行中",
  "Agent 辩论交锋",
  "综合裁判评定",
  "生成诊断报告",
];

// Linear-style spinner component
const LinearSpinner = () => (
  <Box sx={{ position: "relative", width: 48, height: 48 }}>
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
      {/* Track */}
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="rgba(15, 23, 42, 0.08)"
        strokeWidth="3"
      />
      {/* Animated arc */}
      <motion.circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="url(#gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="125.6"
        animate={{
          strokeDashoffset: [125.6, 31.4, 125.6],
          rotate: [0, 360],
        }}
        transition={{
          strokeDashoffset: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          },
        }}
        style={{ transformOrigin: "center" }}
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  </Box>
);

export default function Diagnosing() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = location.state as {
    title: string;
    content: string;
    tags: string;
    category: string;
    coverFile: File | null;
  } | null;

  const [step, setStep] = useState(0);
  const apiDone = useRef(false);
  const resultRef = useRef<{ report: unknown; isFallback: boolean } | null>(null);

  useEffect(() => {
    if (!params) {
      navigate("/");
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const result = await diagnoseNote({
          title: params.title,
          content: params.content,
          category: params.category,
          tags: params.tags,
          coverImage: params.coverFile ?? undefined,
        });
        resultRef.current = { report: result, isFallback: false };
        saveHistory({
          title: params.title,
          category: params.category,
          report: result as DiagnoseResult,
        }).catch((e) => console.warn("保存历史记录失败", e));
      } catch (err) {
        console.warn("API 不可用，使用 fallback", err);
        resultRef.current = { report: FALLBACK_REPORT, isFallback: true };
      }
      apiDone.current = true;
    })();

    const timer = setInterval(() => {
      setStep((prev) => {
        if (apiDone.current && prev >= STEPS.length - 2) {
          clearInterval(timer);
          setTimeout(() => {
            if (!cancelled && resultRef.current)
              navigate("/report", {
                state: {
                  report: resultRef.current.report,
                  params,
                  isFallback: resultRef.current.isFallback,
                },
              });
          }, 600);
          return STEPS.length - 1;
        }
        if (prev >= STEPS.length - 1) return prev;
        if (!apiDone.current && prev >= STEPS.length - 2) return prev;
        return prev + 1;
      });
    }, 2800);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!params) return null;

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(180deg, #fafafa 0%, #f1f5f9 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        {/* Spinner */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
          <LinearSpinner />
        </Box>

        {/* Step label with AnimatePresence */}
        <Box sx={{ height: 32, mb: 3 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <Typography
                sx={{
                  fontSize: "1.0625rem",
                  color: "text.primary",
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                }}
              >
                {STEPS[step]}
              </Typography>
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Progress bar */}
        <Box
          sx={{
            height: 4,
            bgcolor: "rgba(15, 23, 42, 0.06)",
            borderRadius: 2,
            overflow: "hidden",
            mb: 3,
          }}
        >
          <motion.div
            style={{
              height: "100%",
              borderRadius: 2,
              background: "linear-gradient(90deg, #7c3aed 0%, #8b5cf6 100%)",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />
        </Box>

        {/* Step counter */}
        <Typography
          sx={{
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "text.tertiary",
            mb: 1,
          }}
        >
          {step + 1} / {STEPS.length}
        </Typography>

        {/* Title preview */}
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: "text.secondary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            px: 2,
          }}
        >
          {params.title || "截图识别中"}
        </Typography>

        {/* Decorative dots */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 0.5,
            mt: 6,
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: i === 0 ? "#7c3aed" : "rgba(15, 23, 42, 0.15)",
              }}
              animate={{
                background: step % 3 === i ? "#7c3aed" : "rgba(15, 23, 42, 0.15)",
                scale: step % 3 === i ? 1.2 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
