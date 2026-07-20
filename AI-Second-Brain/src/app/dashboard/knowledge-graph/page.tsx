"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { MindMap } from "@/components/MindMap";

export default function KnowledgeGraphPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [viewMode, setViewMode] = useState<"graph" | "mindmap">("graph");
  const [mindmapData, setMindmapData] = useState<{ label: string; children: { label: string; children: { label: string; children: never[] }[] }[] } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/knowledge-graph")
        .then((res) => res.json())
        .then((data) => {
          setGraphData({ nodes: data.nodes, links: data.links });
          setLoading(false);
        })
        .catch(() => setLoading(false));

      fetch("/api/mindmap")
        .then((res) => res.json())
        .then((data) => {
          if (data.mindmap) setMindmapData(data.mindmap);
        })
        .catch(() => {});
    }
  }, [status]);

  if (status === "loading" || !session) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header session={session} />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">지식 그래프</h2>
            <p className="text-sm text-gray-600 mt-1">
              저장한 링크들 사이의 연관 키워드를 분석하여 네트워크 맵으로 시각화합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode("graph")}
                className={`px-3 py-1.5 text-sm ${viewMode === "graph" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                네트워크
              </button>
              <button
                onClick={() => setViewMode("mindmap")}
                className={`px-3 py-1.5 text-sm ${viewMode === "mindmap" ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                마인드맵
              </button>
            </div>
            {viewMode === "graph" && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
            {theme === "dark" ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                라이트 모드
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                다크 모드
              </>
            )}
          </button>
          )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : graphData && graphData.nodes.length > 0 ? (
          <div className="card p-0 overflow-hidden" style={{ height: "calc(100vh - 180px)", minHeight: "700px" }}>
            {viewMode === "graph" ? (
              <KnowledgeGraph nodes={graphData.nodes} links={graphData.links} theme={theme} />
            ) : mindmapData ? (
              <MindMap data={mindmapData} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                마인드맵을 생성하려면 북마크를 추가해주세요.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p>지식 그래프를 생성하려면 먼저 북마크를 추가해주세요.</p>
          </div>
        )}
      </main>
    </div>
  );
}

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
