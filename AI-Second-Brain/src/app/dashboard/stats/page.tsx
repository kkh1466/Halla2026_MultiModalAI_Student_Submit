"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { StatsCharts } from "@/components/StatsCharts";

interface StatsData {
  weekly: {
    total: number;
    categoryStats: Record<string, number>;
    tagStats: Record<string, number>;
    dailyStats: { date: string; count: number }[];
  };
  overall: {
    totalBookmarks: number;
    totalCategories: number;
    monthlyCount: number;
  };
}

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || !session) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header session={session} />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">학습 대시보드</h2>
          <p className="text-sm text-gray-600 mt-1">
            나의 지식 습관을 통계로 확인하세요.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : stats ? (
          <StatsCharts stats={stats} />
        ) : (
          <p className="text-center py-20 text-gray-500">통계 데이터를 불러올 수 없습니다.</p>
        )}
      </main>
    </div>
  );
}
