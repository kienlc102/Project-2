import axios from 'axios';

// --- Provider configs ---
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Thử theo thứ tự: model tốt nhất trước, rồi xuống dần các model nhanh hơn
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',   // best quality, free tier
  'llama-3.1-70b-versatile',   // fallback 70b
  'llama3-70b-8192',           // older 70b, very stable
  'llama-3.1-8b-instant',      // fast, good for simple tasks
  'llama3-8b-8192',            // older 8b, stable
  'mixtral-8x7b-32768',        // Mixtral via Groq, good quality
  'gemma2-9b-it',              // Google Gemma via Groq, last resort
];

const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

function buildPrompt(fileName: string, truncatedText: string): string {
  return `Bạn là trợ lý giáo dục. Dựa trên nội dung tài liệu dưới đây, hãy tạo:

1. Một bộ FLASHCARD gồm 2 thẻ (mỗi thẻ có "term" và "definition") tóm tắt 2 khái niệm quan trọng nhất.
2. Một bài QUIZ gồm 2 câu hỏi trắc nghiệm, mỗi câu có 2 lựa chọn và chỉ ra đáp án đúng.

Tên tài liệu: ${fileName}

Nội dung:
---
${truncatedText}
---

Trả về JSON THUẦN (không markdown, không \`\`\`json\`\`\`) theo format:
{
  "flashcard_title": "Tóm tắt: <tên ngắn>",
  "flashcard_description": "<mô tả ngắn>",
  "flashcards": [
    {"term": "...", "definition": "..."},
    {"term": "...", "definition": "..."}
  ],
  "quiz_title": "Quiz: <tên ngắn>",
  "quiz_description": "<mô tả ngắn>",
  "questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ..."],
      "correct_index": 0
    },
    {
      "question": "...",
      "options": ["A. ...", "B. ..."],
      "correct_index": 1
    }
  ]
}`;
}

function parseJson(text: string): Record<string, unknown> | null {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.split('\n').slice(1).join('\n');
  }
  if (clean.endsWith('```')) {
    clean = clean.slice(0, -3);
  }
  clean = clean.trim();
  try {
    return JSON.parse(clean) as Record<string, unknown>;
  } catch (e) {
    console.error('[AI Generator] Lỗi parse JSON:', e);
    return null;
  }
}

async function tryGroq(prompt: string): Promise<Record<string, unknown> | null> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.warn('[AI Generator] GROQ_API_KEY chưa được set — bỏ qua Groq.');
    return null;
  }

  for (const modelName of GROQ_MODELS) {
    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );
      if (response.status === 200) {
        const textContent = response.data.choices[0].message.content as string;
        console.log(`[AI Generator] Groq thành công với model: ${modelName}`);
        return parseJson(textContent);
      }
    } catch (e: unknown) {
      const status = axios.isAxiosError(e) ? e.response?.status : 'unknown';
      console.error(`[AI Generator] Groq ${modelName} lỗi ${status}`);
    }
  }
  return null;
}

async function tryGemini(prompt: string): Promise<Record<string, unknown> | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.warn('[AI Generator] GEMINI_API_KEY chưa được set — bỏ qua Gemini.');
    return null;
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };

  for (const modelName of GEMINI_MODELS) {
    try {
      const url = `${GEMINI_API_BASE}/${modelName}:generateContent?key=${geminiKey}`;
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      });
      if (response.status === 200) {
        const textContent = response.data.candidates[0].content.parts[0].text as string;
        console.log(`[AI Generator] Gemini thành công với model: ${modelName}`);
        return parseJson(textContent);
      }
    } catch (e: unknown) {
      const status = axios.isAxiosError(e) ? e.response?.status : 'unknown';
      console.error(`[AI Generator] Gemini ${modelName} lỗi ${status}`);
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tạo flashcard + quiz từ nội dung tài liệu.
 * Ưu tiên Groq (Meta Llama) → fallback Gemini. Retry tối đa MAX_RETRIES lần.
 */
export async function generateFlashcardsAndQuiz(
  documentText: string,
  fileName: string
): Promise<Record<string, unknown> | null> {
  const truncatedText =
    documentText.length > 3000 ? documentText.slice(0, 3000) : documentText;
  const prompt = buildPrompt(fileName, truncatedText);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // 1) Thử Groq trước (nhanh, ít rate limit)
    const groqResult = await tryGroq(prompt);
    if (groqResult) return groqResult;

    // 2) Fallback sang Gemini
    const geminiResult = await tryGemini(prompt);
    if (geminiResult) return geminiResult;

    if (attempt < MAX_RETRIES - 1) {
      console.log(
        `[AI Generator] Retry lần ${attempt + 2}/${MAX_RETRIES} sau ${RETRY_DELAY_MS / 1000}s...`
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  console.error(`[AI Generator] Tất cả providers đều thất bại sau ${MAX_RETRIES} lần thử.`);
  return null;
}
