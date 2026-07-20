import { PriceResult } from '../types';
import { IPriceService } from './price.interface';

/**
 * Mock 시세 체크 서비스
 * 테스트용 시세 데이터를 반환
 */
export class MockPriceService implements IPriceService {
  async checkPrice(_address: string): Promise<PriceResult> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      estimatedValue: 450_000_000, // 4.5억원 (매물 추정 시세)
      averageAreaPrice: 420_000_000, // 4.2억원 (주변 평균)
      priceStatus: 'ADEQUATE',
      confidence: 0.85,
      comparisonCount: 12,
    };
  }
}
