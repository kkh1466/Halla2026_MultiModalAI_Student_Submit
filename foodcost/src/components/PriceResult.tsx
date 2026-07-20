'use client';

import { PriceResult as PriceResultType } from '@/services/types';
import { PRICE_STATUS_LABELS } from '@/lib/constants';

interface PriceResultProps {
  result: PriceResultType;
}

export default function PriceResult({ result }: PriceResultProps) {
  const statusColor =
    result.priceStatus === 'ADEQUATE'
      ? 'text-green-600'
      : result.priceStatus === 'OVERPRICED'
        ? 'text-orange-600'
        : 'text-blue-600';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" role="img" aria-label="시세 체크">🏠</span>
        <h3 className="text-lg font-semibold text-gray-800">시세 체크</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">매물 추정 시세</span>
          <span className="font-semibold text-gray-800">
            {result.estimatedValue.toLocaleString()}원
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">주변 평균 시세</span>
          <span className="font-semibold text-gray-800">
            {result.averageAreaPrice.toLocaleString()}원
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">시세 적정성</span>
          <span className={`font-semibold ${statusColor}`}>
            {PRICE_STATUS_LABELS[result.priceStatus]}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">비교 매물</span>
          <span className="font-semibold text-gray-800">{result.comparisonCount}건</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">신뢰도</span>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {(result.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
