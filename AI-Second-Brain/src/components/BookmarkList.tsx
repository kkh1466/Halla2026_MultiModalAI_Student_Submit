"use client";

import { useEffect, useState } from "react";
import { BookmarkCard } from "./BookmarkCard";

interface Bookmark {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  summary: string | null;
  tags: string | null;
  questions: string | null;
  keywords: string | null;
  source: string;
  status: string;
  isImportant: boolean;
  createdAt: string;
  category: { id: string; name: string; color: string } | null;
}

interface BookmarkListProps {
  categoryId: string | null;
  refreshKey: number;
  onRefresh?: () => void;
}

export function BookmarkList({ categoryId, refreshKey, onRefresh }: BookmarkListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportCategories, setReportCategories] = useState<string[]>([]);
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: "completed" });
    if (categoryId) params.set("category", categoryId);

    // completed 북마크와 pending 북마크를 병렬로 가져옴
    const pendingParams = new URLSearchParams({ status: "pending" });

    const fetchData = () => {
      Promise.all([
        fetch(`/api/bookmarks?${params}`).then((res) => res.json()),
        fetch(`/api/bookmarks?${pendingParams}`).then((res) => res.json()),
      ])
        .then(([completedData, pendingData]) => {
          const pending = (pendingData.bookmarks || []) as Bookmark[];
          const completed = (completedData.bookmarks || []) as Bookmark[];
          setBookmarks([...pending, ...completed]);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchData();

    // 탭이 다시 포커스될 때 자동 갱신 (북마크릿 사용 후 돌아왔을 때)
    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [categoryId, refreshKey]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateReport = async () => {
    if (selectedIds.size < 2) return;
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/bookmarks/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarkIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (data.report) {
        setReportContent(data.report);
        setReportCategories(data.categories || []);
        // AI 이미지 생성 (키워드만 전달, 토큰 최소화)
        const cats = (data.categories || []).join(", ");
        fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: cats || "knowledge analysis" }),
        })
          .then((r) => r.json())
          .then((d) => { if (d.image) setReportImage(d.image); })
          .catch(() => {});
      } else if (data.error) {
        alert(data.error.includes("429") || data.error.includes("quota")
          ? "AI API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요."
          : data.error);
      }
    } catch (error) {
      console.error("Report generation error:", error);
      alert("보고서 생성 중 오류가 발생했습니다.");
    }
    setGeneratingReport(false);
  };

  const saveReport = async () => {
    if (!reportContent) return;
    try {
      await fetch("/api/bookmarks/report/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reportContent }),
      });
      alert("보고서가 저장되었습니다. '통합 보고서' 카테고리에서 확인할 수 있습니다.");
      onRefresh?.();
    } catch {
      alert("보고서 저장에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <p>저장된 북마크가 없습니다.</p>
        <p className="text-sm mt-1">URL을 추가하거나 북마크릿을 사용해보세요.</p>
      </div>
    );
  }

  return (
    <div>
      {/* 통합 분석 보고서 컨트롤 */}
      {bookmarks.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-sm text-primary-700">
              <input
                type="checkbox"
                checked={selectedIds.size === bookmarks.length && bookmarks.length > 0}
                onChange={() => {
                  if (selectedIds.size === bookmarks.length) {
                    setSelectedIds(new Set());
                  } else {
                    setSelectedIds(new Set(bookmarks.map((b) => b.id)));
                  }
                }}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              전체 선택
            </label>
            {selectedIds.size > 0 && (
              <span className="text-sm text-primary-700">{selectedIds.size}개 선택됨</span>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-12">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                선택 해제
              </button>
              <button
                onClick={() => {
                  if (!confirm(`선택한 ${selectedIds.size}개의 북마크를 삭제하시겠습니까?`)) return;
                  const ids = Array.from(selectedIds);
                  setBookmarks((prev) => prev.filter((b) => !selectedIds.has(b.id)));
                  setSelectedIds(new Set());
                  ids.forEach((id) => fetch(`/api/bookmarks/${id}`, { method: "DELETE" }));
                  onRefresh?.();
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                선택 삭제
              </button>
              <button
                onClick={generateReport}
                disabled={selectedIds.size < 2 || generatingReport}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {generatingReport ? "생성 중..." : "통합 분석 보고서 생성"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 통합 분석 보고서 결과 */}
      {reportContent && (
        <div className="mb-6 card">
          {/* AI 생성 이미지 (없으면 CSS 폴백) */}
          {reportImage ? (
            <img src={reportImage} alt="보고서 시각화" className="w-full h-32 object-cover rounded-lg mb-4" />
          ) : (
            <div className="h-24 rounded-lg mb-4 bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 flex items-center justify-center gap-3 overflow-hidden relative">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }}></div>
              {reportCategories.map((cat, i) => {
                const icons: Record<string, string> = { "IT/개발": "💻", "재테크/투자": "📈", "자기계발": "🎯", "건강/운동": "🏃", "교육/학습": "📚", "뉴스/시사": "📰", "비즈니스": "💼", "기타": "📌" };
                return <span key={i} className="text-3xl relative z-10">{icons[cat] || "📌"}</span>;
              })}
              <span className="text-white font-bold text-sm relative z-10 ml-2">통합 분석</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">통합 분석 보고서</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={saveReport}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                저장하기
              </button>
              <button
                onClick={() => setReportContent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
            {reportContent}
          </div>
        </div>
      )}

      {/* 북마크 목록 */}
      <div className="space-y-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            isSelected={selectedIds.has(bookmark.id)}
            onToggleSelect={() => toggleSelect(bookmark.id)}
          />
        ))}
      </div>
    </div>
  );
}
