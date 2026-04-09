"""
小米 MiMo 视频理解（chat.completions 多模态）请求体构造。

对齐官方说明：视频理解 · OpenAI 兼容 Chat Completions。
文档：https://platform.xiaomimimo.com/#/docs/usage-guide/multimodal-understanding/video-understanding

要点（与控制台示例一致）：
- `content` 中单条使用 `type: video_url`；同一 user 消息内建议只放「视频 + 文本」，避免与多图/音频混传导致质量下降（官方提示）。
- `video_url` 对象内含公网可访问的 `url` 与采样 `fps`。
- `media_resolution` 与 `video_url` 同级，取 `default` 或 `max`。
"""
from __future__ import annotations

import os


def mimo_video_fps() -> float:
    """@returns 采样帧率，限制在 MiMo 常用区间内。"""
    for key in ("MIMO_VIDEO_FPS", "QUICK_RECOGNIZE_VIDEO_FPS"):
        raw = os.getenv(key)
        if raw and raw.strip():
            try:
                return max(0.1, min(float(raw.strip()), 10.0))
            except ValueError:
                break
    return 2.0


def mimo_video_media_resolution() -> str:
    """@returns `default` 或 `max`（非法值回退 default）。"""
    r = (os.getenv("MIMO_VIDEO_MEDIA_RESOLUTION") or "default").strip().lower()
    return r if r in ("default", "max") else "default"


def build_mimo_video_url_content_part(video_url: str) -> dict:
    """
    构造单条 user content part：`video_url` + `media_resolution`。
    @param video_url - 公网 HTTPS（推荐）可访问的视频直链
    """
    return {
        "type": "video_url",
        "video_url": {
            "url": video_url,
            "fps": mimo_video_fps(),
        },
        "media_resolution": mimo_video_media_resolution(),
    }
