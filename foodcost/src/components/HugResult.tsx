'use client';

import { HugResult as HugResultType } from '@/services/types';

interface HugResultProps {
  result: HugResultType;
}

export default function HugResult({ result }: HugResultProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" role="img" aria-label="HUG 보증">🏛️</span>
        <h3 className="text-lg font-semibold text-gray-800">HUG 전세보증금 반환보증</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">가입 가능 여부</span>
          <span className={`font-semibold ${result.eligible ? 'text-green-600' : 'text-red-600'}`}>
            {result.eligible ? '가입 가능' : '가입 불가'}
          </span>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700">{result.reason}</p>
        </div>

        {result.conditions.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 mb-2">조건 충족 현황</p>
            <div className="space-y-2">
              {result.conditions.map((condition, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className={`mt-0.5 ${condition.met ? 'text-green-500' : 'text-red-500'}`}>
                    {condition.met ? '✓' : '✗'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{condition.name}</p>
                    <p className="text-xs text-gray-500">{condition.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
