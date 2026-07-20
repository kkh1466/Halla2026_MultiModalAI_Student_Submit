"use client";

import { useState } from "react";

interface AddBookmarkModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddBookmarkModal({ onClose, onSuccess }: AddBookmarkModalProps) {
  const [url, setUrl] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAccessError(null);

    if (!url.trim()) {
      setError("URL을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), isImportant }),
      });

      const data = await res.json();

      if (res.status === 422) {
        // 접근 불가 경고
        setAccessError(data.error);
      } else if (!res.ok) {
        setError(data.error || "등록에 실패했습니다.");
      } else {
        onSuccess();
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-bookmark-title">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="add-bookmark-title" className="text-lg font-bold">URL 추가</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="닫기">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">
              웹 페이지 URL
            </label>
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="input-field"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                중요 표시 (1일/7일/30일 뒤 복습 리마인드)
              </span>
            </label>
          </div>

          {/* 접근 불가 경고 */}
          {accessError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-medium text-red-800 text-sm">이 링크는 등록할 수 없습니다</p>
                  <p className="text-red-700 text-sm mt-1">{accessError}</p>
                </div>
              </div>
            </div>
          )}

          {/* 일반 에러 */}
          {error && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              취소
            </button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? "확인 중..." : "대시보드에 추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
