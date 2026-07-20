import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

const menuSchema = z.object({
  name: z.string().min(1, "메뉴명을 입력해주세요."),
  category: z.string().min(1, "카테고리를 입력해주세요."),
  sellingPrice: z.number().min(0, "판매가는 0 이상이어야 합니다."),
});

// GET: 메뉴 목록 조회
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
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: menus });
  } catch (error) {
    console.error("Get menus error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 메뉴 생성
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
    const validation = menuSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, category, sellingPrice } = validation.data;

    const menu = await prisma.menu.create({
      data: {
        userId: user.id,
        name,
        category,
        sellingPrice,
      },
      include: {
        recipeItems: {
          include: { ingredient: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: menu }, { status: 201 });
  } catch (error) {
    console.error("Create menu error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
