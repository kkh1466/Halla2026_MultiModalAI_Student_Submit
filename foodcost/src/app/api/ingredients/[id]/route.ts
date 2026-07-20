import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { normalizeIngredientCategory } from "@/lib/categories";
import { areUnitsCompatible } from "@/lib/units";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  pricePerUnit: z.number().min(0).optional(),
  category: z.string().optional(),
});

// PUT: 식재료 수정
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

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: params.id, userId: user.id },
      include: { recipeItems: true },
    });

    if (!ingredient) {
      return NextResponse.json(
        { success: false, error: "식재료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData = {
      ...data,
      ...(data.category !== undefined
        ? { category: normalizeIngredientCategory(data.category) }
        : {}),
    };

    if (
      data.unit !== undefined &&
      data.unit !== ingredient.unit &&
      ingredient.recipeItems.some((item) => !areUnitsCompatible(item.unit, data.unit!))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "이 식재료를 사용하는 레시피와 호환되지 않는 단위입니다. 먼저 레시피 단위를 정리해주세요.",
        },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 단가가 변경된 경우 이력 기록
      if (data.pricePerUnit !== undefined && data.pricePerUnit !== ingredient.pricePerUnit) {
        await tx.ingredientPriceHistory.create({
          data: {
            ingredientId: ingredient.id,
            price: data.pricePerUnit,
          },
        });
      }

      return tx.ingredient.update({
        where: { id: params.id },
        data: updateData,
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update ingredient error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 식재료 삭제
export async function DELETE(
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

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: params.id, userId: user.id },
      include: { recipeItems: true },
    });

    if (!ingredient) {
      return NextResponse.json(
        { success: false, error: "식재료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (ingredient.recipeItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `이 식재료를 사용하는 레시피가 ${ingredient.recipeItems.length}개 있습니다. 먼저 레시피에서 제거해주세요.`,
        },
        { status: 409 }
      );
    }

    await prisma.ingredient.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete ingredient error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
