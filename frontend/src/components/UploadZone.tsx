import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";

export interface UploadMediaState {
  images: File[];
  video: File | null;
}

interface Props {
  value: UploadMediaState;
  onChange: (next: UploadMediaState) => void;
}

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_COUNT = 9;
const MAX_VIDEO_SIZE_MB = 200;

const bytesToMB = (value: number) => `${(value / (1024 * 1024)).toFixed(1)} MB`;

export default function UploadZone({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const imagePreviews = useMemo(
    () =>
      value.images.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        url: URL.createObjectURL(file),
      })),
    [value.images]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [imagePreviews]);

  const videoPreview = useMemo(() => {
    if (!value.video) return null;
    return URL.createObjectURL(value.video);
  }, [value.video]);

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [videoPreview]);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clearAll = useCallback(() => {
    setError("");
    onChange({ images: [], video: null });
  }, [onChange]);

  const removeImageAt = useCallback(
    (index: number) => {
      const nextImages = value.images.filter((_, i) => i !== index);
      onChange({ images: nextImages, video: null });
    },
    [onChange, value.images]
  );

  const applyFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      setError("");

      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      const videoFiles = files.filter((file) => file.type.startsWith("video/"));
      const invalidFiles = files.filter(
        (file) => !file.type.startsWith("image/") && !file.type.startsWith("video/")
      );

      if (invalidFiles.length > 0) {
        setError("仅支持图片或视频文件。");
      }

      if (imageFiles.length === 0 && videoFiles.length === 0) {
        return;
      }

      if (videoFiles.length > 0 && (imageFiles.length > 0 || value.images.length > 0)) {
        setError("图片和视频不能混合上传，请二选一。");
        return;
      }

      if (videoFiles.length > 0) {
        if (videoFiles.length > 1) {
          setError("一次只能上传一个视频。");
        }

        const firstVideo = videoFiles[0];
        if (firstVideo.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
          setError(`视频过大，最大支持 ${MAX_VIDEO_SIZE_MB}MB。`);
          return;
        }

        onChange({ images: [], video: firstVideo });
        return;
      }

      if (value.video && imageFiles.length > 0) {
        setError("已选择视频，请先移除视频再上传图片。");
        return;
      }

      const oversized = imageFiles.find((file) => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024);
      if (oversized) {
        setError(
          `图片「${oversized.name}」大小为 ${bytesToMB(oversized.size)}，超过 ${MAX_IMAGE_SIZE_MB}MB 限制。`
        );
        return;
      }

      const nextImages = [...value.images, ...imageFiles];
      if (nextImages.length > MAX_IMAGE_COUNT) {
        setError(`最多只能上传 ${MAX_IMAGE_COUNT} 张图片。`);
      }

      onChange({ images: nextImages.slice(0, MAX_IMAGE_COUNT), video: null });
    },
    [onChange, value.images, value.video]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      applyFiles(Array.from(event.dataTransfer.files || []));
    },
    [applyFiles]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      applyFiles(Array.from(event.target.files || []));
      event.target.value = "";
    },
    [applyFiles]
  );

  const hasMedia = value.video !== null || value.images.length > 0;

  return (
    <Stack spacing={1}>
      <Typography sx={{ fontSize: "0.68rem", color: "#9ca3af" }}>
        图片上传指引：最多 {MAX_IMAGE_COUNT} 张，单张不超过 {MAX_IMAGE_SIZE_MB}MB；视频仅支持 1 个，最大 {MAX_VIDEO_SIZE_MB}MB。
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ borderRadius: 1.25, py: 0.25, "& .MuiAlert-message": { fontSize: "0.72rem" } }}>
          {error}
        </Alert>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/quicktime,video/webm,video/x-matroska"
        multiple
        onChange={handleChange}
        style={{ display: "none" }}
      />

      <Box
        onClick={openPicker}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        sx={{
          border: "1px dashed",
          borderColor: isDragging ? "#ff2442" : "#e5e7eb",
          borderRadius: 1.5,
          bgcolor: isDragging ? "rgba(255,36,66,0.02)" : "#fcfcfd",
          p: hasMedia ? 1 : 1.8,
          transition: "all 0.15s ease",
          cursor: "pointer",
        }}
      >
        <AnimatePresence mode="wait">
          {value.video ? (
            <motion.div
              key="video-preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Box component="video" src={videoPreview || undefined} controls preload="metadata" sx={{ width: "100%", maxHeight: 220, borderRadius: 1, backgroundColor: "#000" }} />
              <Stack direction="row" sx={{ mt: 0.8, justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.68rem", color: "#6b7280" }}>
                  {value.video.name} · {bytesToMB(value.video.size)}
                </Typography>
                <Button
                  size="small"
                  color="error"
                  sx={{ minWidth: "auto", px: 0.75, fontSize: "0.68rem" }}
                  onClick={(event) => {
                    event.stopPropagation();
                    clearAll();
                  }}
                >
                  移除
                </Button>
              </Stack>
            </motion.div>
          ) : value.images.length > 0 ? (
            <motion.div
              key="images-preview"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" }, gap: 0.7 }}>
                {imagePreviews.map((item, index) => (
                  <Box key={item.key} sx={{ position: "relative", borderRadius: 1, overflow: "hidden", border: "1px solid #e5e7eb", aspectRatio: "3 / 4" }}>
                    <Box component="img" src={item.url} alt={item.file.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {index === 0 && (
                      <Box sx={{ position: "absolute", left: 4, top: 4, px: 0.5, borderRadius: 0.5, fontSize: "0.6rem", color: "#fff", bgcolor: "rgba(255,36,66,0.85)", fontWeight: 600 }}>
                        封面
                      </Box>
                    )}
                    <Box
                      onClick={(event) => {
                        event.stopPropagation();
                        removeImageAt(index);
                      }}
                      sx={{
                        position: "absolute",
                        right: 4,
                        top: 4,
                        width: 18,
                        height: 18,
                        borderRadius: 0.75,
                        bgcolor: "rgba(17,24,39,0.72)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 12 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
              <Stack direction="row" sx={{ mt: 0.8, justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.68rem", color: "#6b7280" }}>
                  已选 {value.images.length}/{MAX_IMAGE_COUNT} 张，点击区域继续添加
                </Typography>
                <Button
                  size="small"
                  color="error"
                  sx={{ minWidth: "auto", px: 0.75, fontSize: "0.68rem" }}
                  onClick={(event) => {
                    event.stopPropagation();
                    clearAll();
                  }}
                >
                  清空
                </Button>
              </Stack>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ textAlign: "center" }}
            >
              <CloudUploadIcon sx={{ fontSize: 18, color: "#9ca3af", mb: 0.35 }} />
              <Typography sx={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 500 }}>
                {isDragging ? "松开以上传" : "点击或拖拽上传"}
              </Typography>
              <Typography sx={{ fontSize: "0.65rem", color: "#9ca3af", mt: 0.2 }}>
                支持多图适配、视频适配，图片可直接粘贴（Ctrl+V）
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Stack>
  );
}
