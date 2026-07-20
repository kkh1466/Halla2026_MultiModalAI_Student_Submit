import { DebtResult } from '../types';
import { IDebtService } from './debt.interface';

/**
 * Mock 빚 체크 서비스
 * 테스트용 근저당권 데이터를 반환
 */
export class MockDebtService implements IDebtService {
  async checkDebt(_address: string): Promise<DebtResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      hasDebt: true,
      totalDebt: 180_000_000, // 1.8억원
      mortgageCount: 1,
      details: [
        {
          creditor: '국민은행',
          amount: 180_000_000,
          registrationDate: '2022-05-20',
          priority: 1,
        },
      ],
    };
  }
}
