// ============================================
// 콘트렉체커 - 공통 타입 정의
// ============================================

/** 위험도 등급 */
export type RiskLevel = 'SAFE' | 'CAUTION' | 'DANGER' | 'CRITICAL';

/** 시세 상태 */
export type PriceStatus = 'ADEQUATE' | 'OVERPRICED' | 'UNDERPRICED';

/** 유리한 당사자 */
export type FavoredParty = 'LANDLORD' | 'TENANT' | 'NEUTRAL';

/** 심각도 */
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

/** 부동산 구분 */
export type PropertyType = 'BUILDING' | 'APARTMENT' | 'LAND';

// ============================================
// OCR 관련
// ============================================

export interface OcrResult {
  /** 부동산 주소 */
  address: string;
  /** 보증금 (원) */
  deposit: number;
  /** 월세 (원, 있는 경우) */
  monthlyRent?: number;
  /** 임대인 */
  landlord: string;
  /** 임차인 */
  tenant: string;
  /** 계약일 */
  contractDate: string;
  /** 계약 시작일 */
  leaseStartDate: string;
  /** 계약 종료일 */
  leaseEndDate: string;
  /** 전체 계약서 텍스트 */
  contractText: string;
  /** 특약사항 */
  specialTerms: string[];
  /** 부동산 유형 */
  propertyType: PropertyType;
}

// ============================================
// 빚 체크 관련
// ============================================

export interface DebtDetail {
  /** 채권자 */
  creditor: string;
  /** 채권 금액 (원) */
  amount: number;
  /** 설정일 */
  registrationDate: string;
  /** 순위 */
  priority: number;
}

export interface DebtResult {
  /** 빚 존재 여부 */
  hasDebt: boolean;
  /** 총 채무액 (원) */
  totalDebt: number;
  /** 근저당 건수 */
  mortgageCount: number;
  /** 상세 내역 */
  details: DebtDetail[];
}

// ============================================
// 시세 체크 관련
// ============================================

export interface PriceResult {
  /** 추정 시세 (원) */
  estimatedValue: number;
  /** 주변 평균 시세 (원) */
  averageAreaPrice: number;
  /** 시세 상태 */
  priceStatus: PriceStatus;
  /** 신뢰도 (0-1) */
  confidence: number;
  /** 비교 매물 수 */
  comparisonCount: number;
}

// ============================================
// 독소조항 관련
// ============================================

export interface ToxicClause {
  /** 조항 내용 */
  clause: string;
  /** 독소 판단 이유 */
  reason: string;
  /** 유리한 당사자 */
  favoredParty: FavoredParty;
  /** 심각도 */
  severity: Severity;
}

export interface ContractResult {
  /** 표준 계약서 여부 */
  isStandard: boolean;
  /** 독소조항 목록 */
  toxicClauses: ToxicClause[];
  /** 전체 조항 수 */
  totalClauses: number;
  /** 비표준 조항 수 */
  nonStandardCount: number;
}

// ============================================
// HUG 관련
// ============================================

export interface HugCondition {
  /** 조건명 */
  name: string;
  /** 충족 여부 */
  met: boolean;
  /** 설명 */
  description: string;
}

export interface HugResult {
  /** 가입 가능 여부 */
  eligible: boolean;
  /** 판단 이유 */
  reason: string;
  /** 조건 목록 */
  conditions: HugCondition[];
}

// ============================================
// 판단 AI 관련
// ============================================

export interface JudgmentResult {
  /** 종합 위험도 */
  riskLevel: RiskLevel;
  /** 한줄 요약 */
  summary: string;
  /** 채무비율 (빚/매물가치, 0-1+) */
  debtRatio: number;
  /** 상세 결과 */
  details: {
    debt: DebtResult;
    price: PriceResult;
    contract: ContractResult;
    hug: HugResult;
  };
  /** 권장 행동 */
  recommendations: string[];
  /** 점수 (0-100, 높을수록 안전) */
  safetyScore: number;
}

// ============================================
// API 요청/응답
// ============================================

export interface AnalyzeRequest {
  /** 파일 (base64 인코딩) */
  fileBase64: string;
  /** 파일명 */
  fileName: string;
  /** 파일 타입 */
  fileType: string;
}

export interface AnalyzeResponse {
  success: boolean;
  result?: JudgmentResult;
  error?: string;
}
