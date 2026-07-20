"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import RecipeEditor from "@/components/forms/RecipeEditor";
import { formatKRW, formatPercent, getCostRateLevel } from "@/lib/utils";
import { calculateRecipeItemCost } from "@/lib/units";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
}

interface RecipeItem {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}

interface Menu {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  recipeItems: RecipeItem[];
  updatedAt: string;
}

const CATEGORY_OPTIONS = ["한식", "중식", "일식", "양식", "분식", "음료", "디저트", "기타"];

export default function RecipesPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

  // 새 메뉴 폼 상태
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("한식");
  const [newSellingPrice, setNewSellingPrice] = useState("");

  const fetchMenus = useCallback(async () => {
    try {
      const res = await fetch("/api/menus");
      const data = await res.json();
      if (data.success) setMenus(data.data);
    } catch (error) {
      console.error("Failed to fetch menus:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIngredients = useCallback(async () => {
    try {
      const res = await fetch("/api/ingredients");
      const data = await res.json();
      if (data.success) setIngredients(data.data);
    } catch (error) {
      console.error("Failed to fetch ingredients:", error);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
    fetchIngredients();
  }, [fetchMenus, fetchIngredients]);

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          category: newCategory,
          sellingPrice: Number(newSellingPrice) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMenus((prev) => [data.data, ...prev]);
        setShowNewMenu(false);
        setNewName("");
        setNewSellingPrice("");
      } else {
        alert(data.error);
      }
    } catch {
      alert("메뉴 생성에 실패했습니다.");
    }
  };

  const handleDeleteMenu = async (id: string, name: string) => {
    if (!confirm(`"${name}" 메뉴를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/menus/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMenus((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert(data.error);
      }
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleRecipeSaved = () => {
    setEditingMenuId(null);
    fetchMenus();
  };

  const calculateCost = (items: RecipeItem[]) => {
    return items.reduce((sum, item) => {
      return sum + calculateRecipeItemCost({
        quantity: item.quantity,
        recipeUnit: item.unit,
        ingredientUnit: item.ingredient.unit,
        pricePerUnit: item.ingredient.pricePerUnit,
      });
    }, 0);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">레시피 등록</h1>
        <button
          onClick={() => setShowNewMenu(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          data-testid="recipe-add-menu-button"
        >
          <Plus className="w-4 h-4" />
          메뉴 추가
        </button>
      </div>

      {/* 새 메뉴 생성 폼 */}
      {showNewMenu && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-semibold mb-3">새 메뉴 추가</h3>
          <form onSubmit={handleCreateMenu} className="flex gap-3 items-end flex-wrap">
            <div>
              <label htmlFor="new-menu-name" className="block text-sm text-gray-600 mb-1">
                메뉴명 *
              </label>
              <input
                id="new-menu-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="메뉴명"
                data-testid="recipe-new-menu-name-input"
              />
            </div>
            <div>
              <label htmlFor="new-menu-category" className="block text-sm text-gray-600 mb-1">
                카테고리
              </label>
              <select
                id="new-menu-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="recipe-new-menu-category-select"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-menu-price" className="block text-sm text-gray-600 mb-1">
                판매가 (원)
              </label>
              <input
                id="new-menu-price"
                type="number"
                value={newSellingPrice}
                onChange={(e) => setNewSellingPrice(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                data-testid="recipe-new-menu-price-input"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                data-testid="recipe-new-menu-submit-button"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setShowNewMenu(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 메뉴 목록 */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">로딩 중...</div>
      ) : menus.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          등록된 메뉴가 없습니다. 메뉴를 추가해주세요.
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map((menu) => {
            const totalCost = calculateCost(menu.recipeItems);
            const costRate = menu.sellingPrice > 0 ? (totalCost / menu.sellingPrice) * 100 : 0;
            const margin = menu.sellingPrice - totalCost;
            const level = getCostRateLevel(costRate);
            const isExpanded = expandedMenuId === menu.id;

            return (
              <div key={menu.id} className="bg-white rounded-lg shadow">
                {/* 메뉴 헤더 */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedMenuId(isExpanded ? null : menu.id)}
                  data-testid={`recipe-menu-item-${menu.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{menu.name}</h3>
                      <p className="text-sm text-gray-500">{menu.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right text-sm">
                      <p className="text-gray-600">원가: {formatKRW(totalCost)}</p>
                      <p className="text-gray-600">판매가: {formatKRW(menu.sellingPrice)}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          level === "good"
                            ? "bg-green-100 text-green-700"
                            : level === "warning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {formatPercent(costRate)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        마진: {formatKRW(margin)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMenuId(menu.id);
                        }}
                        className="text-gray-500 hover:text-blue-600 p-1"
                        aria-label={`${menu.name} 레시피 편집`}
                        data-testid={`recipe-edit-${menu.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMenu(menu.id, menu.name);
                        }}
                        className="text-gray-500 hover:text-red-600 p-1"
                        aria-label={`${menu.name} 삭제`}
                        data-testid={`recipe-delete-${menu.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 레시피 상세 */}
                {isExpanded && (
                  <div className="border-t p-4">
                    {menu.recipeItems.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        레시피가 등록되지 않았습니다. 편집 버튼을 눌러 식재료를 추가하세요.
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 border-b">
                            <th className="text-left py-2">식재료</th>
                            <th className="text-right py-2">사용량</th>
                            <th className="text-right py-2">단가</th>
                            <th className="text-right py-2">비용</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menu.recipeItems.map((item) => (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="py-2">{item.ingredient.name}</td>
                              <td className="text-right py-2">
                                {item.quantity}{item.unit}
                              </td>
                              <td className="text-right py-2">
                                {formatKRW(item.ingredient.pricePerUnit)}/{item.ingredient.unit}
                              </td>
                              <td className="text-right py-2 font-medium">
                                {formatKRW(calculateRecipeItemCost({
                                  quantity: item.quantity,
                                  recipeUnit: item.unit,
                                  ingredientUnit: item.ingredient.unit,
                                  pricePerUnit: item.ingredient.pricePerUnit,
                                }))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-semibold">
                            <td colSpan={3} className="py-2 text-right">합계</td>
                            <td className="py-2 text-right">{formatKRW(totalCost)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 레시피 편집 모달 */}
      {editingMenuId && (
        <RecipeEditor
          menuId={editingMenuId}
          ingredients={ingredients}
          onClose={() => setEditingMenuId(null)}
          onSave={handleRecipeSaved}
        />
      )}
    </div>
  );
}
