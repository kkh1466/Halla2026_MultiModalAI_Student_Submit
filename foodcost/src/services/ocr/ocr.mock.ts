import { OcrResult } from '../types';
import { IOcrService } from './ocr.interface';

/**
 * Mock OCR 서비스
 * 실제 OCR 없이 테스트용 데이터를 반환
 */
export class MockOcrService implements IOcrService {
  async extractText(_imageBuffer: Buffer, _fileName: string): Promise<OcrResult> {
    // 시뮬레이션 딜레이
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      address: '서울특별시 강남구 역삼동 123-45 역삼아파트 101동 1502호',
      deposit: 300_000_000, // 3억원
      monthlyRent: undefined,
      landlord: '김철수',
      tenant: '이영희',
      contractDate: '2024-03-15',
      leaseStartDate: '2024-04-01',
      leaseEndDate: '2026-03-31',
      propertyType: 'APARTMENT',
      contractText: `부동산 임대차계약서

임대인(이하 "갑"이라 한다): 김철수
임차인(이하 "을"이라 한다): 이영희

제1조 (목적물의 표시)
소재지: 서울특별시 강남구 역삼동 123-45 역삼아파트 101동 1502호
면적: 84.5㎡ (전용면적)

제2조 (보증금 및 차임)
보증금: 금 삼억원정 (\\300,000,000)
월차임: 없음 (전세)

제3조 (임대차기간)
2024년 4월 1일부터 2026년 3월 31일까지 (2년)

제4조 (임대인의 의무)
임대인은 임대차기간 중 목적물을 임차인이 사용, 수익할 수 있는 상태로 유지하여야 한다.

제5조 (임차인의 의무)
임차인은 선량한 관리자의 주의로 목적물을 사용하여야 한다.

제6조 (계약의 해지)
당사자 일방이 본 계약을 위반한 경우, 상대방은 계약을 해지할 수 있다.

특약사항:
1. 임차인은 계약 기간 중 전대할 수 없다.
2. 원상복구 의무는 임차인에게 있다.
3. 계약 만료 1개월 전까지 갱신 의사를 통보하지 않으면 계약은 자동 종료된다.`,
      specialTerms: [
        '임차인은 계약 기간 중 전대할 수 없다.',
        '원상복구 의무는 임차인에게 있다.',
        '계약 만료 1개월 전까지 갱신 의사를 통보하지 않으면 계약은 자동 종료된다.',
      ],
    };
  }
}
