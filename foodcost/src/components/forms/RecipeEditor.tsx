"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { formatKRW } from "@/lib/utils";
import { calculateRecipeItemCost, getCompatibleRecipeUnits } from "@/lib/units";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
}

interface RecipeItemForm {
  ingredientId: string;
  quantity: string;
  unit: string;
}

interface RecipeEditorProps {
  menuId: string;
  ingredients: Ingredient[];
  onClose: () => void;
  onSave: () => void;
}

export default function RecipeEditor({
  menuId,
  ingredients,
  onClose,
  onSave,
}: RecipeEditorProps) {
  const [items, setItems] = useState<RecipeItemForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        const res = await fetch(`/api/menus/${menuId}/recipe`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setItems(
            data.data.map((item: { ingredientId: string; quantity: number; unit: string }) => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity.toString(),
              unit: item.unit,
            }))
          );
        }
      } catch {
        console.error("Failed to load recipe");
      } finally {
        setLoading(false);
      }
    };
    loadRecipe();
  }, [menuId]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { ingredientId: "", quantity: "", unit: "" },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof RecipeItemForm, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        // 식재료 선택 시 단위 자동 설정
        if (field === "ingredientId") {
          const ing = ingredients.find((ing) => ing.id === value);
          if (ing) updated.unit = ing.unit;
        }
        return updated;
      })
    );
  };

  const calculateTotalCost = () => {
    return items.reduce((sum, item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (!ing || !item.quantity) return sum;
      return sum + calculateRecipeItemCost({
        quantity: Number(item.quantity),
        recipeUnit: item.unit,
        ingredientUnit: ing.unit,
        pricePerUnit: ing.pricePerUnit,
      });
    }, 0);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    const validItems = items.filter(
      (item) => item.ingredientId && Number(item.quantity) > 0
    );

    try {
      const res = await fetch(`/api/menus/${menuId}/recipe`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: validItems.map((item) => ({
            ingredientId: item.ingredientId,
            quantity: Number(item.quantity),
            unit: item.unit,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSave();
      } else {
        setError(data.error || "저장에 실패했습니다.");
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setSaving(false);
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
      aria-labelledby="recipe-editor-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="recipe-editor-title" className="text-lg font-semibold">
            레시피 편집
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-4">로딩 중...</div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm" role="alert">
                  {error}
                </div>
              )}

              {items.length === 0 ? (
                <p className="text-gray-500 text-sm mb-4">
                  식재료를 추가하여 레시피를 구성하세요.
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {items.map((item, index) => {
                    const selectedIng = ingredients.find((i) => i.id === item.ingredientId);
                    const unitOptions = selectedIng
                      ? getCompatibleRecipeUnits(selectedIng.unit)
                      : [];
                    const itemCost = selectedIng && item.quantity
                      ? calculateRecipeItemCost({
                          quantity: Number(item.quantity),
                          recipeUnit: item.unit,
                          ingredientUnit: selectedIng.unit,
                          pricePerUnit: selectedIng.pricePerUnit,
                        })
                      : 0;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-md"
                      >
                        <select
                          value={item.ingredientId}
                          onChange={(e) => updateItem(index, "ingredientId", e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          data-testid={`recipe-item-ingredient-${index}`}
                        >
                          <option value="">식재료 선택</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({formatKRW(ing.pricePerUnit)}/{ing.unit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          placeholder="수량"
                          min="0"
                          step="0.01"
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          data-testid={`recipe-item-quantity-${index}`}
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                          disabled={!selectedIng}
                          className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          aria-label="사용 단위"
                          data-testid={`recipe-item-unit-${index}`}
                        >
                          {unitOptions.length === 0 ? (
                            <option value="">단위</option>
                          ) : (
                            unitOptions.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))
                          )}
                        </select>
                        <span className="text-sm font-medium w-24 text-right">
                          {formatKRW(itemCost)}
                        </span>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          aria-label="항목 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={addItem}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                data-testid="recipe-add-item-button"
              >
                <Plus className="w-4 h-4" />
                식재료 추가
              </button>

              {items.length > 0 && (
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="font-semibold text-gray-700">총 원가</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatKRW(calculateTotalCost())}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            data-testid="recipe-save-button"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
