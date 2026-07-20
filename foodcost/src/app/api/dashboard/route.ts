import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { calculateRecipeItemCost } from "@/lib/units";

export const dynamic = "force-dynamic";

// GET: 대시보드 요약 데이터
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 전체 메뉴 (레시피 포함)
    const menus = await prisma.menu.findMany({
      where: { userId: user.id },
      include: {
        recipeItems: {
          include: { ingredient: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 각 메뉴의 원가 계산
    const menuCosts = menus.map((menu) => {
      const totalCost = menu.recipeItems.reduce((sum, item) => {
        return sum + calculateRecipeItemCost({
          quantity: item.quantity,
          recipeUnit: item.unit,
          ingredientUnit: item.ingredient.unit,
          pricePerUnit: item.ingredient.pricePerUnit,
        });
      }, 0);
      const costRate =
        menu.sellingPrice > 0 ? (totalCost / menu.sellingPrice) * 100 : 0;

      return {
        id: menu.id,
        name: menu.name,
        category: menu.category,
        totalCost,
        sellingPrice: menu.sellingPrice,
        costRate,
        updatedAt: menu.updatedAt,
      };
    });

    // 평균 원가율 (판매가가 설정된 메뉴만)
    const menusWithPrice = menuCosts.filter((m) => m.sellingPrice > 0);
    const averageCostRate =
      menusWithPrice.length > 0
        ? menusWithPrice.reduce((sum, m) => sum + m.costRate, 0) / menusWithPrice.length
        : 0;

    // 원가율 30% 초과 메뉴
    const highCostMenus = menuCosts
      .filter((m) => m.costRate > 30)
      .sort((a, b) => b.costRate - a.costRate)
      .slice(0, 5);

    // 최근 수정된 메뉴 (최대 5개)
    const recentMenus = menuCosts.slice(0, 5);

    // 식재료 수
    const ingredientCount = await prisma.ingredient.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalMenus: menus.length,
        totalIngredients: ingredientCount,
        averageCostRate,
        highCostMenus,
        recentMenus,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
