"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
  _count: { bookmarks: number };
}

interface SidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  refreshKey: number;
}

export function Sidebar({ selectedCategory, onSelectCategory, refreshKey }: SidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = () => {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => setCategories(data.categories || []))
        .catch(console.error);
    };

    fetchCategories();

    // 탭 포커스 시 자동 갱신 (북마크릿 등록/삭제 후 반영)
    const handleFocus = () => fetchCategories();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshKey]);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          카테고리
        </h3>
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
            !selectedCategory ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          전체 보기
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex items-center justify-between transition-colors ${
              selectedCategory === cat.id
                ? "bg-primary-50 text-primary-700 font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </span>
            <span className="text-xs text-gray-400">{cat._count.bookmarks}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-2">
          <p>무료 플랜: 20개 링크</p>
          <div className="flex gap-2">
            <a href="/terms" className="text-gray-400 hover:text-gray-600">이용약관</a>
            <a href="/privacy" className="text-gray-400 hover:text-gray-600">개인정보처리방침</a>
          </div>
          <button
            onClick={async () => {
              if (!confirm("정말 계정을 삭제하시겠습니까?\n모든 북마크, 뉴스레터, 알림이 영구 삭제되며 복구할 수 없습니다.")) return;
              if (!confirm("마지막 확인: 되돌릴 수 없습니다. 정말 삭제하시겠습니까?")) return;
              const res = await fetch("/api/account", { method: "DELETE" });
              if (res.ok) {
                window.location.href = "/";
              } else {
                alert("계정 삭제에 실패했습니다.");
              }
            }}
            className="text-red-400 hover:text-red-600 text-xs"
          >
            계정 삭제
          </button>
        </div>
      </div>
    </aside>
  );
}
