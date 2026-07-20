import { ContractResult } from '../types';

/**
 * 독소조항 체크 서비스 인터페이스
 * 계약서를 표준계약서와 비교하여 독소조항을 탐지
 */
export interface IContractService {
  /**
   * 계약서 조항 분석
   * @param contractText - 전체 계약서 텍스트
   * @param specialTerms - 특약사항 목록
   * @returns 독소조항 분석 결과
   */
  checkClauses(contractText: string, specialTerms: string[]): Promise<ContractResult>;
}
