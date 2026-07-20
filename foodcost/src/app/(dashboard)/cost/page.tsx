"use client";

import { useState, useEffect } from "react";
import { formatKRW, formatPercent, getCostRateLevel } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CostItemDetail {
  ingredientName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  itemCost: number;
}

interface CostResult {
  menuId: string;
  menuName: string;
  category: string;
  totalCost: number;
  sellingPrice: number;
  costRate: number;
  margin: number;
  items: CostItemDetail[];
}

export default function CostPage() {
  const [costResults, setCostResults] = useState<CostResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "costRate" | "margin">("costRate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchCost = async () => {
      try {
        const res = await fetch("/api/cost");
        const data = await res.json();
        if (data.success) setCostResults(data.data);
      } catch (error) {
        console.error("Failed to fetch cost:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCost();
  }, []);

  const sortedResults = [...costResults].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "name":
        cmp = a.menuName.localeCompare(b.menuName);
        break;
      case "costRate":
        cmp = a.costRate - b.costRate;
        break;
      case "margin":
        cmp = a.margin - b.margin;
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const getLevelBadge = (costRate: number) => {
    const level = getCostRateLevel(costRate);
    const styles = {
      good: "bg-green-100 text-green-700",
      warning: "bg-yellow-100 text-yellow-700",
      danger: "bg-red-100 text-red-700",
    };
    const labels = {
      good: "양호",
      warning: "주의",
      danger: "위험",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[level]}`}>
        {labels[level]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">로딩 중...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">원가 계산 결과</h1>

      {/* 요약 */}
      {costResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">총 메뉴 수</p>
            <p className="text-2xl font-bold text-gray-900">{costResults.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">평균 원가율</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPercent(
                costResults.reduce((sum, r) => sum + r.costRate, 0) / costResults.length
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">위험 메뉴 (40% 초과)</p>
            <p className="text-2xl font-bold text-red-600">
              {costResults.filter((r) => r.costRate > 40).length}개
            </p>
          </div>
        </div>
      )}

      {/* 정렬 버튼 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleSort("name")}
          className={`px-3 py-1 text-sm rounded-md border ${
            sortBy === "name" ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-300"
          }`}
        >
          메뉴명 {sortBy === "name" && (sortDir === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSort("costRate")}
          className={`px-3 py-1 text-sm rounded-md border ${
            sortBy === "costRate" ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-300"
          }`}
        >
          원가율 {sortBy === "costRate" && (sortDir === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSort("margin")}
          className={`px-3 py-1 text-sm rounded-md border ${
            sortBy === "margin" ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-300"
          }`}
        >
          마진 {sortBy === "margin" && (sortDir === "asc" ? "↑" : "↓")}
        </button>
      </div>

      {/* 결과 목록 */}
      {costResults.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          등록된 메뉴가 없습니다. 먼저 레시피를 등록해주세요.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full" data-testid="cost-result-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">메뉴</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">카테고리</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">원가</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">판매가</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">원가율</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">마진</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">상태</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedResults.map((result) => {
                const isExpanded = expandedId === result.menuId;
                return (
                  <tr key={result.menuId} className="group">
                    <td colSpan={8} className="p-0">
                      <div
                        className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : result.menuId)
                        }
                        data-testid={`cost-row-${result.menuId}`}
                      >
                        <div className="flex-1 grid grid-cols-8 items-center">
                          <span className="font-medium text-gray-900">
                            {result.menuName}
                          </span>
                          <span className="text-sm text-gray-600">
                            {result.category}
                          </span>
                          <span className="text-sm text-right">
                            {formatKRW(result.totalCost)}
                          </span>
                          <span className="text-sm text-right">
                            {formatKRW(result.sellingPrice)}
                          </span>
                          <span className="text-sm text-right font-semibold">
                            {formatPercent(result.costRate)}
                          </span>
                          <span className="text-sm text-right">
                            {formatKRW(result.margin)}
                          </span>
                          <span className="text-center">
                            {getLevelBadge(result.costRate)}
                          </span>
                          <span className="text-right">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400 inline" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400 inline" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 상세 원가 내역 */}
                      {isExpanded && result.items.length > 0 && (
                        <div className="px-8 pb-4">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-gray-500 border-b">
                                <th className="text-left py-2">식재료</th>
                                <th className="text-right py-2">사용량</th>
                                <th className="text-right py-2">단가</th>
                                <th className="text-right py-2">비용</th>
                                <th className="text-right py-2">비중</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.items.map((item, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="py-2">{item.ingredientName}</td>
                                  <td className="text-right py-2">
                                    {item.quantity}{item.unit}
                                  </td>
                                  <td className="text-right py-2">
                                    {formatKRW(item.unitPrice)}
                                  </td>
                                  <td className="text-right py-2 font-medium">
                                    {formatKRW(item.itemCost)}
                                  </td>
                                  <td className="text-right py-2 text-gray-500">
                                    {result.totalCost > 0
                                      ? formatPercent((item.itemCost / result.totalCost) * 100)
                                      : "0%"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
