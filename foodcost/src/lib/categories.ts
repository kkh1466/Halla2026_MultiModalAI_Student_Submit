export const INGREDIENT_CATEGORIES = [
  "육류",
  "가금류",
  "해산물",
  "채소",
  "버섯류",
  "과일",
  "유제품",
  "계란/난류",
  "두부/콩류",
  "곡류/쌀",
  "면/떡/빵",
  "양념/소스",
  "유지류",
  "음료/베이스",
  "가공식품",
  "기타",
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

const CATEGORY_ALIASES: Record<string, IngredientCategory> = {
  곡류: "곡류/쌀",
  난류: "계란/난류",
  계란: "계란/난류",
  두부류: "두부/콩류",
  콩류: "두부/콩류",
  유지: "유지류",
  음료: "음료/베이스",
  베이스: "음료/베이스",
  가공품: "가공식품",
};

export function normalizeIngredientCategory(
  category: string | null | undefined
): IngredientCategory | null {
  if (!category) return null;

  const trimmed = category.trim();
  if (!trimmed) return null;

  if (INGREDIENT_CATEGORIES.includes(trimmed as IngredientCategory)) {
    return trimmed as IngredientCategory;
  }

  return CATEGORY_ALIASES[trimmed] ?? null;
}
