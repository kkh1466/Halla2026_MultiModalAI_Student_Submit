"use client";

import { useState, useEffect } from "react";

export function BookmarkletBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  if (dismissed || !appUrl) return null;

  // 북마크릿 JavaScript 코드 (리다이렉트 방식 - 쿠키 인증 문제 해결)
  const bookmarkletCode = `javascript:void(window.open('${appUrl}/api/bookmarklet/add?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'_self'))`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = bookmarkletCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm">빠른 추가 버튼 (북마크릿)</h4>
            <p className="text-xs text-gray-600 mt-0.5 mb-2">
              어떤 페이지에서든 클릭 한 번으로 AI Second Brain에 등록할 수 있습니다.
            </p>

            {/* 코드 복사 버튼 */}
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-primary-600 text-white hover:bg-primary-700"
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  복사됨!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  북마크릿 코드 복사
                </>
              )}
            </button>

            {/* 설치 가이드 토글 */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="ml-2 text-xs text-primary-600 hover:text-primary-800 underline"
            >
              {showGuide ? "가이드 닫기" : "설치 방법 보기"}
            </button>

            {/* 브라우저별 설치 가이드 */}
            {showGuide && (
              <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 space-y-3">
                {/* Edge */}
                <div>
                  <p className="font-semibold text-gray-900">🔵 Edge 설치 방법:</p>
                  <ol className="list-decimal list-inside space-y-1.5 ml-1 mt-1.5">
                    <li>위의 <span className="font-medium text-primary-600">&quot;북마크릿 코드 복사&quot;</span> 버튼을 클릭합니다.</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">Ctrl+D</kbd>를 눌러 즐겨찾기 추가 창을 엽니다.</li>
                    <li>이름을 <span className="font-medium">&quot;AI Second Brain에 추가&quot;</span>로 변경합니다.</li>
                    <li>URL 칸의 내용을 <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">Ctrl+A</kbd>로 전체 선택 후 <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">Delete</kbd>로 지웁니다.</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">Ctrl+V</kbd>로 복사한 코드를 붙여넣습니다.</li>
                    <li><span className="font-medium">&quot;완료&quot;</span>를 클릭합니다.</li>
                  </ol>
                </div>

                {/* Chrome */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="font-semibold text-gray-900">🟡 Chrome 설치 방법:</p>
                  <ol className="list-decimal list-inside space-y-1.5 ml-1 mt-1.5">
                    <li>위의 <span className="font-medium text-primary-600">&quot;북마크릿 코드 복사&quot;</span> 버튼을 클릭합니다.</li>
                    <li><kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">Ctrl+Shift+O</kbd>를 눌러 북마크 관리자를 엽니다.</li>
                    <li>우측 상단 <span className="font-medium">⋮</span>(점 3개) 메뉴 → <span className="font-medium">&quot;새 북마크 추가&quot;</span>를 클릭합니다.</li>
                    <li>이름에 <span className="font-medium">&quot;AI Second Brain에 추가&quot;</span>를 입력합니다.</li>
                    <li>URL 칸에 <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">Ctrl+V</kbd>로 복사한 코드를 붙여넣습니다.</li>
                    <li><span className="font-medium">&quot;저장&quot;</span>을 클릭합니다.</li>
                  </ol>
                </div>

                {/* 사용 방법 */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="font-semibold text-gray-900">사용 방법:</p>
                  <p className="mt-1">저장하고 싶은 페이지에서 즐겨찾기 바의 <span className="font-medium">&quot;AI Second Brain에 추가&quot;</span>를 클릭하면, 잠시 등록 화면이 표시된 뒤 자동으로 원래 페이지로 돌아옵니다.</p>
                </div>

                {/* 팁 */}
                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <p className="text-gray-500">💡 즐겨찾기 바가 보이지 않으면 <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px]">Ctrl+Shift+B</kbd>로 표시할 수 있습니다.</p>
                  <p className="text-gray-500">💡 반드시 AI Second Brain에 로그인된 상태에서 사용하세요.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
