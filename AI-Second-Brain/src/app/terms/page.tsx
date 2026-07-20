import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <Link href="/" className="text-sm text-primary-600 hover:underline">&larr; 홈으로</Link>
        <h1 className="text-2xl font-bold mt-4 mb-6">이용약관</h1>
        <p className="text-sm text-gray-500 mb-8">최종 수정일: 2025년 7월 10일</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold">제1조 (목적)</h2>
            <p>이 약관은 AI Second Brain(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 이용자와 서비스 제공자의 권리·의무를 규정하는 것을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">제2조 (서비스 내용)</h2>
            <p>서비스는 사용자가 웹 페이지 URL을 저장하고, AI를 활용하여 요약·분류·분석하는 개인 지식 관리 도구입니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>URL 북마크 저장 및 AI 요약 생성</li>
              <li>카테고리 자동 분류 및 태그 추출</li>
              <li>지식 그래프 시각화</li>
              <li>주간 뉴스레터 생성</li>
              <li>이미지 분석 및 OCR 기능</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">제3조 (이용자의 의무)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스를 개인 학습 및 정보 정리 목적으로만 이용합니다.</li>
              <li>AI가 생성한 요약을 원저작물의 대체로 사용하거나 무단 배포하지 않습니다.</li>
              <li>타인의 저작권을 침해하는 용도로 서비스를 이용하지 않습니다.</li>
              <li>서비스에 대한 자동화된 대량 접근(봇, 스크래핑 등)을 시도하지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">제4조 (저작권 안내)</h2>
            <p>서비스는 사용자가 저장한 URL의 원문 콘텐츠를 서버에 영구 저장하지 않습니다. AI 요약은 원저작물을 대체하지 않으며, 원본 확인을 위한 원문 링크를 항상 제공합니다.</p>
            <p>원저작물의 저작권은 해당 저작권자에게 있으며, 서비스는 사용자의 편의를 위한 요약만을 제공합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">제5조 (AI 서비스 면책)</h2>
            <p>AI가 생성한 요약, 분류, 분석 결과는 참고용이며 정확성을 보장하지 않습니다. AI 생성 콘텐츠에 기반한 의사결정에 대해 서비스 제공자는 책임을 지지 않습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">제6조 (이용 제한)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>무료 플랜: 일일 북마크 등록 30건, 총 저장 20건 제한</li>
              <li>서비스 남용 시 사전 통보 후 이용이 제한될 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">제7조 (계정 삭제)</h2>
            <p>사용자는 언제든지 계정 삭제를 요청할 수 있으며, 삭제 시 모든 개인 데이터(북마크, 요약, 뉴스레터, 알림 등)가 영구 삭제됩니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">제8조 (서비스 변경 및 중단)</h2>
            <p>서비스 제공자는 운영상 필요한 경우 서비스의 내용을 변경하거나 중단할 수 있으며, 사전에 공지합니다.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
