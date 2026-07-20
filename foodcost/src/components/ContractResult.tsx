'use client';

import { ContractResult as ContractResultType } from '@/services/types';
import { FAVORED_PARTY_LABELS } from '@/lib/constants';

interface ContractResultProps {
  result: ContractResultType;
}

export default function ContractResult({ result }: ContractResultProps) {
  const severityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const severityLabel = (severity: string) => {
    switch (severity) {
      case 'HIGH': return '높음';
      case 'MEDIUM': return '보통';
      default: return '낮음';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" role="img" aria-label="독소조항 체크">📋</span>
        <h3 className="text-lg font-semibold text-gray-800">독소조항 체크</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">표준계약서 여부</span>
          <span className={`font-semibold ${result.isStandard ? 'text-green-600' : 'text-orange-600'}`}>
            {result.isStandard ? '표준' : '비표준'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">전체 조항</span>
          <span className="font-semibold text-gray-800">{result.totalClauses}개</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">비표준 조항</span>
          <span className={`font-semibold ${result.nonStandardCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {result.nonStandardCount}개
          </span>
        </div>

        {result.toxicClauses.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              발견된 독소조항 ({result.toxicClauses.length}건)
            </p>
            {result.toxicClauses.map((clause, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-3 mb-2 border ${severityColor(clause.severity)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50">
                    위험도: {severityLabel(clause.severity)}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50">
                    {FAVORED_PARTY_LABELS[clause.favoredParty]}
                  </span>
                </div>
                <p className="text-sm font-medium mt-2">{clause.clause}</p>
                <p className="text-xs mt-1 opacity-80">{clause.reason}</p>
              </div>
            ))}
          </div>
        )}

        {result.toxicClauses.length === 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">독소조항이 발견되지 않았습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
