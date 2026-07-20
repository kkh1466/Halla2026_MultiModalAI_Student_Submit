import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-bold text-xl text-gray-900">AI Second Brain</span>
        </div>
        <Link href="/login" className="btn-primary">
          시작하기
        </Link>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          저장만 하세요.<br />
          <span className="text-primary-600">AI가 정리해드립니다.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-12">
          웹 북마크, 유튜브 영상을 AI가 자동으로 요약하고 분류합니다.
          잊을 만할 때 다시 알려주고, 매주 나만의 뉴스레터를 만들어줍니다.
        </p>

        <Link href="/login" className="btn-primary text-lg px-8 py-3">
          Google 계정으로 무료 시작
        </Link>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 text-left">
          <div className="card">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">AI 자동 요약</h3>
            <p className="text-gray-600 text-sm">Gemini AI가 링크의 핵심 내용을 3줄로 요약하고 카테고리별로 자동 분류합니다.</p>
          </div>

          <div className="card">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">스마트 리마인드</h3>
            <p className="text-gray-600 text-sm">에빙하우스 망각곡선을 활용해 1일, 7일, 30일 뒤에 자동으로 복습 알림을 보냅니다.</p>
          </div>

          <div className="card">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">주간 뉴스레터</h3>
            <p className="text-gray-600 text-sm">매주 저장한 콘텐츠 중 핵심만 골라 나만의 뉴스레터를 자동으로 작성해드립니다.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
