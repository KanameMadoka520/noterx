import { useState, useCallback } from "react";
import { Box, Typography, Stack, Button, CircularProgress } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { SimulatedComment, CommentWithReplies } from "../utils/api";
import { generateComments } from "../utils/api";

interface Props {
  comments: SimulatedComment[];
  noteTitle?: string;
  noteContent?: string;
  noteCategory?: string;
}

const SENTIMENT_DOT: Record<string, string> = {
  positive: "#16a34a",
  negative: "#dc2626",
  neutral: "#bbb",
};

function randomLikes() {
  return Math.floor(Math.random() * 200) + 5;
}

interface CommentState extends CommentWithReplies {
  _likes: number;
  _liked: boolean;
  _showReplies: boolean;
  _replies: Array<SimulatedComment & { _likes: number; _liked: boolean }>;
}

function toCommentState(c: SimulatedComment | CommentWithReplies): CommentState {
  const replies = ("replies" in c && Array.isArray(c.replies) ? c.replies : []).map((r) => ({
    ...r,
    _likes: randomLikes(),
    _liked: false,
  }));
  return {
    ...c,
    _likes: randomLikes(),
    _liked: false,
    _showReplies: replies.length > 0,
    _replies: replies,
  };
}

export default function SimulatedComments({ comments: initial, noteTitle = "", noteContent = "", noteCategory = "food" }: Props) {
  const [comments, setComments] = useState<CommentState[]>(() => initial.map(toCommentState));
  const [loading, setLoading] = useState(false);

  const toggleLike = useCallback((idx: number) => {
    setComments((prev) => prev.map((c, i) =>
      i === idx ? { ...c, _liked: !c._liked, _likes: c._liked ? c._likes - 1 : c._likes + 1 } : c
    ));
  }, []);

  const toggleReplyLike = useCallback((commentIdx: number, replyIdx: number) => {
    setComments((prev) => prev.map((c, i) => {
      if (i !== commentIdx) return c;
      const newReplies = c._replies.map((r, j) =>
        j === replyIdx ? { ...r, _liked: !r._liked, _likes: r._liked ? r._likes - 1 : r._likes + 1 } : r
      );
      return { ...c, _replies: newReplies };
    }));
  }, []);

  const toggleShowReplies = useCallback((idx: number) => {
    setComments((prev) => prev.map((c, i) =>
      i === idx ? { ...c, _showReplies: !c._showReplies } : c
    ));
  }, []);

  const handleLoadMore = async () => {
    setLoading(true);
    try {
      const newComments = await generateComments({
        title: noteTitle,
        content: noteContent,
        category: noteCategory,
        existing_count: comments.length,
      });
      setComments((prev) => [...prev, ...newComments.map(toCommentState)]);
    } catch (err) {
      console.warn("生成评论失败", err);
    } finally {
      setLoading(false);
    }
  };

  if (!comments.length) {
    return <Typography sx={{ fontSize: 14, color: "#999" }}>暂无模拟评论</Typography>;
  }

  return (
    <Stack spacing={0}>
      {comments.map((c, i) => (
        <Box key={`${c.username}-${i}`}>
          {/* Main comment */}
          <Box sx={{ py: 1.5, borderBottom: "1px solid #f5f5f5" }}>
            <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 32, height: 32, borderRadius: "50%", bgcolor: "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, flexShrink: 0,
                }}
              >
                {c.avatar_emoji}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#262626" }}>
                    {c.username}
                  </Typography>
                  <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: SENTIMENT_DOT[c.sentiment] || "#bbb" }} />
                </Box>
                <Typography sx={{ fontSize: 13.5, color: "#505050", lineHeight: 1.6, mt: 0.25 }}>
                  {c.comment}
                </Typography>

                {/* Actions */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.75 }}>
                  <Box
                    onClick={() => toggleLike(i)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer", userSelect: "none",
                      color: c._liked ? "#ff2442" : "#bbb",
                      "&:hover": { color: c._liked ? "#d91a36" : "#999" },
                      transition: "color 0.15s",
                    }}
                  >
                    <LikeIcon filled={c._liked} size={14} />
                    <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{c._likes}</Typography>
                  </Box>

                  {c._replies.length > 0 && (
                    <Typography
                      onClick={() => toggleShowReplies(i)}
                      sx={{
                        fontSize: 12, color: "#999", cursor: "pointer", userSelect: "none",
                        "&:hover": { color: "#262626" },
                      }}
                    >
                      {c._showReplies ? "收起回复" : `${c._replies.length} 条回复`}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Replies */}
            {c._showReplies && c._replies.length > 0 && (
              <Box sx={{ ml: 5.5, mt: 1, pl: 1.5, borderLeft: "2px solid #f0f0f0" }}>
                {c._replies.map((r, j) => (
                  <Box key={j} sx={{ py: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography sx={{ fontSize: 12, color: "#262626", fontWeight: 600 }}>
                        {r.avatar_emoji} {r.username}
                      </Typography>
                      <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: SENTIMENT_DOT[r.sentiment] || "#bbb" }} />
                    </Box>
                    <Typography sx={{ fontSize: 13, color: "#666", lineHeight: 1.5, mt: 0.25 }}>
                      {r.comment}
                    </Typography>
                    <Box
                      onClick={() => toggleReplyLike(i, j)}
                      sx={{
                        display: "inline-flex", alignItems: "center", gap: 0.4, mt: 0.5,
                        cursor: "pointer", userSelect: "none",
                        color: r._liked ? "#ff2442" : "#ccc",
                        "&:hover": { color: r._liked ? "#d91a36" : "#999" },
                        transition: "color 0.15s",
                      }}
                    >
                      <LikeIcon filled={r._liked} size={12} />
                      <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{r._likes}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      ))}

      {/* Load more */}
      <Box sx={{ pt: 2, textAlign: "center" }}>
        <Button
          size="small"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: 16 }} />}
          disabled={loading}
          onClick={handleLoadMore}
          sx={{
            color: "#999", fontSize: 13, fontWeight: 500, borderRadius: "8px",
            "&:hover": { color: "#262626", bgcolor: "#f5f5f5" },
          }}
        >
          {loading ? "生成中..." : "换一批评论"}
        </Button>
      </Box>
    </Stack>
  );
}

/* Simple SVG heart icon */
function LikeIcon({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
