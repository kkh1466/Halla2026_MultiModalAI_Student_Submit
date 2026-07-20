"use client";

import { useState, useCallback, useRef } from "react";
import { X, Upload, FileText, ImageIcon, Loader2, Check, Trash2 } from "lucide-react";

interface ParsedIngredient {
  name: string;
  unit: string;
  pricePerUnit: number;
  category: string;
}

interface UploadModalProps {
  onClose: () => void;
  onConfirm: (ingredients: ParsedIngredient[]) => void;
}

type Step = "upload" | "analyzing" | "review";

export default function UploadModal({ onClose, onConfirm }: UploadModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedIngredient[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setStep("analyzing");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingredients/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "분석에 실패했습니다.");
        setStep("upload");
        return;
      }

      if (data.data.length === 0) {
        setError("식재료 정보를 찾을 수 없습니다. 다른 파일을 시도해주세요.");
        setStep("upload");
        return;
      }

      setParsedItems(data.data);
      setSelectedItems(new Set(data.data.map((_: ParsedIngredient, i: number) => i)));
      setStep("review");
    } catch {
      setError("파일 업로드 중 오류가 발생했습니다.");
      setStep("upload");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const toggleItem = (index: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedItems.size === parsedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(parsedItems.map((_, i) => i)));
    }
  };

  const handleConfirm = () => {
    const selected = parsedItems.filter((_, i) => selectedItems.has(i));
    onConfirm(selected);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ko-KR").format(price);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="upload-modal-title" className="text-lg font-semibold">
            {step === "upload" && "영수증/CSV 업로드"}
            {step === "analyzing" && "AI 분석 중..."}
            {step === "review" && "분석 결과 확인"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm" role="alert">
              {error}
            </div>
          )}

          {/* Step 1: 파일 업로드 */}
          {step === "upload" && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                영수증 이미지(JPG, PNG, WebP) 또는 CSV 파일을 업로드하면 AI가 식재료 정보를 자동으로 추출합니다.
              </p>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-dropzone"
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-1">
                  파일을 드래그하거나 클릭하여 선택
                </p>
                <p className="text-sm text-gray-500">
                  이미지 (JPG, PNG, WebP) 또는 CSV 파일 (최대 10MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,text/csv"
                onChange={handleFileInput}
                className="hidden"
                data-testid="upload-file-input"
              />

              {/* 지원 형식 안내 */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">영수증 이미지</p>
                    <p className="text-xs text-gray-500">마트/시장 영수증, 견적서</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <FileText className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">CSV 파일</p>
                    <p className="text-xs text-gray-500">엑셀 내보내기, 거래처 목록</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 분석 중 */}
          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-700 font-medium">AI가 파일을 분석하고 있습니다...</p>
              <p className="text-sm text-gray-500 mt-1">잠시만 기다려주세요</p>
            </div>
          )}

          {/* Step 3: 결과 리뷰 */}
          {step === "review" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{parsedItems.length}개</span>의 식재료가 감지되었습니다. 등록할 항목을 선택하세요.
                </p>
                <button
                  onClick={toggleAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedItems.size === parsedItems.length ? "전체 해제" : "전체 선택"}
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm" data-testid="upload-result-table">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left w-10"></th>
                      <th className="px-3 py-2 text-left text-gray-600">식재료명</th>
                      <th className="px-3 py-2 text-left text-gray-600">카테고리</th>
                      <th className="px-3 py-2 text-right text-gray-600">단가</th>
                      <th className="px-3 py-2 text-left text-gray-600">단위</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedItems.map((item, index) => {
                      const isSelected = selectedItems.has(index);
                      return (
                        <tr
                          key={index}
                          className={`${isSelected ? "bg-white" : "bg-gray-50 opacity-60"}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItem(index)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              aria-label={`${item.name} 선택`}
                            />
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(event) => {
                                const name = event.target.value;
                                setParsedItems((prev) =>
                                  prev.map((current, i) =>
                                    i === index ? { ...current, name } : current
                                  )
                                );
                              }}
                              className="w-full min-w-32 rounded border border-transparent bg-transparent px-1 py-1 font-medium text-gray-900 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              aria-label={`${index + 1}번째 식재료명`}
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-600">{item.category}</td>
                          <td className="px-3 py-2 text-right text-gray-900">
                            {formatPrice(item.pricePerUnit)}원
                          </td>
                          <td className="px-3 py-2 text-gray-600">/{item.unit}</td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => {
                                setParsedItems((prev) => prev.filter((_, i) => i !== index));
                                setSelectedItems((prev) => {
                                  const next = new Set<number>();
                                  prev.forEach((i) => {
                                    if (i < index) next.add(i);
                                    else if (i > index) next.add(i - 1);
                                  });
                                  return next;
                                });
                              }}
                              className="text-gray-400 hover:text-red-500"
                              aria-label={`${item.name} 제거`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {parsedItems.length === 0 && (
                <p className="text-center text-gray-500 py-4">모든 항목이 제거되었습니다.</p>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-between items-center p-4 border-t">
          {step === "review" ? (
            <>
              <button
                onClick={() => {
                  setStep("upload");
                  setParsedItems([]);
                  setError("");
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                다시 업로드
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selectedItems.size === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="upload-confirm-button"
                >
                  <Check className="w-4 h-4" />
                  {selectedItems.size}개 등록
                </button>
              </div>
            </>
          ) : (
            <div className="ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
