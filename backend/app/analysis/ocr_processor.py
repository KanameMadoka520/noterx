"""
OCR 处理模块
使用 mimo-v2-omni 多模态模型提取截图中的笔记内容。
"""
from __future__ import annotations

import base64
import json
import os
import logging

logger = logging.getLogger("noterx.ocr")

from app.agents.base_agent import _is_mimo_openai_compat


class OCRProcessor:
    """从图片中提取文字内容"""

    async def extract_text(self, image_bytes: bytes, client=None) -> dict:
        if client is None:
            return self._fallback_result()

        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        ocr_model = os.getenv("LLM_MODEL_OMNI", "mimo-v2-omni")

        try:
            msg_body: list | str = [
                {"type": "text", "text": "请提取这张小红书笔记截图中的标题、正文和标签。"},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{b64_image}"},
                },
            ]
            kwargs = {
                "model": ocr_model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "你是一个小红书笔记内容提取器。"
                            "请从截图中精确提取笔记的标题、正文和标签。"
                            '以JSON格式输出：{"title": "...", "content": "...", "tags": [...]}'
                        ),
                    },
                    {"role": "user", "content": msg_body},
                ],
            }
            if _is_mimo_openai_compat():
                kwargs["max_completion_tokens"] = min(
                    int(os.getenv("LLM_OCR_MAX_TOKENS", "1500")), 4096
                )
            else:
                kwargs["max_tokens"] = 1500

            response = await client.chat.completions.create(**kwargs)
            raw = response.choices[0].message.content
            clean = raw.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(clean)
        except Exception as e:
            logger.warning("OCR 提取失败: %s", e)
            return self._fallback_result()

    def _fallback_result(self) -> dict:
        return {"title": "", "content": "", "tags": []}
