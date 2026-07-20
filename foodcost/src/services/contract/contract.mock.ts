import { ContractResult } from '../types';
import { IContractService } from './contract.interface';

/**
 * Mock 독소조항 체크 서비스
 * 테스트용 계약서 분석 결과를 반환
 */
export class MockContractService implements IContractService {
  async checkClauses(_contractText: string, _specialTerms: string[]): Promise<ContractResult> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    return {
      isStandard: false,
      totalClauses: 14,
      nonStandardCount: 1,
      toxicClauses: [
        {
          clause: '계약 만료 1개월 전까지 갱신 의사를 통보하지 않으면 계약은 자동 종료된다.',
          reason:
            '주택임대차보호법상 임대인이 계약 만료 6개월~2개월 전에 갱신 거절을 통보해야 합니다. 1개월 전 자동종료 조항은 임차인의 계약갱신청구권을 제한할 수 있습니다.',
          favoredParty: 'LANDLORD',
          severity: 'MEDIUM',
        },
      ],
    };
  }
}
