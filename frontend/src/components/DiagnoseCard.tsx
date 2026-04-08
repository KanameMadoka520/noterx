import { useRef, useState } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import html2canvas from "html2canvas";
import type { DiagnoseResult } from "../utils/api";

interface Props {
  report: DiagnoseResult;
  title: string;
}

export default function DiagnoseCard({ report, title }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `薯医诊断-${title.slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("导出失败", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<FileDownloadIcon />}
        disabled={exporting}
        onClick={handleExport}
        sx={{
          py: 1.25,
          borderRadius: "12px",
          fontWeight: 600,
          fontSize: 14,
          color: "#262626",
          borderColor: "#e0e0e0",
          "&:hover": { borderColor: "#262626", bgcolor: "#fafafa" },
        }}
      >
        {exporting ? "导出中..." : "导出诊断卡片"}
      </Button>

      <Box
        ref={cardRef}
        sx={{
          mt: 2,
          border: "1px solid #f0f0f0",
          borderRadius: "16px",
          overflow: "hidden",
          bgcolor: "#fff",
          maxWidth: 400,
          mx: "auto",
        }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 2, textAlign: "center" }}>
          <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#262626" }}>
            {Math.round(report.overall_score)}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#8e8e8e", mt: 0.5 }}>
            {report.grade}
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: "#8e8e8e",
              mt: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            "{title}"
          </Typography>
        </Box>

        <Box sx={{ px: 3, py: 2, borderTop: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#8e8e8e", mb: 1 }}>
            主要问题
          </Typography>
          <Stack spacing={0.5}>
            {report.issues.slice(0, 3).map((issue, i) => (
              <Typography key={i} sx={{ fontSize: 13, color: "#505050", lineHeight: 1.5 }}>
                {i + 1}. {typeof issue === "string" ? issue : issue.description}
              </Typography>
            ))}
          </Stack>
        </Box>

        <Box sx={{ px: 3, py: 2, bgcolor: "#fafafa", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
          <Typography sx={{ fontSize: 12, color: "#8e8e8e", fontWeight: 600 }}>
            薯医 NoteRx
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
