/**
 * 원가율 계산
 */
export function calculateCostRate(cost: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0;
  return (cost / sellingPrice) * 100;
}

/**
 * 마진 계산
 */
export function calculateMargin(sellingPrice: number, cost: number): number {
  return sellingPrice - cost;
}

/**
 * 원가율 등급 반환
 */
export function getCostRateLevel(costRate: number): "good" | "warning" | "danger" {
  if (costRate <= 30) return "good";
  if (costRate <= 40) return "warning";
  return "danger";
}

/**
 * 원가율 등급별 색상
 */
export function getCostRateColor(costRate: number): string {
  const level = getCostRateLevel(costRate);
  switch (level) {
    case "good":
      return "#22c55e";
    case "warning":
      return "#eab308";
    case "danger":
      return "#ef4444";
  }
}

/**
 * 숫자를 원화 형식으로 포맷
 */
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}

/**
 * 퍼센트 포맷
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
