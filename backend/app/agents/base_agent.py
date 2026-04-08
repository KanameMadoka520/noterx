"""
Agent 基类
封装 LLM 调用、prompt 模板、结构化输出解析。
支持多模型：flash(快速) / pro(专业) / omni(多模态)。
"""
import json
import os
import logging
from typing import Optional
from pathlib import Path

from dotenv import load_dotenv

for p in [Path(__file__).resolve().parents[2] / ".env", Path.cwd() / ".env", Path.cwd().parent / ".env"]:
    if p.exists():
        load_dotenv(p)
        break

logger = logging.getLogger("noterx.agent")

MODEL_FAST = os.getenv("LLM_MODEL_FAST", "mimo-v2-flash")
MODEL_PRO = os.getenv("LLM_MODEL_PRO", "mimo-v2-pro")
MODEL_OMNI = os.getenv("LLM_MODEL_OMNI", "mimo-v2-omni")


def _get_client():
    """获取 OpenAI 兼容 API 客户端（绕过本地代理）"""
    import httpx
    from openai import AsyncOpenAI
    http_client = httpx.AsyncClient(
        proxy=None,
        trust_env=False,
        timeout=httpx.Timeout(120.0, connect=30.0),
    )
    return AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY", ""),
        base_url=os.getenv("OPENAI_BASE_URL", None),
        http_client=http_client,
    )


class BaseAgent:
    """所有诊断 Agent 的基类"""

    agent_name: str = "BaseAgent"
    system_prompt: str = ""

    def __init__(self, model: Optional[str] = None):
        self.model = model or MODEL_PRO
        self.client = _get_client()

    async def call_llm(
        self,
        user_message: str,
        system_override: Optional[str] = None,
        model_override: Optional[str] = None,
        max_tokens: int = 4000,
    ) -> dict:
        sys_prompt = system_override or self.system_prompt
        model = model_override or self.model

        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.7,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content
            result = json.loads(raw)
            usage = response.usage
            if usage:
                result["_meta"] = {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens,
                    "model": response.model,
                }
            return result
        except json.JSONDecodeError:
            return self._error_response("LLM 返回了非 JSON 格式的内容")
        except Exception as e:
            logger.warning("LLM 调用失败 [%s]: %s", model, e)
            return self._error_response(str(e))

    async def call_llm_vision(
        self,
        text_message: str,
        image_b64: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2000,
    ) -> dict:
        """调用多模态模型分析图像"""
        sys_prompt = system_prompt or self.system_prompt
        try:
            response = await self.client.chat.completions.create(
                model=MODEL_OMNI,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": text_message},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
                        ],
                    },
                ],
                max_tokens=max_tokens,
            )
            raw = response.choices[0].message.content
            clean = raw.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
            result = json.loads(clean)
            usage = response.usage
            if usage:
                result["_meta"] = {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens,
                    "model": response.model,
                }
            return result
        except json.JSONDecodeError:
            return self._error_response("多模态模型返回了非 JSON 格式的内容")
        except Exception as e:
            logger.warning("多模态调用失败: %s", e)
            return self._error_response(str(e))

    def _error_response(self, error_msg: str) -> dict:
        return {
            "agent_name": self.agent_name,
            "dimension": "error",
            "score": 0,
            "issues": [f"诊断出错: {error_msg}"],
            "suggestions": ["请稍后重试"],
            "reasoning": f"Error: {error_msg}",
        }

    def build_user_message(self, **kwargs) -> str:
        raise NotImplementedError
