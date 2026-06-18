"""AI Chat assistant endpoints."""

import asyncio
import logging
import uuid

from fastapi import APIRouter, HTTPException

from app.llm import complete
from app.schemas.ai_chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])

SYSTEM_PROMPT = """你是一位专业的职业顾问和简历专家。你可以帮助用户：
- 优化和定制简历
- 分析职位描述（JD）
- 准备面试
- 规划职业发展路径
- 提供技能提升建议

请用简洁、实用、具体的语言回答。讨论简历时，专注于可操作的改进建议。
默认使用中文回复，如果用户使用其他语言则跟随用户的语言。"""


@router.post("/message")
async def chat_message(request: ChatRequest) -> ChatResponse:
    """Send a message to the AI career assistant and get a reply."""
    conversation_id = request.conversation_id or str(uuid.uuid4())

    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        reply = await asyncio.wait_for(
            complete(
                prompt=request.message,
                system_prompt=SYSTEM_PROMPT,
                max_tokens=2048,
                temperature=0.7,
            ),
            timeout=120.0,
        )
    except asyncio.TimeoutError:
        logger.error("AI chat timed out")
        raise HTTPException(
            status_code=504,
            detail="Request timed out. Please try again.",
        )
    except ValueError as e:
        logger.error("AI chat content error: %s", e)
        raise HTTPException(
            status_code=422,
            detail="The AI returned an unreadable response. Please try again.",
        )
    except Exception as e:
        logger.error("AI chat failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Chat request failed. Please check your API configuration and try again.",
        )

    return ChatResponse(conversation_id=conversation_id, reply=reply)
