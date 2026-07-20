import { PriceResult } from '../types';

/**
 * 시세 체크 서비스 인터페이스
 * 매물의 시세를 주변 시세와 비교하여 적정성 판단
 */
export interface IPriceService {
  /**
   * 주소 기반 시세 조회
   * @param address - 부동산 주소
   * @returns 시세 비교 결과
   */
  checkPrice(address: string): Promise<PriceResult>;
}
