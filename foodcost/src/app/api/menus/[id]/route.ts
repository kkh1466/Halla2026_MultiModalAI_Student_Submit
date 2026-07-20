import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateMenuSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  sellingPrice: z.number().min(0).optional(),
});

// GET: 메뉴 상세 조회
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

    return NextResponse.json({ success: true, data: menu });
  } catch (error) {
    console.error("Get menu error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 메뉴 수정
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

    const existing = await prisma.menu.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "메뉴를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateMenuSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const menu = await prisma.menu.update({
      where: { id: params.id },
      data: validation.data,
      include: {
        recipeItems: {
          include: { ingredient: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: menu });
  } catch (error) {
    console.error("Update menu error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 메뉴 삭제
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

    const existing = await prisma.menu.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "메뉴를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await prisma.menu.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete menu error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
