import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkYouTubePlaylists } from "@/lib/youtube";

// POST: YouTube 재생목록 동기화
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 사용자의 access_token 가져오기
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "YouTube 연동이 필요합니다. 다시 로그인해주세요." },
      { status: 401 }
    );
  }

  try {
    const newVideos = await checkYouTubePlaylists(session.user.id, account.access_token);

    return NextResponse.json({
      videos: newVideos,
      count: newVideos.length,
      message: newVideos.length > 0
        ? `${newVideos.length}개의 새 영상이 발견되었습니다.`
        : "새로운 영상이 없습니다.",
    });
  } catch (error) {
    console.error("YouTube sync error:", error);
    return NextResponse.json(
      { error: "YouTube 동기화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
