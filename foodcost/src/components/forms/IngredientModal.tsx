"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { INGREDIENT_CATEGORIES } from "@/lib/categories";
import { INGREDIENT_UNITS } from "@/lib/units";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  category: string | null;
}

interface IngredientModalProps {
  ingredient: Ingredient | null;
  onClose: () => void;
  onSave: () => void;
}

const UNIT_OPTIONS = INGREDIENT_UNITS;
const CATEGORY_OPTIONS = INGREDIENT_CATEGORIES;

export default function IngredientModal({
  ingredient,
  onClose,
  onSave,
}: IngredientModalProps) {
  const isEditing = !!ingredient;
  const [name, setName] = useState(ingredient?.name ?? "");
  const [unit, setUnit] = useState(ingredient?.unit ?? "g");
  const [pricePerUnit, setPricePerUnit] = useState(
    ingredient?.pricePerUnit?.toString() ?? ""
  );
  const [category, setCategory] = useState(ingredient?.category ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("식재료명을 입력해주세요.");
      return;
    }
    if (!pricePerUnit || Number(pricePerUnit) < 0) {
      setError("올바른 단가를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const url = isEditing
        ? `/api/ingredients/${ingredient.id}`
        : "/api/ingredients";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          unit,
          pricePerUnit: Number(pricePerUnit),
          category: category || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "저장에 실패했습니다.");
        return;
      }

      onSave();
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ingredient-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="ingredient-modal-title" className="text-lg font-semibold">
            {isEditing ? "식재료 수정" : "식재료 추가"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="ing-name" className="block text-sm font-medium text-gray-700 mb-1">
              식재료명 *
            </label>
            <input
              id="ing-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 돼지고기 삼겹살"
              data-testid="ingredient-modal-name-input"
            />
          </div>

          <div>
            <label htmlFor="ing-category" className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <select
              id="ing-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="ingredient-modal-category-select"
            >
              <option value="">선택 안함</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ing-price" className="block text-sm font-medium text-gray-700 mb-1">
                단가 (원) *
              </label>
              <input
                id="ing-price"
                type="number"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                data-testid="ingredient-modal-price-input"
              />
            </div>
            <div>
              <label htmlFor="ing-unit" className="block text-sm font-medium text-gray-700 mb-1">
                단위 *
              </label>
              <select
                id="ing-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="ingredient-modal-unit-select"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              data-testid="ingredient-modal-submit-button"
            >
              {loading ? "저장 중..." : isEditing ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
