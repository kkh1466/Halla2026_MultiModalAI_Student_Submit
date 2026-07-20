'use client';

import { DebtResult as DebtResultType } from '@/services/types';

interface DebtResultProps {
  result: DebtResultType;
}

export default function DebtResult({ result }: DebtResultProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" role="img" aria-label="빚 체크">💰</span>
        <h3 className="text-lg font-semibold text-gray-800">빚 체크 (근저당권)</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">채무 존재</span>
          <span className={`font-semibold ${result.hasDebt ? 'text-red-600' : 'text-green-600'}`}>
            {result.hasDebt ? '있음' : '없음'}
          </span>
        </div>

        {result.hasDebt && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">총 채무액</span>
              <span className="font-semibold text-red-600">
                {result.totalDebt.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">근저당 건수</span>
              <span className="font-semibold text-gray-800">{result.mortgageCount}건</span>
            </div>

            {result.details.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">상세 내역</p>
                {result.details.map((detail, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 mb-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{detail.creditor}</span>
                      <span className="font-medium text-gray-800">
                        {detail.amount.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>설정일: {detail.registrationDate}</span>
                      <span>순위: {detail.priority}순위</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
