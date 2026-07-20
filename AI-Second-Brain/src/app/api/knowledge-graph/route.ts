import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface GraphNode {
  id: string;
  label: string;
  type: "bookmark" | "keyword";
  category?: string;
  url?: string;
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

// GET: 지식 그래프 데이터 (노드 + 엣지)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id, status: "completed" },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 100, // 최근 100개 북마크로 제한
  });

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const keywordNodeMap = new Map<string, string>(); // keyword → nodeId

  // 북마크 노드 생성
  for (const bookmark of bookmarks) {
    const nodeId = `b_${bookmark.id}`;
    nodes.push({
      id: nodeId,
      label: bookmark.title || bookmark.url,
      type: "bookmark",
      category: bookmark.category?.name,
      url: bookmark.url,
    });

    // 키워드 추출 및 연결
    if (bookmark.keywords) {
      const keywords = bookmark.keywords.split(",").map((k) => k.trim()).filter(Boolean);

      for (const keyword of keywords) {
        let keywordNodeId = keywordNodeMap.get(keyword);

        if (!keywordNodeId) {
          keywordNodeId = `k_${keyword}`;
          keywordNodeMap.set(keyword, keywordNodeId);
          nodes.push({
            id: keywordNodeId,
            label: keyword,
            type: "keyword",
          });
        }

        // 북마크 → 키워드 연결
        links.push({
          source: nodeId,
          target: keywordNodeId,
          strength: 1,
        });
      }
    }
  }

  // 같은 키워드를 공유하는 북마크들 간 간접 연결 강도 계산
  // (이미 keyword 노드를 통해 연결되므로 별도 처리 불필요)

  return NextResponse.json({
    nodes,
    links,
    stats: {
      totalBookmarks: bookmarks.length,
      totalKeywords: keywordNodeMap.size,
      totalLinks: links.length,
    },
  });
}
