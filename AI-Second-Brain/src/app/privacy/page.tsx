import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <Link href="/" className="text-sm text-primary-600 hover:underline">&larr; 홈으로</Link>
        <h1 className="text-2xl font-bold mt-4 mb-6">개인정보처리방침</h1>
        <p className="text-sm text-gray-500 mb-8">최종 수정일: 2025년 7월 10일</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-semibold">1. 수집하는 개인정보</h2>
            <p>서비스는 Google OAuth를 통해 다음 정보를 수집합니다:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>이름, 이메일 주소, 프로필 이미지 (Google 계정 정보)</li>
              <li>사용자가 저장한 URL 목록 및 AI 생성 요약</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. 개인정보의 이용 목적</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스 로그인 및 사용자 식별</li>
              <li>북마크 저장, AI 요약 생성, 개인화된 콘텐츠 제공</li>
              <li>서비스 개선 및 오류 수정</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. 제3자 제공</h2>
            <p>서비스는 AI 요약 생성을 위해 다음 외부 서비스에 데이터를 일시적으로 전달합니다:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Gemini API</strong>: 웹 페이지 텍스트 콘텐츠를 요약하기 위해 일시적으로 전달. 영구 저장되지 않음.</li>
              <li><strong>YouTube Data API</strong>: 영상 메타데이터(제목, 설명) 조회 목적.</li>
            </ul>
            <p>그 외 제3자에게 개인정보를 제공하지 않습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. 저장하지 않는 데이터</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>URL 원문 콘텐츠 (요약 생성 후 즉시 폐기)</li>
              <li>업로드된 이미지 (분석 후 즉시 폐기, 서버에 저장하지 않음)</li>
              <li>TTS 음성 데이터 (브라우저 내에서만 처리)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. 보관 기간</h2>
            <p>개인정보는 서비스 이용 기간 동안 보관되며, 계정 삭제 시 즉시 영구 삭제됩니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. 이용자의 권리</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>열람권</strong>: 대시보드에서 저장된 모든 데이터를 확인할 수 있습니다.</li>
              <li><strong>삭제권</strong>: 개별 북마크 삭제 또는 계정 전체 삭제가 가능합니다.</li>
              <li><strong>처리 정지권</strong>: 계정 삭제를 통해 모든 데이터 처리를 중단할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. 보안 조치</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>HTTPS를 통한 데이터 전송 암호화</li>
              <li>JWT 기반 세션 관리</li>
              <li>데이터베이스 접근 제한 (환경변수 기반 인증)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. 문의</h2>
            <p>개인정보 관련 문의사항은 서비스 내 챗봇 또는 관리자에게 연락해주세요.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
