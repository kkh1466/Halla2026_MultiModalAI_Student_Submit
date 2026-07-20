import { NextRequest, NextResponse } from 'next/server';
import { analyzeContract } from '@/services/orchestrator';
import { AnalyzeResponse } from '@/services/types';

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 업로드되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: '지원하지 않는 파일 형식입니다. JPG, PNG, WebP, PDF만 업로드 가능합니다.',
        },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 10MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 분석 실행
    const result = await analyzeContract(buffer, file.name);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '분석 중 오류가 발생했습니다. 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
