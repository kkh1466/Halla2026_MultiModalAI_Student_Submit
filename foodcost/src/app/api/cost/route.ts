import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { calculateRecipeItemCost } from "@/lib/units";

export const dynamic = "force-dynamic";

// GET: 전체 메뉴 원가 목록
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const menus = await prisma.menu.findMany({
      where: { userId: user.id },
      include: {
        recipeItems: {
          include: { ingredient: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const costResults = menus.map((menu) => {
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
      const margin = menu.sellingPrice - totalCost;

      return {
        menuId: menu.id,
        menuName: menu.name,
        category: menu.category,
        totalCost,
        sellingPrice: menu.sellingPrice,
        costRate,
        margin,
        items: menu.recipeItems.map((item) => {
          const itemCost = calculateRecipeItemCost({
            quantity: item.quantity,
            recipeUnit: item.unit,
            ingredientUnit: item.ingredient.unit,
            pricePerUnit: item.ingredient.pricePerUnit,
          });
          return {
            ingredientName: item.ingredient.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.ingredient.pricePerUnit,
            itemCost,
          };
        }),
      };
    });

    return NextResponse.json({ success: true, data: costResults });
  } catch (error) {
    console.error("Get cost error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
