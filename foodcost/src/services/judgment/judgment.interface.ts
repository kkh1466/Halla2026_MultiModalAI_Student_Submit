import {
  OcrResult,
  DebtResult,
  PriceResult,
  ContractResult,
  HugResult,
  JudgmentResult,
} from '../types';

/**
 * 판단 AI 인터페이스 - 입력 데이터
 */
export interface JudgmentInput {
  ocr: OcrResult;
  debt: DebtResult;
  price: PriceResult;
  contract: ContractResult;
  hug: HugResult;
}

/**
 * 판단 AI 서비스 인터페이스
 * 모든 분석 결과를 종합하여 최종 위험도를 판단
 */
export interface IJudgmentService {
  /**
   * 종합 위험도 판단
   * @param input - 각 서비스의 분석 결과
   * @returns 최종 판단 결과
   */
  analyze(input: JudgmentInput): Promise<JudgmentResult>;
}
