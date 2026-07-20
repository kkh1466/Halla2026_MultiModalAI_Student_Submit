"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { BookmarkList } from "@/components/BookmarkList";
import { AddBookmarkModal } from "@/components/AddBookmarkModal";
import { BookmarkletBanner } from "@/components/BookmarkletBanner";
import { ImageAnalyzer } from "@/components/ImageAnalyzer";
import { NotificationBell } from "@/components/NotificationBell";
import { Header } from "@/components/Header";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleBookmarkAdded = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setShowAddModal(false);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        refreshKey={refreshKey}
      />

      <div className="flex-1 flex flex-col">
        <Header session={session}>
          <NotificationBell />
        </Header>

        <main className="flex-1 p-6 overflow-y-auto">
          <BookmarkletBanner />

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory ? "카테고리 필터" : "모든 북마크"}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImageModal(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                이미지 분석
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                URL 추가
              </button>
            </div>
          </div>

          <BookmarkList
            categoryId={selectedCategory}
            refreshKey={refreshKey}
            onRefresh={() => setRefreshKey((k) => k + 1)}
          />
        </main>
      </div>

      {showAddModal && (
        <AddBookmarkModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleBookmarkAdded}
        />
      )}

      {showImageModal && (
        <ImageAnalyzer onClose={() => setShowImageModal(false)} />
      )}
    </div>
  );
}
