'use client';

import { JudgmentResult, RiskLevel } from '@/services/types';
import { RISK_LABELS } from '@/lib/constants';

interface RiskBriefingProps {
  result: JudgmentResult;
}

const riskConfig: Record<RiskLevel, { bg: string; text: string; border: string; icon: string }> = {
  SAFE: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', icon: '✅' },
  CAUTION: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', icon: '⚠️' },
  DANGER: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: '🚨' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-400', icon: '🛑' },
};

export default function RiskBriefing({ result }: RiskBriefingProps) {
  const config = riskConfig[result.riskLevel];

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-6`}>
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-4xl" role="img" aria-label={RISK_LABELS[result.riskLevel]}>
          {config.icon}
        </span>
        <div>
          <h2 className={`text-2xl font-bold ${config.text}`}>
            {RISK_LABELS[result.riskLevel]}
          </h2>
          <p className="text-sm text-gray-600">안전점수: {result.safetyScore}/100</p>
        </div>
        {/* 점수 바 */}
        <div className="flex-1 ml-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                result.safetyScore >= 75
                  ? 'bg-green-500'
                  : result.safetyScore >= 50
                    ? 'bg-yellow-500'
                    : result.safetyScore >= 25
                      ? 'bg-red-500'
                      : 'bg-red-800'
              }`}
              style={{ width: `${result.safetyScore}%` }}
              role="progressbar"
              aria-valuenow={result.safetyScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`안전점수 ${result.safetyScore}점`}
            />
          </div>
        </div>
      </div>

      {/* 요약 */}
      <p className={`text-lg ${config.text} font-medium mb-4`}>{result.summary}</p>

      {/* 핵심 수치 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">채무비율</p>
          <p className="text-xl font-bold text-gray-800">
            {(result.debtRatio * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">독소조항</p>
          <p className="text-xl font-bold text-gray-800">
            {result.details.contract.toxicClauses.length}건
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">HUG 보증</p>
          <p className="text-xl font-bold text-gray-800">
            {result.details.hug.eligible ? '가능' : '불가'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">시세 적정성</p>
          <p className="text-xl font-bold text-gray-800">
            {result.details.price.priceStatus === 'ADEQUATE'
              ? '적정'
              : result.details.price.priceStatus === 'OVERPRICED'
                ? '고가'
                : '저가'}
          </p>
        </div>
      </div>

      {/* 권장 행동 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-2">권장 행동</h3>
        <ul className="space-y-1">
          {result.recommendations.map((rec, idx) => (
            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
