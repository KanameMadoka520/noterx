import { useCallback, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";

interface Props {
  onFileSelect: (file: File | null) => void;
}

export default function UploadZone({ onFileSelect }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClear = useCallback(() => {
    setPreview(null);
    onFileSelect(null);
  }, [onFileSelect]);

  return (
    <Box
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      sx={{
        position: "relative",
        border: "2px dashed",
        borderColor: isDragging ? "primary.main" : "rgba(15, 23, 42, 0.15)",
        borderRadius: 3,
        bgcolor: isDragging ? "rgba(124, 58, 237, 0.04)" : "rgba(15, 23, 42, 0.02)",
        transition: "all 0.2s ease",
        cursor: "pointer",
        overflow: "hidden",
        minHeight: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "&:hover": {
          borderColor: "rgba(124, 58, 237, 0.4)",
          bgcolor: "rgba(124, 58, 237, 0.03)",
        },
      }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
      />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ position: "relative", width: "100%", height: "100%" }}
          >
            <Box
              component="img"
              src={preview}
              alt="Preview"
              sx={{
                width: "100%",
                height: 180,
                objectFit: "cover",
                borderRadius: 2.5,
              }}
            />
            <Box
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: "rgba(15, 23, 42, 0.7)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: "rgba(239, 68, 68, 0.9)",
                  transform: "scale(1.05)",
                },
              }}
            >
              <DeleteIcon sx={{ fontSize: 16, color: "#fff" }} />
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: "center", padding: "2rem" }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                bgcolor: "rgba(124, 58, 237, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              {isDragging ? (
                <CloudUploadIcon sx={{ fontSize: 28, color: "primary.main" }} />
              ) : (
                <ImageIcon sx={{ fontSize: 28, color: "primary.main" }} />
              )}
            </Box>
            <Typography
              sx={{
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: "text.primary",
                mb: 0.5,
              }}
            >
              {isDragging ? "释放以上传" : "点击或拖拽上传截图"}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8125rem",
                color: "text.tertiary",
              }}
            >
              支持 JPG、PNG 格式，最大 10MB
            </Typography>
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "text.tertiary",
                mt: 1.5,
                opacity: 0.7,
              }}
            >
              提示：也可以直接粘贴图片 (Ctrl+V)
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
