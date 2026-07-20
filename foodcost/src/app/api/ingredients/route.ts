import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { normalizeIngredientCategory } from "@/lib/categories";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ingredientSchema = z.object({
  name: z.string().min(1, "식재료명을 입력해주세요."),
  unit: z.string().min(1, "단위를 입력해주세요."),
  pricePerUnit: z.number().min(0, "단가는 0 이상이어야 합니다."),
  category: z.string().optional(),
});

// GET: 식재료 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = normalizeIngredientCategory(searchParams.get("category"));

    const where: Record<string, unknown> = { userId: user.id };

    if (search) {
      where.name = { contains: search };
    }
    if (category) {
      where.category = category;
    }

    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: ingredients });
  } catch (error) {
    console.error("Get ingredients error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 식재료 등록
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
    const validation = ingredientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, unit, pricePerUnit, category } = validation.data;
    const normalizedCategory = normalizeIngredientCategory(category);

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
      { success: true, data: ingredient },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create ingredient error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
