import { OcrResult } from '../types';

/**
 * OCR 서비스 인터페이스
 * 계약서 이미지를 텍스트로 변환
 */
export interface IOcrService {
  /**
   * 이미지에서 계약서 텍스트를 추출
   * @param imageBuffer - 이미지 파일 버퍼
   * @param fileName - 파일명
   * @returns OCR 추출 결과
   */
  extractText(imageBuffer: Buffer, fileName: string): Promise<OcrResult>;
}
