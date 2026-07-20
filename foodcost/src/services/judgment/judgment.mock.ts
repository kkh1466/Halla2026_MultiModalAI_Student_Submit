import { JudgmentResult, RiskLevel } from '../types';
import { IJudgmentService, JudgmentInput } from './judgment.interface';

/**
 * Mock 판단 AI 서비스
 * 규칙 기반으로 위험도를 판단 (Mock이지만 실제 로직 포함)
 */
export class MockJudgmentService implements IJudgmentService {
  async analyze(input: JudgmentInput): Promise<JudgmentResult> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const { ocr, debt, price, contract, hug } = input;

    // 채무비율 계산: 총 빚 / 매물 추정 시세
    const debtRatio = price.estimatedValue > 0 ? debt.totalDebt / price.estimatedValue : 0;

    // 안전점수 계산 (100점 만점, 높을수록 안전)
    let safetyScore = 100;

    // 1. 채무비율 감점 (가장 큰 비중)
    if (debtRatio > 0.9) safetyScore -= 50;
    else if (debtRatio > 0.7) safetyScore -= 35;
    else if (debtRatio > 0.5) safetyScore -= 20;
    else if (debtRatio > 0.3) safetyScore -= 10;

    // 2. 보증금 vs 매물가치 체크
    const depositToValue = price.estimatedValue > 0 ? ocr.deposit / price.estimatedValue : 0;
    if (depositToValue + debtRatio > 1.0) {
      // 보증금 + 빚 > 매물가치 → 매우 위험
      safetyScore -= 30;
    } else if (depositToValue + debtRatio > 0.8) {
      safetyScore -= 15;
    }

    // 3. 시세 적정성 감점
    if (price.priceStatus === 'OVERPRICED') safetyScore -= 5;
    if (price.priceStatus === 'UNDERPRICED') safetyScore -= 10; // 저가도 위험 신호

    // 4. 독소조항 감점
    for (const clause of contract.toxicClauses) {
      if (clause.severity === 'HIGH') safetyScore -= 10;
      else if (clause.severity === 'MEDIUM') safetyScore -= 5;
      else safetyScore -= 2;
    }

    // 5. HUG 미가입 감점
    if (!hug.eligible) safetyScore -= 10;

    // 점수 범위 보정
    safetyScore = Math.max(0, Math.min(100, safetyScore));

    // 위험도 등급 결정
    let riskLevel: RiskLevel;
    if (safetyScore >= 75) riskLevel = 'SAFE';
    else if (safetyScore >= 50) riskLevel = 'CAUTION';
    else if (safetyScore >= 25) riskLevel = 'DANGER';
    else riskLevel = 'CRITICAL';

    // 요약 생성
    const summary = this.generateSummary(riskLevel, debtRatio, depositToValue, contract, hug);

    // 권장 행동 생성
    const recommendations = this.generateRecommendations(
      riskLevel,
      debtRatio,
      contract,
      hug,
      price
    );

    return {
      riskLevel,
      summary,
      debtRatio,
      details: { debt, price, contract, hug },
      recommendations,
      safetyScore,
    };
  }

  private generateSummary(
    riskLevel: RiskLevel,
    debtRatio: number,
    depositToValue: number,
    contract: { toxicClauses: { length: number } },
    hug: { eligible: boolean }
  ): string {
    switch (riskLevel) {
      case 'CRITICAL':
        return `매우 위험한 계약입니다. 채무비율 ${(debtRatio * 100).toFixed(0)}%로 보증금 회수가 극히 어렵습니다.`;
      case 'DANGER':
        return `위험한 계약입니다. 채무비율 ${(debtRatio * 100).toFixed(0)}%, 보증금+빚이 매물가치의 ${((depositToValue + debtRatio) * 100).toFixed(0)}%에 달합니다.`;
      case 'CAUTION':
        return `주의가 필요한 계약입니다.${contract.toxicClauses.length > 0 ? ` 독소조항 ${contract.toxicClauses.length}건 발견.` : ''}${!hug.eligible ? ' HUG 보증 미가입 대상.' : ''}`;
      default:
        return `비교적 안전한 계약입니다. 채무비율 ${(debtRatio * 100).toFixed(0)}%, HUG 보증 가입 가능.`;
    }
  }

  private generateRecommendations(
    riskLevel: RiskLevel,
    debtRatio: number,
    contract: { toxicClauses: Array<{ clause: string }> },
    hug: { eligible: boolean },
    price: { priceStatus: string }
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'CRITICAL' || riskLevel === 'DANGER') {
      recommendations.push('🚨 이 계약은 전세사기 위험이 높습니다. 계약을 재고해주세요.');
      recommendations.push('등기부등본을 직접 확인하여 근저당권 설정 현황을 검증하세요.');
    }

    if (debtRatio > 0.5) {
      recommendations.push(
        `채무비율이 ${(debtRatio * 100).toFixed(0)}%입니다. 매물 매각 시 보증금 전액 회수가 어려울 수 있습니다.`
      );
    }

    if (contract.toxicClauses.length > 0) {
      recommendations.push(
        '독소조항이 발견되었습니다. 계약 전 법률 전문가 상담을 권장합니다.'
      );
    }

    if (hug.eligible) {
      recommendations.push('HUG(주택도시보증공사) 전세보증금 반환보증 가입을 강력 권장합니다.');
    } else {
      recommendations.push(
        'HUG 보증 가입이 불가합니다. 전세보증보험 가입 가능 여부를 확인하세요.'
      );
    }

    if (price.priceStatus === 'UNDERPRICED') {
      recommendations.push(
        '매물 시세가 주변 대비 낮습니다. 급매물 또는 하자가 있을 수 있으니 확인하세요.'
      );
    }

    recommendations.push('전입신고와 확정일자를 반드시 계약 당일에 완료하세요.');

    return recommendations;
  }
}
