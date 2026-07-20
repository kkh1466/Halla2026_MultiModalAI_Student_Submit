// 식재료 타입
export interface Ingredient {
  id: string;
  userId: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 식재료 단가 변동 이력
export interface IngredientPriceHistory {
  id: string;
  ingredientId: string;
  price: number;
  changedAt: Date;
}

// 메뉴 타입
export interface Menu {
  id: string;
  userId: string;
  name: string;
  category: string;
  sellingPrice: number;
  createdAt: Date;
  updatedAt: Date;
  recipeItems?: RecipeItem[];
}

// 레시피 항목 타입
export interface RecipeItem {
  id: string;
  menuId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient?: Ingredient;
}

// 원가 계산 결과
export interface CostResult {
  menuId: string;
  menuName: string;
  category: string;
  totalCost: number;
  sellingPrice: number;
  costRate: number;
  margin: number;
  items: CostItemDetail[];
}

// 원가 항목 상세
export interface CostItemDetail {
  ingredientName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  itemCost: number;
}

// 대시보드 요약
export interface DashboardSummary {
  totalMenus: number;
  averageCostRate: number;
  highCostMenus: { id: string; name: string; costRate: number }[];
  recentMenus: { id: string; name: string; updatedAt: Date }[];
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
