"use client";

import { useState, useRef } from "react";

interface ImageAnalyzerProps {
  onClose: () => void;
}

export function ImageAnalyzer({ onClose }: ImageAnalyzerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [mode, setMode] = useState<"analyze" | "ocr">("analyze");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("10MB 이하의 이미지만 업로드 가능합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/image-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mode }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
      } else {
        alert(data.error || "분석에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">이미지 분석</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="닫기">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 모드 선택 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("analyze")}
            className={`px-3 py-1.5 text-sm rounded-lg ${mode === "analyze" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            이미지 분석
          </button>
          <button
            onClick={() => setMode("ocr")}
            className={`px-3 py-1.5 text-sm rounded-lg ${mode === "ocr" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            텍스트 추출 (OCR)
          </button>
        </div>

        {/* 이미지 업로드 */}
        {!image ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
          >
            <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-600">클릭하여 이미지를 선택하세요</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (최대 10MB)</p>
          </div>
        ) : (
          <div className="mb-4">
            <img src={image} alt="업로드된 이미지" className="w-full rounded-lg max-h-48 object-contain bg-gray-100" />
            <button onClick={() => { setImage(null); setResult(null); }} className="text-sm text-gray-500 mt-2 hover:text-gray-700">
              다른 이미지 선택
            </button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        {/* 분석 버튼 */}
        {image && !result && (
          <button
            onClick={analyze}
            disabled={loading}
            className="w-full btn-primary mt-4 disabled:opacity-50"
          >
            {loading ? "분석 중..." : mode === "ocr" ? "텍스트 추출하기" : "이미지 분석하기"}
          </button>
        )}

        {/* 결과 */}
        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 mb-2">
              {mode === "ocr" ? "추출 결과" : "분석 결과"}
            </h4>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{result}</div>
            <p className="text-xs text-gray-400 mt-3">※ 이미지는 서버에 저장되지 않습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
