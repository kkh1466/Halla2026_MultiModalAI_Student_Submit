// ============================================
// 상수 정의
// ============================================

/** 위험도 등급별 라벨 */
export const RISK_LABELS: Record<string, string> = {
  SAFE: '안전',
  CAUTION: '주의',
  DANGER: '위험',
  CRITICAL: '매우위험',
};

/** 위험도 등급별 색상 */
export const RISK_COLORS: Record<string, string> = {
  SAFE: '#22c55e',
  CAUTION: '#f59e0b',
  DANGER: '#ef4444',
  CRITICAL: '#7f1d1d',
};

/** 위험도 등급별 배경색 */
export const RISK_BG_COLORS: Record<string, string> = {
  SAFE: '#f0fdf4',
  CAUTION: '#fffbeb',
  DANGER: '#fef2f2',
  CRITICAL: '#450a0a',
};

/** 시세 상태 라벨 */
export const PRICE_STATUS_LABELS: Record<string, string> = {
  ADEQUATE: '적정',
  OVERPRICED: '고가 (시세 대비 비쌈)',
  UNDERPRICED: '저가 (시세 대비 저렴함)',
};

/** 유리한 당사자 라벨 */
export const FAVORED_PARTY_LABELS: Record<string, string> = {
  LANDLORD: '임대인 유리',
  TENANT: '임차인 유리',
  NEUTRAL: '중립',
};

/** 부동산 유형 라벨 */
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  BUILDING: '건물',
  APARTMENT: '집합건물',
  LAND: '토지',
};

/** 등기정보광장 API 설정 */
export const REGISTRY_API = {
  BASE_URL: 'https://openapi.iros.go.kr',
  ENDPOINT: '/openapi/cr/rs/selectCrRsRgsCsOpenApi.rest',
  SERVICE_ID: '0000000072',
  MAX_REQUESTS_PER_DAY: 1000,
  MAX_RESULTS: 1000,
};

/** HUG 가입 조건 (2024 기준) */
export const HUG_CONDITIONS = {
  /** 보증금 상한 (수도권) */
  MAX_DEPOSIT_METRO: 700_000_000, // 7억원
  /** 보증금 상한 (비수도권) */
  MAX_DEPOSIT_NON_METRO: 500_000_000, // 5억원
  /** 전세가율 상한 (보증금/시세) */
  MAX_LEASE_RATIO: 0.9, // 90%
  /** 임대차계약 최소 기간 (개월) */
  MIN_LEASE_PERIOD_MONTHS: 1,
  /** 수도권 시도코드 */
  METRO_REGION_CODES: ['200', '900', '1100'], // 경기, 서울, 인천
};
