import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { areUnitsCompatible } from "@/lib/units";
import { z } from "zod";

export const dynamic = "force-dynamic";

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().min(0.001, "사용량은 0보다 커야 합니다."),
  unit: z.string().min(1),
});

const updateRecipeSchema = z.object({
  items: z.array(recipeItemSchema),
});

// GET: 레시피 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const menu = await prisma.menu.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        recipeItems: {
          include: { ingredient: true },
        },
      },
    });

    if (!menu) {
      return NextResponse.json(
        { success: false, error: "메뉴를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: menu.recipeItems });
  } catch (error) {
    console.error("Get recipe error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 레시피 전체 수정 (기존 항목 삭제 후 재생성)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const menu = await prisma.menu.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!menu) {
      return NextResponse.json(
        { success: false, error: "메뉴를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateRecipeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { items } = validation.data;
    const ingredientIds = Array.from(new Set(items.map((item) => item.ingredientId)));
    if (ingredientIds.length !== items.length) {
      return NextResponse.json(
        { success: false, error: "같은 식재료가 중복으로 포함되어 있습니다." },
        { status: 400 }
      );
    }

    const ingredients = await prisma.ingredient.findMany({
      where: {
        id: { in: ingredientIds },
        userId: user.id,
      },
    });
    const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

    for (const item of items) {
      const ingredient = ingredientMap.get(item.ingredientId);
      if (!ingredient) {
        return NextResponse.json(
          { success: false, error: "사용할 수 없는 식재료가 포함되어 있습니다." },
          { status: 400 }
        );
      }
      if (!areUnitsCompatible(item.unit, ingredient.unit)) {
        return NextResponse.json(
          {
            success: false,
            error: `${ingredient.name}은(는) ${ingredient.unit} 기준 단가입니다. ${item.unit} 단위로 저장할 수 없습니다.`,
          },
          { status: 400 }
        );
      }
    }

    // 트랜잭션: 기존 레시피 삭제 + 새 레시피 생성
    await prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({ where: { menuId: params.id } });

      if (items.length > 0) {
        await tx.recipeItem.createMany({
          data: items.map((item) => ({
            menuId: params.id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit,
          })),
        });
      }

      // 메뉴 updatedAt 갱신
      await tx.menu.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      });
    });

    // 업데이트된 레시피 반환
    const updatedRecipe = await prisma.recipeItem.findMany({
      where: { menuId: params.id },
      include: { ingredient: true },
    });

    return NextResponse.json({ success: true, data: updatedRecipe });
  } catch (error) {
    console.error("Update recipe error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
