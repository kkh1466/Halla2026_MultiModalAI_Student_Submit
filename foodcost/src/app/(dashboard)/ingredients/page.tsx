"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Upload, ChevronUp, ChevronDown } from "lucide-react";
import IngredientModal from "@/components/forms/IngredientModal";
import UploadModal from "@/components/forms/UploadModal";
import { INGREDIENT_CATEGORIES } from "@/lib/categories";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  category: string | null;
  updatedAt: string;
}

type SortField = "name" | "category" | "pricePerUnit" | "unit";
type SortDir = "asc" | "desc";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchIngredients = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/ingredients?${params}`);
      const data = await res.json();
      if (data.success) {
        setIngredients(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch ingredients:", error);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 식재료를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setIngredients((prev) => prev.filter((i) => i.id !== id));
      } else {
        alert(data.error);
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleSave = () => {
    setModalOpen(false);
    setEditingIngredient(null);
    fetchIngredients();
  };

  const handleUploadConfirm = async (
    items: { name: string; unit: string; pricePerUnit: number; category: string }[]
  ) => {
    setUploadModalOpen(false);
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      try {
        const res = await fetch("/api/ingredients/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        const data = await res.json();
        if (data.success) {
          if (data.action === "created") createdCount++;
          else if (data.action === "updated") updatedCount++;
        }
      } catch {
        // 개별 실패는 무시하고 계속 진행
      }
    }

    fetchIngredients();

    const messages: string[] = [];
    if (createdCount > 0) messages.push(`${createdCount}개 신규 등록`);
    if (updatedCount > 0) messages.push(`${updatedCount}개 단가 업데이트`);
    if (messages.length === 0) messages.push("변경 사항 없음");
    alert(messages.join(", "));
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ko-KR").format(price);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // 기본 정렬 방향: 이름/카테고리/단위는 오름차순(ㄱ→ㅎ), 단가는 내림차순(비싼순)
      setSortDir(field === "pricePerUnit" ? "desc" : "asc");
    }
  };

  const sortedIngredients = [...ingredients].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "name":
        cmp = a.name.localeCompare(b.name, "ko");
        break;
      case "category":
        cmp = (a.category || "").localeCompare(b.category || "", "ko");
        break;
      case "pricePerUnit":
        cmp = a.pricePerUnit - b.pricePerUnit;
        break;
      case "unit":
        cmp = a.unit.localeCompare(b.unit, "ko");
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">식재료 관리</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            data-testid="ingredient-upload-button"
          >
            <Upload className="w-4 h-4" />
            영수증/CSV 업로드
          </button>
          <button
            onClick={() => {
              setEditingIngredient(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            data-testid="ingredient-add-button"
          >
            <Plus className="w-4 h-4" />
            식재료 추가
          </button>
        </div>
      </div>

      {/* 검색 / 필터 */}
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="식재료 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="ingredient-search-input"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="카테고리 필터"
          data-testid="ingredient-category-filter"
        >
          <option value="">전체 카테고리</option>
          {INGREDIENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* 식재료 목록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : ingredients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || categoryFilter
              ? "검색 결과가 없습니다."
              : "등록된 식재료가 없습니다. 식재료를 추가해주세요."}
          </div>
        ) : (
          <table className="w-full" data-testid="ingredient-table">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="text-left px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none group"
                  onClick={() => handleSort("name")}
                >
                  <span className="inline-flex items-center gap-1">
                    식재료명 <SortIcon field="name" />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none group"
                  onClick={() => handleSort("category")}
                >
                  <span className="inline-flex items-center gap-1">
                    카테고리 <SortIcon field="category" />
                  </span>
                </th>
                <th
                  className="text-right px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none group"
                  onClick={() => handleSort("pricePerUnit")}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    단가 <SortIcon field="pricePerUnit" />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 text-sm font-medium text-gray-600 cursor-pointer select-none group"
                  onClick={() => handleSort("unit")}
                >
                  <span className="inline-flex items-center gap-1">
                    단위 <SortIcon field="unit" />
                  </span>
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedIngredients.map((ingredient) => {
                const isNew = Date.now() - new Date(ingredient.updatedAt).getTime() < 24 * 60 * 60 * 1000;
                return (
                <tr key={ingredient.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <span className="inline-flex items-center gap-2">
                      {ingredient.name}
                      {isNew && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded">
                          NEW
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {ingredient.category || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatPrice(ingredient.pricePerUnit)}원
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    /{ingredient.unit}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingIngredient(ingredient);
                          setModalOpen(true);
                        }}
                        className="text-gray-500 hover:text-blue-600 p-1"
                        aria-label={`${ingredient.name} 수정`}
                        data-testid={`ingredient-edit-${ingredient.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(ingredient.id, ingredient.name)
                        }
                        className="text-gray-500 hover:text-red-600 p-1"
                        aria-label={`${ingredient.name} 삭제`}
                        data-testid={`ingredient-delete-${ingredient.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 식재료 추가/수정 모달 */}
      {modalOpen && (
        <IngredientModal
          ingredient={editingIngredient}
          onClose={() => {
            setModalOpen(false);
            setEditingIngredient(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* 영수증/CSV 업로드 모달 */}
      {uploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onConfirm={handleUploadConfirm}
        />
      )}
    </div>
  );
}
