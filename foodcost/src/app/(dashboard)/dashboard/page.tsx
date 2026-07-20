"use client";

import { useState, useEffect } from "react";
import { UtensilsCrossed, Carrot, TrendingUp, AlertTriangle } from "lucide-react";
import { formatKRW, formatPercent, getCostRateLevel } from "@/lib/utils";
import Link from "next/link";

interface MenuCost {
  id: string;
  name: string;
  category: string;
  totalCost: number;
  sellingPrice: number;
  costRate: number;
  updatedAt: string;
}

interface DashboardData {
  totalMenus: number;
  totalIngredients: number;
  averageCostRate: number;
  highCostMenus: MenuCost[];
  recentMenus: MenuCost[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">로딩 중...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-gray-500">데이터를 불러올 수 없습니다.</div>;
  }

  const avgLevel = getCostRateLevel(data.averageCostRate);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5" data-testid="dashboard-stat-total-menus">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UtensilsCrossed className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">등록 메뉴</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalMenus}개</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5" data-testid="dashboard-stat-total-ingredients">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Carrot className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">등록 식재료</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalIngredients}개</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5" data-testid="dashboard-stat-avg-cost-rate">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              avgLevel === "good" ? "bg-green-100" : avgLevel === "warning" ? "bg-yellow-100" : "bg-red-100"
            }`}>
              <TrendingUp className={`w-5 h-5 ${
                avgLevel === "good" ? "text-green-600" : avgLevel === "warning" ? "text-yellow-600" : "text-red-600"
              }`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">평균 원가율</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercent(data.averageCostRate)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5" data-testid="dashboard-stat-high-cost">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">주의 메뉴 (30%↑)</p>
              <p className="text-2xl font-bold text-red-600">
                {data.highCostMenus.length}개
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 원가율 경고 메뉴 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">원가율 주의 메뉴</h2>
          </div>
          <div className="p-4">
            {data.highCostMenus.length === 0 ? (
              <p className="text-gray-500 text-sm">원가율 30%를 초과하는 메뉴가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {data.highCostMenus.map((menu) => {
                  const level = getCostRateLevel(menu.costRate);
                  return (
                    <div
                      key={menu.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{menu.name}</p>
                        <p className="text-xs text-gray-500">{menu.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {formatKRW(menu.totalCost)} / {formatKRW(menu.sellingPrice)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            level === "warning"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {formatPercent(menu.costRate)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Link
              href="/cost"
              className="block mt-4 text-sm text-blue-600 hover:underline"
            >
              전체 원가 보기 →
            </Link>
          </div>
        </div>

        {/* 최근 수정 메뉴 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">최근 수정된 메뉴</h2>
          </div>
          <div className="p-4">
            {data.recentMenus.length === 0 ? (
              <p className="text-gray-500 text-sm">등록된 메뉴가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {data.recentMenus.map((menu) => (
                  <div
                    key={menu.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{menu.name}</p>
                      <p className="text-xs text-gray-500">{menu.category}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(menu.updatedAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/recipes"
              className="block mt-4 text-sm text-blue-600 hover:underline"
            >
              전체 메뉴 보기 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
