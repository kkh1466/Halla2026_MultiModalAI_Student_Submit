import { JudgmentResult } from './types';
import {
  createOcrService,
  createDebtService,
  createPriceService,
  createContractService,
  createHugService,
  createJudgmentService,
} from './factory';

/**
 * 분석 오케스트레이터
 * 전체 분석 파이프라인을 조율하는 핵심 모듈
 *
 * 흐름:
 * 1. OCR로 계약서 텍스트 추출
 * 2. 병렬로 빚 체크 + 시세 체크 + 독소조항 체크
 * 3. HUG 가입 가능 여부 확인
 * 4. 판단 AI가 종합 분석
 */
export async function analyzeContract(
  fileBuffer: Buffer,
  fileName: string
): Promise<JudgmentResult> {
  const ocrService = createOcrService();
  const debtService = createDebtService();
  const priceService = createPriceService();
  const contractService = createContractService();
  const hugService = createHugService();
  const judgmentService = createJudgmentService();

  // Step 1: OCR 처리
  const ocrResult = await ocrService.extractText(fileBuffer, fileName);

  // Step 2: 병렬 실행 - 빚 체크, 시세 체크, 독소조항 체크
  const [debtResult, priceResult, contractResult] = await Promise.all([
    debtService.checkDebt(ocrResult.address),
    priceService.checkPrice(ocrResult.address),
    contractService.checkClauses(ocrResult.contractText, ocrResult.specialTerms),
  ]);

  // Step 3: HUG 가입 가능 여부 (시세 결과 필요)
  const hugResult = await hugService.checkEligibility(
    ocrResult.address,
    ocrResult.deposit,
    priceResult.estimatedValue
  );

  // Step 4: 판단 AI 종합 분석
  const judgment = await judgmentService.analyze({
    ocr: ocrResult,
    debt: debtResult,
    price: priceResult,
    contract: contractResult,
    hug: hugResult,
  });

  return judgment;
}
