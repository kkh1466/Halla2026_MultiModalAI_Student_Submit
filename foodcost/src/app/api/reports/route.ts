import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { calculateRecipeItemCost } from "@/lib/units";

export const dynamic = "force-dynamic";

// GET: 리포트 데이터 (원가율 순위 + 식재료 비용 비중)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 전체 메뉴 + 레시피
    const menus = await prisma.menu.findMany({
      where: { userId: user.id },
      include: {
        recipeItems: {
          include: { ingredient: true },
        },
      },
    });

    // 메뉴별 원가율 순위 (높은 순)
    const costRanking = menus
      .map((menu) => {
        const totalCost = menu.recipeItems.reduce(
          (sum, item) => sum + calculateRecipeItemCost({
            quantity: item.quantity,
            recipeUnit: item.unit,
            ingredientUnit: item.ingredient.unit,
            pricePerUnit: item.ingredient.pricePerUnit,
          }),
          0
        );
        const costRate =
          menu.sellingPrice > 0 ? (totalCost / menu.sellingPrice) * 100 : 0;
        return {
          menuName: menu.name,
          category: menu.category,
          totalCost,
          sellingPrice: menu.sellingPrice,
          costRate,
        };
      })
      .sort((a, b) => b.costRate - a.costRate);

    // 식재료별 총 비용 집계 (파이차트용)
    const ingredientCostMap: Record<string, number> = {};
    menus.forEach((menu) => {
      menu.recipeItems.forEach((item) => {
        const cost = calculateRecipeItemCost({
          quantity: item.quantity,
          recipeUnit: item.unit,
          ingredientUnit: item.ingredient.unit,
          pricePerUnit: item.ingredient.pricePerUnit,
        });
        const name = item.ingredient.name;
        ingredientCostMap[name] = (ingredientCostMap[name] || 0) + cost;
      });
    });

    const ingredientRatio = Object.entries(ingredientCostMap)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10); // 상위 10개

    // 월별 평균 원가율 추이 (식재료 단가 이력 기반)
    const priceHistory = await prisma.ingredientPriceHistory.findMany({
      where: {
        ingredient: { userId: user.id },
      },
      include: { ingredient: true },
      orderBy: { changedAt: "asc" },
    });

    // 월별 그룹화
    const monthlyMap: Record<string, { totalPrice: number; count: number }> = {};
    priceHistory.forEach((record) => {
      const month = record.changedAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap[month]) {
        monthlyMap[month] = { totalPrice: 0, count: 0 };
      }
      monthlyMap[month].totalPrice += record.price;
      monthlyMap[month].count += 1;
    });

    const monthlyTrend = Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month,
        avgPrice: data.totalPrice / data.count,
        changeCount: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      success: true,
      data: {
        costRanking,
        ingredientRatio,
        monthlyTrend,
      },
    });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
