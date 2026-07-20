import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ingredientsData = [
  { name: "쌀", unit: "g", pricePerUnit: 3, category: "곡류/쌀" },
  { name: "돼지고기 앞다리살", unit: "g", pricePerUnit: 13, category: "육류" },
  { name: "돼지고기 목살", unit: "g", pricePerUnit: 16, category: "육류" },
  { name: "소고기 불고기용", unit: "g", pricePerUnit: 28, category: "육류" },
  { name: "닭다리살", unit: "g", pricePerUnit: 12, category: "가금류" },
  { name: "고등어", unit: "마리", pricePerUnit: 2400, category: "해산물" },
  { name: "오징어", unit: "g", pricePerUnit: 18, category: "해산물" },
  { name: "멸치", unit: "g", pricePerUnit: 20, category: "해산물" },
  { name: "김치", unit: "g", pricePerUnit: 8, category: "채소" },
  { name: "두부", unit: "모", pricePerUnit: 1800, category: "두부/콩류" },
  { name: "계란", unit: "개", pricePerUnit: 320, category: "계란/난류" },
  { name: "콩나물", unit: "g", pricePerUnit: 4, category: "채소" },
  { name: "시금치", unit: "g", pricePerUnit: 10, category: "채소" },
  { name: "양파", unit: "g", pricePerUnit: 2, category: "채소" },
  { name: "대파", unit: "g", pricePerUnit: 5, category: "채소" },
  { name: "마늘", unit: "g", pricePerUnit: 12, category: "채소" },
  { name: "청양고추", unit: "g", pricePerUnit: 8, category: "채소" },
  { name: "무", unit: "g", pricePerUnit: 2, category: "채소" },
  { name: "애호박", unit: "g", pricePerUnit: 5, category: "채소" },
  { name: "감자", unit: "g", pricePerUnit: 4, category: "채소" },
  { name: "당근", unit: "g", pricePerUnit: 4, category: "채소" },
  { name: "양배추", unit: "g", pricePerUnit: 3, category: "채소" },
  { name: "상추", unit: "g", pricePerUnit: 12, category: "채소" },
  { name: "깻잎", unit: "장", pricePerUnit: 35, category: "채소" },
  { name: "표고버섯", unit: "g", pricePerUnit: 18, category: "버섯류" },
  { name: "팽이버섯", unit: "팩", pricePerUnit: 900, category: "버섯류" },
  { name: "된장", unit: "g", pricePerUnit: 7, category: "양념/소스" },
  { name: "고추장", unit: "g", pricePerUnit: 8, category: "양념/소스" },
  { name: "고춧가루", unit: "g", pricePerUnit: 25, category: "양념/소스" },
  { name: "간장", unit: "mL", pricePerUnit: 5, category: "양념/소스" },
  { name: "설탕", unit: "g", pricePerUnit: 3, category: "양념/소스" },
  { name: "소금", unit: "g", pricePerUnit: 1, category: "양념/소스" },
  { name: "후추", unit: "g", pricePerUnit: 30, category: "양념/소스" },
  { name: "참기름", unit: "mL", pricePerUnit: 22, category: "유지류" },
  { name: "식용유", unit: "mL", pricePerUnit: 4, category: "유지류" },
  { name: "들기름", unit: "mL", pricePerUnit: 25, category: "유지류" },
  { name: "물엿", unit: "g", pricePerUnit: 4, category: "양념/소스" },
  { name: "맛술", unit: "mL", pricePerUnit: 5, category: "양념/소스" },
  { name: "다시다", unit: "g", pricePerUnit: 18, category: "양념/소스" },
  { name: "김", unit: "장", pricePerUnit: 120, category: "해산물" },
  { name: "어묵", unit: "g", pricePerUnit: 8, category: "가공식품" },
] as const;

