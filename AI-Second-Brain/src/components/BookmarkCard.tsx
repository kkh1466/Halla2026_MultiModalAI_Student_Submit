"use client";

import { useState } from "react";
import { ReminderModal } from "./ReminderModal";

const CATEGORY_VISUALS: Record<string, { gradient: string; icon: string }> = {
  "IT/개발": { gradient: "from-blue-600 to-cyan-500", icon: "💻" },
  "재테크/투자": { gradient: "from-emerald-600 to-teal-500", icon: "📈" },
  "자기계발": { gradient: "from-purple-600 to-pink-500", icon: "🎯" },
  "건강/운동": { gradient: "from-green-600 to-lime-500", icon: "🏃" },
  "요리/음식": { gradient: "from-orange-600 to-yellow-500", icon: "🍳" },
  "여행": { gradient: "from-sky-600 to-indigo-500", icon: "✈️" },
  "엔터테인먼트": { gradient: "from-pink-600 to-rose-500", icon: "🎬" },
  "교육/학습": { gradient: "from-indigo-600 to-violet-500", icon: "📚" },
  "뉴스/시사": { gradient: "from-gray-700 to-slate-600", icon: "📰" },
  "디자인/예술": { gradient: "from-fuchsia-600 to-purple-500", icon: "🎨" },
  "비즈니스": { gradient: "from-amber-600 to-orange-500", icon: "💼" },
  "통합 보고서": { gradient: "from-violet-600 to-purple-500", icon: "📊" },
  "기타": { gradient: "from-gray-600 to-zinc-500", icon: "📌" },
};

function getCategoryVisual(name?: string) {
  return CATEGORY_VISUALS[name || "기타"] || CATEGORY_VISUALS["기타"];
}

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

interface BookmarkCardProps {
  bookmark: Bookmark;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export function BookmarkCard({ bookmark, isSelected, onToggleSelect }: BookmarkCardProps) {
  const [showQuestions, setShowQuestions] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [isImportant, setIsImportant] = useState(bookmark.isImportant);

  const questions: string[] = bookmark.questions ? JSON.parse(bookmark.questions) : [];
  const tags = bookmark.tags?.split(",").filter(Boolean) || [];

  const toggleImportant = async () => {
    const newValue = !isImportant;
    setIsImportant(newValue);
    await fetch(`/api/bookmarks/${bookmark.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isImportant: newValue }),
    });
  };

  const deleteBookmark = async () => {
    if (!confirm("이 북마크를 삭제하시겠습니까?")) return;
    await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <div className={`card transition-all ${isSelected ? "ring-2 ring-primary-400" : ""}`}>
      <div className="flex gap-4">
        {/* 선택 체크박스 */}
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            aria-label="북마크 선택"
          />
        </div>

        {/* 카테고리 비주얼 (CC0) */}
        <div className={`flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br ${getCategoryVisual(bookmark.category?.name).gradient} flex items-center justify-center`}>
          <span className="text-2xl">{getCategoryVisual(bookmark.category?.name).icon}</span>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
              >
                {bookmark.title || bookmark.url}
              </a>
              <div className="flex items-center gap-2 mt-1">
                {bookmark.category && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: bookmark.category.color + "20",
                      color: bookmark.category.color,
                    }}
                  >
                    {bookmark.category.name}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(bookmark.createdAt).toLocaleDateString("ko-KR")}
                </span>
                {bookmark.source === "youtube" && (
                  <span className="text-xs text-red-500">YouTube</span>
                )}
                {bookmark.source === "bookmarklet" && (
                  <span className="text-xs text-blue-500">북마크릿</span>
                )}
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleImportant}
                className={`p-1.5 rounded-md transition-colors ${
                  isImportant ? "text-yellow-500 bg-yellow-50" : "text-gray-400 hover:text-yellow-500"
                }`}
                title={isImportant ? "중요 해제 (복습 알림 중지)" : "중요 표시 (1일/7일/30일 복습 알림)"}
                aria-label={isImportant ? "중요 표시 해제" : "중요 표시"}
              >
                <svg className="w-4 h-4" fill={isImportant ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              <button
                onClick={() => setShowReminderModal(true)}
                className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 transition-colors"
                title="알림 설정"
                aria-label="알림 설정"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button
                onClick={deleteBookmark}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 transition-colors"
                title="삭제"
                aria-label="삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* AI 요약 */}
          {bookmark.status === "pending" && (
            <div className="mt-2 flex items-center gap-2 text-sm text-primary-600">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary-600"></div>
              <span>AI 요약 생성 중...</span>
            </div>
          )}
          {bookmark.status === "failed" && !bookmark.summary && (
            <p className="mt-2 text-sm text-red-500">요약 생성에 실패했습니다.</p>
          )}
          {bookmark.summary && bookmark.status !== "pending" && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line line-clamp-3">
              {bookmark.summary}
            </p>
          )}

          {/* 태그 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 연관 질문 토글 */}
          {questions.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {showQuestions ? "질문 접기 ▲" : "연관 질문 보기 ▼"}
              </button>
              {showQuestions && (
                <div className="mt-2 p-3 bg-primary-50 rounded-lg">
                  <p className="text-xs font-medium text-primary-700 mb-2">
                    이 자료를 읽고 함께 고민해보면 좋을 질문:
                  </p>
                  <ol className="space-y-1">
                    {questions.map((q, i) => (
                      <li key={i} className="text-sm text-primary-800">
                        {i + 1}. {q}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showReminderModal && (
        <ReminderModal
          bookmarkId={bookmark.id}
          bookmarkTitle={bookmark.title || ""}
          onClose={() => setShowReminderModal(false)}
        />
      )}
    </div>
  );
}
