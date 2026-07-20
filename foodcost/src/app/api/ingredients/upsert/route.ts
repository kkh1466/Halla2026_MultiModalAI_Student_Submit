import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { normalizeIngredientCategory } from "@/lib/categories";
import { areUnitsCompatible } from "@/lib/units";
import { z } from "zod";

export const dynamic = "force-dynamic";

const upsertSchema = z.object({
  name: z.string().min(1, "식재료명을 입력해주세요."),
  unit: z.string().min(1, "단위를 입력해주세요."),
  pricePerUnit: z.number().min(0, "단가는 0 이상이어야 합니다."),
  category: z.string().optional(),
});

// POST: 식재료 upsert (같은 이름이면 단가 업데이트, 없으면 새로 생성)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = upsertSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, unit, pricePerUnit, category } = validation.data;
    const normalizedCategory = normalizeIngredientCategory(category);

    // 같은 사용자의 같은 이름 식재료 검색
    const existing = await prisma.ingredient.findFirst({
      where: { userId: user.id, name },
      include: { recipeItems: true },
    });

    if (existing) {
      const nextCategory = normalizedCategory ?? existing.category;
      const priceChanged = existing.pricePerUnit !== pricePerUnit;
      const unitChanged = existing.unit !== unit;
      const categoryChanged = existing.category !== nextCategory;

      if (
        unitChanged &&
        existing.recipeItems.some((item) => !areUnitsCompatible(item.unit, unit))
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `${existing.name}은(는) 기존 레시피와 호환되지 않는 단위로 변경할 수 없습니다.`,
          },
          { status: 409 }
        );
      }

      if (!priceChanged && !unitChanged && !categoryChanged) {
        // 변경 없음
        return NextResponse.json({
          success: true,
          data: existing,
          action: "unchanged",
        });
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (priceChanged) {
          await tx.ingredientPriceHistory.create({
            data: {
              ingredientId: existing.id,
              price: pricePerUnit,
            },
          });
        }

        return tx.ingredient.update({
          where: { id: existing.id },
          data: {
            pricePerUnit,
            unit,
            category: nextCategory,
          },
        });
      });

      return NextResponse.json({
        success: true,
        data: updated,
        action: "updated",
      });
    }

    // 새 식재료 생성
    const ingredient = await prisma.ingredient.create({
      data: {
        userId: user.id,
        name,
        unit,
        pricePerUnit,
        category: normalizedCategory,
      },
    });

    // 초기 가격 이력 기록
    await prisma.ingredientPriceHistory.create({
      data: {
        ingredientId: ingredient.id,
        price: pricePerUnit,
      },
    });

    return NextResponse.json(
      { success: true, data: ingredient, action: "created" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upsert ingredient error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