const menusData = [
  {
    name: "제육볶음 백반",
    category: "한식",
    sellingPrice: 9000,
    items: [
      { ingredient: "쌀", quantity: 200, unit: "g" },
      { ingredient: "돼지고기 앞다리살", quantity: 180, unit: "g" },
      { ingredient: "양파", quantity: 60, unit: "g" },
      { ingredient: "대파", quantity: 25, unit: "g" },
      { ingredient: "고추장", quantity: 25, unit: "g" },
      { ingredient: "고춧가루", quantity: 8, unit: "g" },
      { ingredient: "간장", quantity: 15, unit: "mL" },
      { ingredient: "설탕", quantity: 8, unit: "g" },
      { ingredient: "마늘", quantity: 8, unit: "g" },
      { ingredient: "식용유", quantity: 8, unit: "mL" },
    ],
  },
  {
    name: "김치찌개 백반",
    category: "한식",
    sellingPrice: 8500,
    items: [
      { ingredient: "쌀", quantity: 200, unit: "g" },
      { ingredient: "김치", quantity: 180, unit: "g" },
      { ingredient: "돼지고기 목살", quantity: 90, unit: "g" },
      { ingredient: "두부", quantity: 0.25, unit: "모" },
      { ingredient: "대파", quantity: 20, unit: "g" },
      { ingredient: "마늘", quantity: 6, unit: "g" },
      { ingredient: "고춧가루", quantity: 5, unit: "g" },
      { ingredient: "간장", quantity: 8, unit: "mL" },
    ],
  },
  {
    name: "된장찌개 백반",
    category: "한식",
    sellingPrice: 8000,
    items: [
      { ingredient: "쌀", quantity: 200, unit: "g" },
      { ingredient: "된장", quantity: 35, unit: "g" },
      { ingredient: "두부", quantity: 0.2, unit: "모" },
      { ingredient: "애호박", quantity: 60, unit: "g" },
      { ingredient: "양파", quantity: 50, unit: "g" },
      { ingredient: "팽이버섯", quantity: 0.25, unit: "팩" },
      { ingredient: "대파", quantity: 15, unit: "g" },
      { ingredient: "청양고추", quantity: 8, unit: "g" },
      { ingredient: "멸치", quantity: 10, unit: "g" },
    ],
  },
  {
    name: "고등어구이 백반",
    category: "한식",
    sellingPrice: 9500,
    items: [
      { ingredient: "쌀", quantity: 200, unit: "g" },
      { ingredient: "고등어", quantity: 1, unit: "마리" },
      { ingredient: "소금", quantity: 3, unit: "g" },
      { ingredient: "식용유", quantity: 5, unit: "mL" },
      { ingredient: "무", quantity: 40, unit: "g" },
      { ingredient: "김", quantity: 2, unit: "장" },
    ],
  },
  {
    name: "오징어볶음 백반",
    category: "한식",
    sellingPrice: 9500,
    items: [
      { ingredient: "쌀", quantity: 200, unit: "g" },
      { ingredient: "오징어", quantity: 150, unit: "g" },
      { ingredient: "양파", quantity: 70, unit: "g" },
      { ingredient: "양배추", quantity: 60, unit: "g" },
      { ingredient: "대파", quantity: 20, unit: "g" },
      { ingredient: "고추장", quantity: 20, unit: "g" },
      { ingredient: "고춧가루", quantity: 10, unit: "g" },
      { ingredient: "간장", quantity: 12, unit: "mL" },
      { ingredient: "마늘", quantity: 8, unit: "g" },
      { ingredient: "참기름", quantity: 3, unit: "mL" },
    ],
  },
  {
    name: "뚝배기불고기",
    category: "한식",
    sellingPrice: 10000,
    items: [
      { ingredient: "쌀", quantity: 200, unit: "g" },
      { ingredient: "소고기 불고기용", quantity: 130, unit: "g" },
      { ingredient: "양파", quantity: 60, unit: "g" },
      { ingredient: "대파", quantity: 20, unit: "g" },
      { ingredient: "표고버섯", quantity: 25, unit: "g" },
      { ingredient: "팽이버섯", quantity: 0.2, unit: "팩" },
      { ingredient: "간장", quantity: 25, unit: "mL" },
      { ingredient: "설탕", quantity: 10, unit: "g" },
      { ingredient: "맛술", quantity: 10, unit: "mL" },
      { ingredient: "마늘", quantity: 8, unit: "g" },
    ],
  },
  {
    name: "닭볶음탕 백반",
    category: "한식",
    sellingPrice: 9500,
    items: [
      { ingredient: "쌀", quantity: 200, unit: "g" },
      { ingredient: "닭다리살", quantity: 180, unit: "g" },
      { ingredient: "감자", quantity: 90, unit: "g" },
      { ingredient: "당근", quantity: 30, unit: "g" },
      { ingredient: "양파", quantity: 60, unit: "g" },
      { ingredient: "대파", quantity: 20, unit: "g" },
      { ingredient: "고추장", quantity: 20, unit: "g" },
      { ingredient: "고춧가루", quantity: 8, unit: "g" },
      { ingredient: "간장", quantity: 20, unit: "mL" },
      { ingredient: "마늘", quantity: 8, unit: "g" },
    ],
  },
  {
    name: "계란말이 백반",
    category: "한식",
    sellingPrice: 7500,
    items: [
      { ingredient: "쌀", quantity: 200, unit: "g" },
      { ingredient: "계란", quantity: 3, unit: "개" },
      { ingredient: "대파", quantity: 10, unit: "g" },
      { ingredient: "당근", quantity: 15, unit: "g" },
      { ingredient: "소금", quantity: 2, unit: "g" },
      { ingredient: "식용유", quantity: 8, unit: "mL" },
      { ingredient: "김치", quantity: 60, unit: "g" },
    ],
  },
  {
    name: "순두부찌개 백반",
    category: "한식",
    sellingPrice: 8500,
    items: [
      { ingredient: "쌀", quantity: 200, unit: "g" },
      { ingredient: "두부", quantity: 0.5, unit: "모" },
      { ingredient: "계란", quantity: 1, unit: "개" },
      { ingredient: "돼지고기 앞다리살", quantity: 50, unit: "g" },
      { ingredient: "대파", quantity: 20, unit: "g" },
      { ingredient: "청양고추", quantity: 8, unit: "g" },
      { ingredient: "고춧가루", quantity: 10, unit: "g" },
      { ingredient: "간장", quantity: 8, unit: "mL" },
      { ingredient: "마늘", quantity: 6, unit: "g" },
    ],
  },
  {
    name: "어묵볶음 도시락",
    category: "한식",
    sellingPrice: 7500,
    items: [
      { ingredient: "쌀", quantity: 200, unit: "g" },
      { ingredient: "어묵", quantity: 120, unit: "g" },
      { ingredient: "양파", quantity: 40, unit: "g" },
      { ingredient: "당근", quantity: 20, unit: "g" },
      { ingredient: "대파", quantity: 10, unit: "g" },
      { ingredient: "간장", quantity: 15, unit: "mL" },
      { ingredient: "설탕", quantity: 6, unit: "g" },
      { ingredient: "식용유", quantity: 6, unit: "mL" },
      { ingredient: "참기름", quantity: 2, unit: "mL" },
    ],
  },
] as const;

