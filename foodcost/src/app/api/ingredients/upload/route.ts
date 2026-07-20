import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { analyzeReceiptImage, analyzeCsvText } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST: 파일 업로드 후 AI 분석
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "파일을 선택해주세요." },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "파일 크기는 10MB 이하만 가능합니다." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const mimeType = file.type;

    // CSV 파일 처리
    if (fileName.endsWith(".csv") || mimeType === "text/csv") {
      const text = await file.text();
      if (!text.trim()) {
        return NextResponse.json(
          { success: false, error: "빈 CSV 파일입니다." },
          { status: 400 }
        );
      }
      const ingredients = await analyzeCsvText(text);
      return NextResponse.json({ success: true, data: ingredients });
    }

    // 이미지 파일 처리
    const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (imageTypes.includes(mimeType) || /\.(jpg|jpeg|png|webp|gif)$/.test(fileName)) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const detectedMime = mimeType || "image/jpeg";

      const ingredients = await analyzeReceiptImage(base64, detectedMime);
      return NextResponse.json({ success: true, data: ingredients });
    }

    return NextResponse.json(
      {
        success: false,
        error: "지원하지 않는 파일 형식입니다. CSV 또는 이미지(JPG, PNG, WebP) 파일을 업로드해주세요.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Upload analysis error:", error);

    const message =
      error instanceof Error && error.message.includes("API key")
        ? "OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요."
        : "파일 분석 중 오류가 발생했습니다. 다시 시도해주세요.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
