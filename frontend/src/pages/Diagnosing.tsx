import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import { diagnoseNote, saveHistory, type DiagnoseResult } from "../utils/api";
import { FALLBACK_REPORT } from "../utils/fallback";

const STEPS = [
  "解析笔记内容",
  "分析图片/视频首帧",
  "对比垂类基线",
  "内容诊断中",
  "视觉诊断中",
  "增长诊断中",
  "用户模拟中",
  "Agent 辩论中",
  "综合评定中",
  "生成诊断报告",
];

export default function Diagnosing() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = location.state as {
    title: string;
    content: string;
    tags: string;
    category: string;
    coverFile: File | null;
    coverImages?: File[];
    videoFile?: File | null;
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
          coverImages: params.coverImages ?? [],
          videoFile: params.videoFile ?? undefined,
        });

        resultRef.current = { report: result, isFallback: false };
        saveHistory({
          title: params.title,
          category: params.category,
          report: result as DiagnoseResult,
        }).catch(() => undefined);
      } catch {
        resultRef.current = { report: FALLBACK_REPORT, isFallback: true };
      }
      apiDone.current = true;
    })();

    const timer = setInterval(() => {
      setStep((prev) => {
        if (apiDone.current && prev >= STEPS.length - 2) {
          clearInterval(timer);
          setTimeout(() => {
            if (!cancelled && resultRef.current) {
              navigate("/report", {
                state: {
                  report: resultRef.current.report,
                  params,
                  isFallback: resultRef.current.isFallback,
                },
              });
            }
          }, 520);
          return STEPS.length - 1;
        }

        if (prev >= STEPS.length - 1) return prev;
        if (!apiDone.current && prev >= STEPS.length - 2) return prev;
        return prev + 1;
      });
    }, 2400);

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
        bgcolor: "#f7f7f8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid #eceff3",
          borderRadius: 2,
          bgcolor: "#fff",
          p: 2,
          textAlign: "center",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.8 }}>
          <Box
            component={motion.div}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.3, ease: "linear", repeat: Infinity }}
            sx={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "2px solid #e5e7eb",
              borderTopColor: "#ff2442",
            }}
          />
        </Box>

        <Box sx={{ height: 22, mb: 1.4 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <Typography sx={{ fontSize: "0.82rem", color: "#374151", fontWeight: 600 }}>
                {STEPS[step]}
              </Typography>
            </motion.div>
          </AnimatePresence>
        </Box>

        <Box sx={{ height: 4, borderRadius: 99, bgcolor: "#f1f3f5", overflow: "hidden", mb: 1 }}>
          <motion.div
            style={{ height: "100%", borderRadius: 99, background: "#ff2442" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45 }}
          />
        </Box>

        <Typography sx={{ fontSize: "0.7rem", color: "#9ca3af" }}>
          {step + 1} / {STEPS.length}
        </Typography>

        <Typography
          sx={{
            mt: 1,
            fontSize: "0.72rem",
            color: "#6b7280",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {params.title || "媒体内容识别中"}
        </Typography>
      </Box>
    </Box>
  );
}
