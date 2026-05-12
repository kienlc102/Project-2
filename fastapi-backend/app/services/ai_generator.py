import json
import asyncio
import httpx
from app.core.config import settings

# --- Provider configs ---
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]

GEMINI_MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

MAX_RETRIES = 2
RETRY_DELAY_SECONDS = 5


def _build_prompt(file_name: str, truncated_text: str) -> str:
    return f"""Bạn là trợ lý giáo dục. Dựa trên nội dung tài liệu dưới đây, hãy tạo:

1. Một bộ FLASHCARD gồm 2 thẻ (mỗi thẻ có "term" và "definition") tóm tắt 2 khái niệm quan trọng nhất.
2. Một bài QUIZ gồm 2 câu hỏi trắc nghiệm, mỗi câu có 2 lựa chọn và chỉ ra đáp án đúng.

Tên tài liệu: {file_name}

Nội dung:
---
{truncated_text}
---

Trả về JSON THUẦN (không markdown, không ```json```) theo format:
{{
  "flashcard_title": "Tóm tắt: <tên ngắn>",
  "flashcard_description": "<mô tả ngắn>",
  "flashcards": [
    {{"term": "...", "definition": "..."}},
    {{"term": "...", "definition": "..."}}
  ],
  "quiz_title": "Quiz: <tên ngắn>",
  "quiz_description": "<mô tả ngắn>",
  "questions": [
    {{
      "question": "...",
      "options": ["A. ...", "B. ..."],
      "correct_index": 0
    }},
    {{
      "question": "...",
      "options": ["A. ...", "B. ..."],
      "correct_index": 1
    }}
  ]
}}"""


async def _try_groq(prompt: str) -> dict | None:
    """Gọi Groq API (Meta Llama). Miễn phí, nhanh, ít bị rate limit."""
    if not settings.GROQ_API_KEY:
        return None

    async with httpx.AsyncClient(timeout=60.0) as client:
        for model_name in GROQ_MODELS:
            try:
                response = await client.post(
                    GROQ_API_URL,
                    json={
                        "model": model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 1024,
                    },
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    text_content = data["choices"][0]["message"]["content"]
                    print(f"[AI Generator] Groq thành công với model: {model_name}")
                    return _parse_json(text_content)
                else:
                    print(f"[AI Generator] Groq {model_name} lỗi {response.status_code}")
            except Exception as e:
                print(f"[AI Generator] Groq {model_name} exception: {e}")
    return None


async def _try_gemini(prompt: str) -> dict | None:
    """Gọi Google Gemini API. Fallback khi Groq không khả dụng."""
    if not settings.GEMINI_API_KEY:
        return None

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024,
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        for model_name in GEMINI_MODELS:
            try:
                url = f"{GEMINI_API_BASE}/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
                response = await client.post(
                    url, json=payload, headers={"Content-Type": "application/json"}
                )
                if response.status_code == 200:
                    data = response.json()
                    text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                    print(f"[AI Generator] Gemini thành công với model: {model_name}")
                    return _parse_json(text_content)
                else:
                    print(f"[AI Generator] Gemini {model_name} lỗi {response.status_code}")
            except Exception as e:
                print(f"[AI Generator] Gemini {model_name} exception: {e}")
    return None


def _parse_json(text: str) -> dict | None:
    clean = text.strip()
    if clean.startswith("```"):
        clean = clean.split("\n", 1)[1]
    if clean.endswith("```"):
        clean = clean[:-3]
    clean = clean.strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError as e:
        print(f"[AI Generator] Lỗi parse JSON: {e}")
        return None


async def generate_flashcards_and_quiz(document_text: str, file_name: str) -> dict | None:
    """
    Tạo flashcard + quiz từ nội dung tài liệu.
    Ưu tiên Groq (Meta Llama) → fallback Gemini. Retry tối đa MAX_RETRIES lần.
    """
    truncated_text = document_text[:3000] if len(document_text) > 3000 else document_text
    prompt = _build_prompt(file_name, truncated_text)

    for attempt in range(MAX_RETRIES):
        # 1) Thử Groq trước (nhanh, ít rate limit)
        result = await _try_groq(prompt)
        if result:
            return result

        # 2) Fallback sang Gemini
        result = await _try_gemini(prompt)
        if result:
            return result

        if attempt < MAX_RETRIES - 1:
            print(f"[AI Generator] Retry lần {attempt + 2}/{MAX_RETRIES} sau {RETRY_DELAY_SECONDS}s...")
            await asyncio.sleep(RETRY_DELAY_SECONDS)

    print(f"[AI Generator] Tất cả providers đều thất bại sau {MAX_RETRIES} lần thử.")
    return None
