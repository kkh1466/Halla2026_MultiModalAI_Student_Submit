// ============================================
// 지역코드 데이터 (법원 등기정보광장 기준)
// ============================================

export interface RegionCode {
  name: string;
  code: string;
}

/** 시도 코드 */
export const SIDO_CODES: RegionCode[] = [
  { name: '강원특별자치도', code: '100' },
  { name: '경기도', code: '200' },
  { name: '경상남도', code: '300' },
  { name: '경상북도', code: '400' },
  { name: '대구광역시', code: '600' },
  { name: '대전광역시', code: '700' },
  { name: '부산광역시', code: '800' },
  { name: '서울특별시', code: '900' },
  { name: '울산광역시', code: '1000' },
  { name: '인천광역시', code: '1100' },
  { name: '전남광주통합특별시', code: '1200' },
  { name: '전북특별자치도', code: '1300' },
  { name: '제주특별자치도', code: '1400' },
  { name: '충청남도', code: '1500' },
  { name: '충청북도', code: '1600' },
  { name: '세종특별자치시', code: '1700' },
];

/** 시군구 코드 (주요 지역) */
export const SIGUNGU_CODES: Record<string, RegionCode[]> = {
  '900': [ // 서울특별시
    { name: '강남구', code: '901' },
    { name: '강동구', code: '902' },
    { name: '강북구', code: '903' },
    { name: '강서구', code: '904' },
    { name: '관악구', code: '905' },
    { name: '광진구', code: '906' },
    { name: '구로구', code: '907' },
    { name: '금천구', code: '908' },
    { name: '노원구', code: '909' },
    { name: '도봉구', code: '910' },
    { name: '동대문구', code: '911' },
    { name: '동작구', code: '912' },
    { name: '마포구', code: '913' },
    { name: '서대문구', code: '914' },
    { name: '서초구', code: '915' },
    { name: '성동구', code: '916' },
    { name: '성북구', code: '917' },
    { name: '송파구', code: '918' },
    { name: '양천구', code: '919' },
    { name: '영등포구', code: '920' },
    { name: '용산구', code: '921' },
    { name: '은평구', code: '922' },
    { name: '종로구', code: '923' },
    { name: '중구', code: '924' },
    { name: '중랑구', code: '925' },
  ],
  '200': [ // 경기도
    { name: '수원시', code: '201' },
    { name: '성남시', code: '202' },
    { name: '고양시', code: '203' },
    { name: '용인시', code: '204' },
    { name: '부천시', code: '205' },
    { name: '안산시', code: '206' },
    { name: '안양시', code: '207' },
    { name: '남양주시', code: '208' },
    { name: '화성시', code: '209' },
    { name: '평택시', code: '210' },
  ],
  '1100': [ // 인천광역시
    { name: '중구', code: '1101' },
    { name: '동구', code: '1102' },
    { name: '미추홀구', code: '1103' },
    { name: '연수구', code: '1104' },
    { name: '남동구', code: '1105' },
    { name: '부평구', code: '1106' },
    { name: '계양구', code: '1107' },
    { name: '서구', code: '1108' },
  ],
};

/**
 * 주소에서 시도코드를 추출
 */
export function findSidoCode(address: string): string | null {
  for (const sido of SIDO_CODES) {
    if (address.includes(sido.name) || address.includes(sido.name.replace('특별시', '').replace('광역시', '').replace('특별자치도', '').replace('특별자치시', ''))) {
      return sido.code;
    }
  }
  // 축약형 매칭
  if (address.includes('서울')) return '900';
  if (address.includes('경기')) return '200';
  if (address.includes('인천')) return '1100';
  if (address.includes('부산')) return '800';
  if (address.includes('대구')) return '600';
  if (address.includes('대전')) return '700';
  if (address.includes('울산')) return '1000';
  if (address.includes('세종')) return '1700';
  if (address.includes('강원')) return '100';
  if (address.includes('제주')) return '1400';
  return null;
}

/**
 * 주소에서 시군구코드를 추출
 */
export function findSigunguCode(address: string, sidoCode: string): string | null {
  const sigungus = SIGUNGU_CODES[sidoCode];
  if (!sigungus) return null;
  for (const sigungu of sigungus) {
    if (address.includes(sigungu.name)) {
      return sigungu.code;
    }
  }
  return null;
}
