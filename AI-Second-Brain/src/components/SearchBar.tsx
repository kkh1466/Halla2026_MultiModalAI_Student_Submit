"use client";

import { useState, useRef, useEffect } from "react";

interface SearchResult {
  id: string;
  url: string;
  title: string | null;
  tags: string | null;
  summary: string | null;
  category: { id: string; name: string; color: string } | null;
  createdAt: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 외부 클릭 시 결과 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/bookmarks/search?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setResults(data.bookmarks || []);
        setShowResults(true);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
          placeholder="제목, 태그, 키워드로 검색..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          aria-label="북마크 검색"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              검색 결과가 없습니다.
            </div>
          ) : (
            <ul>
              {results.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    onClick={() => setShowResults(false)}
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {item.title || item.url}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.category && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: item.category.color + "20",
                            color: item.category.color,
                          }}
                        >
                          {item.category.name}
                        </span>
                      )}
                      {item.tags && (
                        <span className="text-[10px] text-gray-400 line-clamp-1">
                          {item.tags.split(",").slice(0, 3).map(t => `#${t.trim()}`).join(" ")}
                        </span>
                      )}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
