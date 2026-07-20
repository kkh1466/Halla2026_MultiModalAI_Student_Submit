import { IOcrService } from './ocr/ocr.interface';
import { MockOcrService } from './ocr/ocr.mock';
import { IDebtService } from './debt/debt.interface';
import { MockDebtService } from './debt/debt.mock';
import { IPriceService } from './price/price.interface';
import { MockPriceService } from './price/price.mock';
import { IContractService } from './contract/contract.interface';
import { MockContractService } from './contract/contract.mock';
import { IHugService } from './hug/hug.interface';
import { MockHugService } from './hug/hug.mock';
import { IJudgmentService } from './judgment/judgment.interface';
import { MockJudgmentService } from './judgment/judgment.mock';

/**
 * 서비스 팩토리
 * USE_MOCK 환경변수에 따라 Mock 또는 Real 서비스를 생성
 *
 * 추후 실제 API 연동 시:
 * 1. 해당 서비스의 real 구현 파일을 작성 (예: ocr.textract.ts)
 * 2. 아래 팩토리에서 USE_MOCK=false일 때 real 구현을 반환하도록 수정
 * 3. .env.local에서 USE_MOCK=false로 변경
 */

const useMock = process.env.USE_MOCK !== 'false';

export function createOcrService(): IOcrService {
  if (useMock) return new MockOcrService();
  // TODO: return new TextractOcrService();
  return new MockOcrService();
}

export function createDebtService(): IDebtService {
  if (useMock) return new MockDebtService();
  // TODO: return new RegistryDebtService();
  return new MockDebtService();
}

export function createPriceService(): IPriceService {
  if (useMock) return new MockPriceService();
  // TODO: return new RealPriceService();
  return new MockPriceService();
}

export function createContractService(): IContractService {
  if (useMock) return new MockContractService();
  // TODO: return new StandardContractService();
  return new MockContractService();
}

export function createHugService(): IHugService {
  if (useMock) return new MockHugService();
  // TODO: return new RulesHugService();
  return new MockHugService();
}

export function createJudgmentService(): IJudgmentService {
  if (useMock) return new MockJudgmentService();
  // TODO: return new LlmJudgmentService();
  return new MockJudgmentService();
}
