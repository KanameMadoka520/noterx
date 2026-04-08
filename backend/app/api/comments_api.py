"""
模拟评论生成 API
使用 flash 模型快速生成更多评论、回复和争论。
"""
import json
import logging
from pydantic import BaseModel
from fastapi import APIRouter

from app.agents.base_agent import BaseAgent, MODEL_FAST

router = APIRouter()
logger = logging.getLogger("noterx.comments")

COMMENT_PROMPT = """你是小红书评论区模拟器。根据给定的笔记信息，生成**极其真实**的小红书评论。

必须遵守的规则：
1. 评论必须像真人写的，禁止AI味。参考真实高赞评论的风格：
   - "绝了" "收藏了" "做了！真的好吃！" "求链接🔗" "有滤镜吧"
   - "笑死" "绷不住了" "姐妹身高体重多少" "人均花费多少？"
2. 50%的评论要很短（5-15字），30%中等（15-40字），20%较长（40-80字）
3. 必须有1-2条质疑或吐槽（"广告吧" "真的假的" "没觉得好看"）
4. 部分评论要有回复链（模拟抬杠/讨论）
5. 用口语，不要书面语。可以有错别字、表情包标记（如[笑哭R]）
6. 昵称要像真实小红书用户（"小王同学" "是橘子呀" "暴躁小张"），不要"用户A"

输出严格JSON格式：
{
  "comments": [
    {
      "username": "昵称",
      "avatar_emoji": "一个表情",
      "comment": "评论内容",
      "sentiment": "positive/negative/neutral",
      "likes": 预估点赞数(整数,热评50-500,普通0-50),
      "replies": [
        {
          "username": "回复者昵称",
          "avatar_emoji": "表情",
          "comment": "回复内容",
          "sentiment": "positive/negative/neutral",
          "likes": 预估点赞数(整数)
        }
      ]
    }
  ]
}

注意：生成5-6条主评论，其中2-3条要有1-3个回复。"""


class GenerateCommentsRequest(BaseModel):
    title: str
    content: str = ""
    category: str = "food"
    existing_count: int = 0


@router.post("/generate-comments")
async def generate_comments(req: GenerateCommentsRequest):
    """用 flash 模型快速生成更多模拟评论"""
    category_names = {"food": "美食", "fashion": "穿搭", "tech": "科技",
                      "travel": "旅行", "beauty": "美妆", "fitness": "健身"}
    cat_cn = category_names.get(req.category, req.category)

    user_msg = f"""笔记信息：
- 垂类：{cat_cn}
- 标题：{req.title}
- 正文：{req.content[:300] if req.content else '（无正文）'}

已有 {req.existing_count} 条评论，请生成新的、不重复的评论。
如果已有评论较多，可以生成一些更有争议性的评论和激烈的回复。"""

    agent = BaseAgent(model=MODEL_FAST)
    agent.system_prompt = COMMENT_PROMPT
    result = await agent.call_llm(user_msg, max_tokens=2000)

    result.pop("_meta", None)
    comments = result.get("comments", [])

    formatted = []
    for c in comments:
        if not isinstance(c, dict):
            continue
        replies = []
        for r in c.get("replies", []):
            if isinstance(r, dict):
                replies.append({
                    "username": r.get("username", "小红薯用户"),
                    "avatar_emoji": r.get("avatar_emoji", "😊"),
                    "comment": r.get("comment", ""),
                    "sentiment": r.get("sentiment", "neutral"),
                    "likes": int(r.get("likes", 0)) if r.get("likes") is not None else 0,
                })
        formatted.append({
            "username": c.get("username", "小红薯用户"),
            "avatar_emoji": c.get("avatar_emoji", "😊"),
            "comment": c.get("comment", ""),
            "sentiment": c.get("sentiment", "neutral"),
            "likes": int(c.get("likes", 0)) if c.get("likes") is not None else 0,
            "replies": replies,
        })

    return {"comments": formatted}
