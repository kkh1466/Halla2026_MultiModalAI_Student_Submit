import { HugResult } from '../types';

/**
 * HUG(주택도시보증공사) 서비스 인터페이스
 * 전세보증금 반환보증 가입 가능 여부 확인
 */
export interface IHugService {
  /**
   * HUG 가입 가능 여부 확인
   * @param address - 부동산 주소
   * @param deposit - 보증금
   * @param estimatedValue - 매물 추정 시세
   * @returns HUG 가입 가능 여부
   */
  checkEligibility(
    address: string,
    deposit: number,
    estimatedValue: number
  ): Promise<HugResult>;
}
