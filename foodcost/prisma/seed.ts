import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 데모 사용자 생성
  const password = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@foodcost.kr" },
    update: {},
    create: {
      email: "demo@foodcost.kr",
      password,
      name: "데모 사장님",
      provider: "credentials",
    },
  });

  console.log("✅ 데모 사용자 생성:", user.email);

  // 식재료 데이터
  const ingredientsData = [
    { name: "돼지고기 삼겹살", unit: "g", pricePerUnit: 18, category: "육류" },
    { name: "돼지고기 목살", unit: "g", pricePerUnit: 16, category: "육류" },
    { name: "닭가슴살", unit: "g", pricePerUnit: 10, category: "가금류" },
    { name: "쌀", unit: "g", pricePerUnit: 3, category: "곡류/쌀" },
    { name: "양파", unit: "g", pricePerUnit: 2, category: "채소" },
    { name: "대파", unit: "g", pricePerUnit: 5, category: "채소" },
    { name: "마늘", unit: "g", pricePerUnit: 12, category: "채소" },
    { name: "고춧가루", unit: "g", pricePerUnit: 25, category: "양념/소스" },
    { name: "간장", unit: "mL", pricePerUnit: 5, category: "양념/소스" },
    { name: "설탕", unit: "g", pricePerUnit: 3, category: "양념/소스" },
    { name: "참기름", unit: "mL", pricePerUnit: 20, category: "유지류" },
    { name: "김치", unit: "g", pricePerUnit: 8, category: "채소" },
    { name: "두부", unit: "g", pricePerUnit: 4, category: "두부/콩류" },
    { name: "계란", unit: "개", pricePerUnit: 300, category: "계란/난류" },
    { name: "새우", unit: "g", pricePerUnit: 30, category: "해산물" },
  ];

  const ingredients: Record<string, string> = {};
  for (const data of ingredientsData) {
    const ingredient = await prisma.ingredient.upsert({
      where: {
        id: `seed-${data.name}`,
      },
      update: { pricePerUnit: data.pricePerUnit },
      create: {
        id: `seed-${data.name}`,
        userId: user.id,
        ...data,
      },
    });
    ingredients[data.name] = ingredient.id;

    await prisma.ingredientPriceHistory.create({
      data: {
        ingredientId: ingredient.id,
        price: data.pricePerUnit,
      },
    });
  }

  console.log("✅ 식재료 15개 생성 완료");

  // 메뉴 + 레시피 데이터
  const menusData = [
    {
      name: "삼겹살 정식",
      category: "한식",
      sellingPrice: 12000,
      items: [
        { ingredient: "돼지고기 삼겹살", quantity: 200, unit: "g" },
        { ingredient: "쌀", quantity: 200, unit: "g" },
        { ingredient: "양파", quantity: 50, unit: "g" },
        { ingredient: "대파", quantity: 20, unit: "g" },
        { ingredient: "마늘", quantity: 10, unit: "g" },
        { ingredient: "김치", quantity: 80, unit: "g" },
      ],
    },
    {
      name: "김치찌개",
      category: "한식",
      sellingPrice: 8000,
      items: [
        { ingredient: "돼지고기 목살", quantity: 100, unit: "g" },
        { ingredient: "김치", quantity: 150, unit: "g" },
        { ingredient: "두부", quantity: 100, unit: "g" },
        { ingredient: "대파", quantity: 15, unit: "g" },
        { ingredient: "마늘", quantity: 5, unit: "g" },
        { ingredient: "고춧가루", quantity: 5, unit: "g" },
      ],
    },
    {
      name: "닭가슴살 샐러드",
      category: "양식",
      sellingPrice: 9000,
      items: [
        { ingredient: "닭가슴살", quantity: 150, unit: "g" },
        { ingredient: "양파", quantity: 30, unit: "g" },
        { ingredient: "계란", quantity: 1, unit: "개" },
      ],
    },
    {
      name: "새우볶음밥",
      category: "중식",
      sellingPrice: 9500,
      items: [
        { ingredient: "새우", quantity: 80, unit: "g" },
        { ingredient: "쌀", quantity: 250, unit: "g" },
        { ingredient: "계란", quantity: 2, unit: "개" },
        { ingredient: "양파", quantity: 40, unit: "g" },
        { ingredient: "대파", quantity: 10, unit: "g" },
        { ingredient: "간장", quantity: 10, unit: "mL" },
        { ingredient: "참기름", quantity: 5, unit: "mL" },
      ],
    },
    {
      name: "제육볶음 정식",
      category: "한식",
      sellingPrice: 10000,
      items: [
        { ingredient: "돼지고기 목살", quantity: 180, unit: "g" },
        { ingredient: "쌀", quantity: 200, unit: "g" },
        { ingredient: "양파", quantity: 60, unit: "g" },
        { ingredient: "대파", quantity: 15, unit: "g" },
        { ingredient: "마늘", quantity: 10, unit: "g" },
        { ingredient: "고춧가루", quantity: 8, unit: "g" },
        { ingredient: "간장", quantity: 15, unit: "mL" },
        { ingredient: "설탕", quantity: 10, unit: "g" },
      ],
    },
  ];

  for (const menuData of menusData) {
    const menu = await prisma.menu.create({
      data: {
        userId: user.id,
        name: menuData.name,
        category: menuData.category,
        sellingPrice: menuData.sellingPrice,
      },
    });

    for (const item of menuData.items) {
      await prisma.recipeItem.create({
        data: {
          menuId: menu.id,
          ingredientId: ingredients[item.ingredient],
          quantity: item.quantity,
          unit: item.unit,
        },
      });
    }
  }

  console.log("✅ 메뉴 5개 + 레시피 생성 완료");
  console.log("");
  console.log("🎉 데모 데이터 시드 완료!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  📧 이메일: demo@foodcost.kr");
  console.log("  🔑 비밀번호: demo1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
