"use client";

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

interface StatsChartsProps {
  stats: StatsData;
}

export function StatsCharts({ stats }: StatsChartsProps) {
  const { weekly, overall } = stats;

  // 일별 차트 최대값
  const maxDaily = Math.max(...weekly.dailyStats.map((d) => d.count), 1);

  // 카테고리 통계 정렬
  const sortedCategories = Object.entries(weekly.categoryStats)
    .sort((a, b) => b[1] - a[1]);

  // 태그 통계 상위 10개
  const topTags = Object.entries(weekly.tagStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const maxTag = topTags.length > 0 ? topTags[0][1] : 1;

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">{overall.totalBookmarks}</p>
          <p className="text-sm text-gray-600">전체 북마크</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{weekly.total}</p>
          <p className="text-sm text-gray-600">이번 주 저장</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600">{overall.totalCategories}</p>
          <p className="text-sm text-gray-600">카테고리 수</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-orange-600">{overall.monthlyCount}</p>
          <p className="text-sm text-gray-600">이번 달 저장</p>
        </div>
      </div>

      {/* 일별 저장 수 차트 */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">최근 7일 저장 현황</h3>
        <div className="flex items-end gap-2 h-40">
          {weekly.dailyStats.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">{day.count}</span>
              <div
                className="w-full bg-primary-400 rounded-t transition-all"
                style={{
                  height: `${(day.count / maxDaily) * 120}px`,
                  minHeight: day.count > 0 ? "4px" : "0px",
                }}
              />
              <span className="text-xs text-gray-500 mt-2">
                {new Date(day.date).toLocaleDateString("ko-KR", { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 카테고리별 분포 */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">이번 주 카테고리별 분포</h3>
          {sortedCategories.length > 0 ? (
            <div className="space-y-3">
              {sortedCategories.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-24 truncate">{name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-primary-500 h-full rounded-full transition-all"
                      style={{ width: `${(count / (sortedCategories[0]?.[1] || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">이번 주 데이터가 없습니다.</p>
          )}
        </div>

        {/* 인기 태그 */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">이번 주 인기 태그</h3>
          {topTags.length > 0 ? (
            <div className="space-y-3">
              {topTags.map(([tag, count]) => (
                <div key={tag} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-24 truncate">#{tag}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{ width: `${(count / maxTag) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">이번 주 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