async function upsertIngredient(userId: string, data: (typeof ingredientsData)[number]) {
  const existing = await prisma.ingredient.findFirst({
    where: { userId, name: data.name },
  });

  if (existing) {
    const priceChanged = existing.pricePerUnit !== data.pricePerUnit;
    const ingredient = await prisma.ingredient.update({
      where: { id: existing.id },
      data: {
        unit: data.unit,
        pricePerUnit: data.pricePerUnit,
        category: data.category,
      },
    });

    if (priceChanged) {
      await prisma.ingredientPriceHistory.create({
        data: { ingredientId: ingredient.id, price: data.pricePerUnit },
      });
    }

    return ingredient;
  }

  const ingredient = await prisma.ingredient.create({
    data: { userId, ...data },
  });

  await prisma.ingredientPriceHistory.create({
    data: { ingredientId: ingredient.id, price: data.pricePerUnit },
  });

  return ingredient;
}

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    throw new Error("사용자가 없습니다. 먼저 회원가입 또는 기본 seed를 실행해주세요.");
  }

  const ingredientIds = new Map<string, string>();
  for (const ingredientData of ingredientsData) {
    const ingredient = await upsertIngredient(user.id, ingredientData);
    ingredientIds.set(ingredient.name, ingredient.id);
  }

  for (const menuData of menusData) {
    let menu = await prisma.menu.findFirst({
      where: { userId: user.id, name: menuData.name },
    });

    if (menu) {
      menu = await prisma.menu.update({
        where: { id: menu.id },
        data: {
          category: menuData.category,
          sellingPrice: menuData.sellingPrice,
        },
      });
    } else {
      menu = await prisma.menu.create({
        data: {
          userId: user.id,
          name: menuData.name,
          category: menuData.category,
          sellingPrice: menuData.sellingPrice,
        },
      });
    }

    await prisma.recipeItem.deleteMany({ where: { menuId: menu.id } });

    await prisma.recipeItem.createMany({
      data: menuData.items.map((item) => {
        const ingredientId = ingredientIds.get(item.ingredient);
        if (!ingredientId) {
          throw new Error(`식재료를 찾을 수 없습니다: ${item.ingredient}`);
        }
        return {
          menuId: menu.id,
          ingredientId,
          quantity: item.quantity,
          unit: item.unit,
        };
      }),
    });
  }

  console.log(`백반집 샘플 데이터 입력 완료: ${ingredientsData.length}개 식재료, ${menusData.length}개 메뉴`);
  console.log(`대상 사용자: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
