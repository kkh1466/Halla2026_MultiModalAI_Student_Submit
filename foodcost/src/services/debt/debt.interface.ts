import { DebtResult } from '../types';

/**
 * 빚 체크 서비스 인터페이스
 * 매물의 선순위 채권(근저당권) 정보를 조회
 */
export interface IDebtService {
  /**
   * 주소 기반 채무 정보 조회
   * @param address - 부동산 주소
   * @returns 채무 조회 결과
   */
  checkDebt(address: string): Promise<DebtResult>;
}
