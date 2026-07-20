export const INGREDIENT_UNITS = [
  "kg",
  "g",
  "L",
  "mL",
  "개",
  "근",
  "단",
  "판",
  "알",
  "팩",
  "통",
  "모",
  "마리",
  "장",
  "봉",
  "병",
  "캔",
  "포기",
  "묶음",
] as const;

type UnitGroup = "mass" | "volume" | "count";

const UNIT_GROUPS: Record<string, UnitGroup> = {
  kg: "mass",
  g: "mass",
  L: "volume",
  mL: "volume",
  개: "count",
  근: "count",
  단: "count",
  판: "count",
  알: "count",
  팩: "count",
  통: "count",
  모: "count",
  마리: "count",
  장: "count",
  봉: "count",
  병: "count",
  캔: "count",
  포기: "count",
  묶음: "count",
};

const TO_BASE_UNIT: Record<string, number> = {
  kg: 1000,
  g: 1,
  L: 1000,
  mL: 1,
  개: 1,
  근: 1,
  단: 1,
  판: 1,
  알: 1,
  팩: 1,
  통: 1,
  모: 1,
  마리: 1,
  장: 1,
  봉: 1,
  병: 1,
  캔: 1,
  포기: 1,
  묶음: 1,
};

export function areUnitsCompatible(fromUnit: string, toUnit: string): boolean {
  if (fromUnit === toUnit) return true;

  const fromGroup = UNIT_GROUPS[fromUnit];
  const toGroup = UNIT_GROUPS[toUnit];
  if (!fromGroup || !toGroup) return false;

  return fromGroup === toGroup && fromGroup !== "count";
}

export function getCompatibleRecipeUnits(ingredientUnit: string): string[] {
  const group = UNIT_GROUPS[ingredientUnit];
  if (group === "mass") return ["g", "kg"];
  if (group === "volume") return ["mL", "L"];
  return INGREDIENT_UNITS.includes(ingredientUnit as (typeof INGREDIENT_UNITS)[number])
    ? [ingredientUnit]
    : [ingredientUnit].filter(Boolean);
}

export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  if (fromUnit === toUnit) return quantity;
  if (!areUnitsCompatible(fromUnit, toUnit)) return null;

  return (quantity * TO_BASE_UNIT[fromUnit]) / TO_BASE_UNIT[toUnit];
}

export function calculateRecipeItemCost({
  quantity,
  recipeUnit,
  ingredientUnit,
  pricePerUnit,
}: {
  quantity: number;
  recipeUnit: string;
  ingredientUnit: string;
  pricePerUnit: number;
}): number {
  const convertedQuantity = convertQuantity(quantity, recipeUnit, ingredientUnit);
  if (convertedQuantity === null) return 0;
  return pricePerUnit * convertedQuantity;
}
