import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET: 식재료 단가 변동 이력
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

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!ingredient) {
      return NextResponse.json(
        { success: false, error: "식재료를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const history = await prisma.ingredientPriceHistory.findMany({
      where: { ingredientId: params.id },
      orderBy: { changedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error("Get price history error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
