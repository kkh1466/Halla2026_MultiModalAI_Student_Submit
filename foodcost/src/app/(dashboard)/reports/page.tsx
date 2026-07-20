"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { formatKRW, formatPercent } from "@/lib/utils";

interface CostRankItem {
  menuName: string;
  category: string;
  totalCost: number;
  sellingPrice: number;
  costRate: number;
}

interface IngredientRatioItem {
  name: string;
  cost: number;
}

interface MonthlyTrendItem {
  month: string;
  avgPrice: number;
  changeCount: number;
}

interface ReportData {
  costRanking: CostRankItem[];
  ingredientRatio: IngredientRatioItem[];
  monthlyTrend: MonthlyTrendItem[];
}

const PIE_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#eab308", "#8b5cf6",
  "#f97316", "#06b6d4", "#ec4899", "#14b8a6", "#6366f1",
];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-gray-500">데이터를 불러올 수 없습니다.</div>;
  }

  const totalIngredientCost = data.ingredientRatio.reduce((sum, item) => sum + item.cost, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">리포트</h1>

      {data.costRanking.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          리포트를 생성하려면 먼저 메뉴와 레시피를 등록해주세요.
        </div>
      ) : (
        <div className="space-y-6">
          {/* 월별 원가 변동 추이 */}
          {data.monthlyTrend.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                월별 식재료 단가 변동 추이
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [formatKRW(value), "평균 단가"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgPrice"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 원가율 높은 순 메뉴 (바 차트) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              원가율 높은 메뉴 TOP
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.costRanking.slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="menuName"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatPercent(value), "원가율"]}
                  />
                  <Legend />
                  <Bar
                    dataKey="costRate"
                    name="원가율"
                    fill="#ef4444"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 식재료별 비용 비중 (파이 차트) */}
          {data.ingredientRatio.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                식재료별 비용 비중
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.ingredientRatio}
                        dataKey="cost"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(1)}%`
                        }
                        labelLine={false}
                      >
                        {data.ingredientRatio.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatKRW(value), "비용"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {data.ingredientRatio.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900 font-medium">
                          {formatKRW(item.cost)}
                        </span>
                        <span className="text-gray-500">
                          {totalIngredientCost > 0
                            ? formatPercent((item.cost / totalIngredientCost) * 100)
                            : "0%"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
