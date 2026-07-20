import { HugResult } from '../types';
import { IHugService } from './hug.interface';

/**
 * Mock HUG 서비스
 * 테스트용 HUG 가입 가능 여부를 반환
 */
export class MockHugService implements IHugService {
  async checkEligibility(
    _address: string,
    _deposit: number,
    _estimatedValue: number
  ): Promise<HugResult> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      eligible: true,
      reason: '보증금이 시세의 90% 이하이며, HUG 보증 한도 이내입니다.',
      conditions: [
        { name: '보증금 한도', met: true, description: '보증금 3억원 ≤ 수도권 한도 7억원' },
        { name: '전세가율', met: true, description: '전세가율 66.7% ≤ 상한 90%' },
        { name: '임대차계약 기간', met: true, description: '계약기간 24개월 ≥ 최소 1개월' },
        { name: '주택 유형', met: true, description: '아파트 - 가입 가능 유형' },
      ],
    };
  }
}
