import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

const MODEL = "gpt-4o-mini";

export const CATEGORIES = [
  "IT/개발",
  "재테크/투자",
  "자기계발",
  "건강/운동",
  "요리/음식",
  "여행",
  "엔터테인먼트",
  "교육/학습",
  "뉴스/시사",
  "디자인/예술",
  "비즈니스",
  "기타",
];

export interface SummarizeResult {
  summary: string;
  category: string;
  tags: string[];
  questions: string[];
  keywords: string[];
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
  });
  return response.choices[0]?.message?.content?.trim() || "";
}

async function callOpenAIJSON(prompt: string): Promise<SummarizeResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { summary: "OPENAI_API_KEY가 설정되지 않았습니다.", category: "기타", tags: [], questions: [], keywords: [] };
  }

  const text = await callOpenAI(prompt);
  if (!text) throw new Error("OpenAI가 빈 응답을 반환했습니다.");

  const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(jsonStr);

  return {
    summary: parsed.summary || "요약을 생성할 수 없습니다.",
    category: CATEGORIES.includes(parsed.category) ? parsed.category : "기타",
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
  };
}

export async function summarizeContent(title: string, content: string, url: string): Promise<SummarizeResult> {
  const prompt = `정보 분석 전문가로서 아래 웹 페이지를 분석하세요. 제공된 정보에 없는 내용은 추측 금지.

URL: ${url}
제목: ${title}
내용: ${content.slice(0, 2000)}

JSON으로만 응답:
{"summary":"3줄 요약","category":"${CATEGORIES.join("|")} 중 하나","tags":["태그1","태그2","태그3"],"questions":["질문1","질문2","질문3"],"keywords":["키워드1","키워드2","키워드3"]}`;

  try {
    return await callOpenAIJSON(prompt);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("OpenAI summarize error:", msg);
    return { summary: `AI 요약 오류: ${msg.slice(0, 100)}`, category: "기타", tags: [], questions: [], keywords: [] };
  }
}

export async function summarizeYouTubeVideo(title: string, description: string, captions?: string): Promise<SummarizeResult> {
  const parts = [`제목: ${title}`, `설명: ${description}`];
  if (captions) parts.push(`자막: ${captions.slice(0, 2000)}`);

  const prompt = `YouTube 영상 분석 전문가로서 아래 영상을 분석하세요. 제공된 정보에 없는 내용은 추측 금지.

${parts.join("\n")}

JSON으로만 응답:
{"summary":"3줄 요약","category":"${CATEGORIES.join("|")} 중 하나","tags":["태그1","태그2","태그3"],"questions":["질문1","질문2","질문3"],"keywords":["키워드1","키워드2","키워드3"]}`;

  try {
    return await callOpenAIJSON(prompt);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("OpenAI YouTube error:", msg);
    return { summary: `AI 요약 오류: ${msg.slice(0, 100)}`, category: "기타", tags: [], questions: [], keywords: [] };
  }
}

export async function generateIntegratedReport(bookmarks: { title: string; summary: string; tags: string; url: string }[]): Promise<string> {
  const info = bookmarks.map((b, i) => `[${i + 1}] ${b.title}: ${b.summary}`).join("\n");
  const prompt = `아래 자료를 3줄로 종합 분석. 서론 없이 본론만.\n${info}\n\n형식: 공통주제(1줄), 핵심(1줄), 인사이트(1줄)`;
  try {
    return await callOpenAI(prompt);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return `보고서 생성 오류: ${msg.slice(0, 100)}`;
  }
}

export async function generateNewsletterContent(bookmarks: { title: string; summary: string; category: string; tags: string; url: string }[]): Promise<string> {
  const info = bookmarks.map((b, i) => `[${i + 1}] ${b.category}|${b.title}: ${b.summary}`).join("\n");
  const prompt = `이번 주 학습 현황을 3줄 정리. 서론 없이 본론만.\n${info}\n\n형식: 관심분야(1줄), 핵심학습(1줄), 추천(1줄)`;
  try {
    return await callOpenAI(prompt);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return `뉴스레터 생성 오류: ${msg.slice(0, 100)}`;
  }
}
