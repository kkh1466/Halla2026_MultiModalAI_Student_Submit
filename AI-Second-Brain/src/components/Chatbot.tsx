"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "bot";
  content: string;
}

const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["북마크릿", "bookmarklet", "설치", "즐겨찾기", "추가 버튼"],
    answer: `북마크릿은 즐겨찾기에 등록하는 "빠른 추가 버튼"입니다.\n\n설치 방법:\n1. 대시보드에서 "북마크릿 코드 복사" 버튼 클릭\n2. Ctrl+D로 즐겨찾기 추가\n3. URL 칸을 비우고 복사한 코드를 Ctrl+V로 붙여넣기\n4. 저장\n\n사용법: 저장하고 싶은 페이지에서 해당 즐겨찾기를 클릭하면 자동 등록됩니다.`,
  },
  {
    keywords: ["url", "추가", "저장", "등록", "링크"],
    answer: `URL을 추가하는 방법은 2가지입니다:\n\n1. 대시보드에서 "URL 추가" 버튼 → URL 입력 → 추가\n2. 북마크릿을 설치해서 아무 페이지에서 클릭 한 번으로 등록\n\n등록하면 AI가 자동으로 요약, 분류, 태그를 생성합니다.`,
  },
  {
    keywords: ["검색", "찾기", "search"],
    answer: `상단 헤더의 검색창에서 제목, 태그, 키워드로 저장된 북마크를 검색할 수 있습니다. 2글자 이상 입력하면 실시간으로 결과가 표시됩니다.`,
  },
  {
    keywords: ["카테고리", "분류", "폴더"],
    answer: `AI가 저장한 URL의 내용을 분석하여 자동으로 카테고리를 분류합니다. 좌측 사이드바에서 카테고리별로 필터링할 수 있습니다.\n\n카테고리: IT/개발, 재테크/투자, 자기계발, 건강/운동, 교육/학습 등 12가지`,
  },
  {
    keywords: ["요약", "ai", "gemini", "3줄"],
    answer: `URL을 등록하면 AI(Gemini)가 자동으로:\n- 3줄 핵심 요약\n- 카테고리 분류\n- 태그 추출\n- 연관 질문 3가지 생성\n- 지식 그래프용 키워드 추출\n\n을 수행합니다. 각 북마크 카드에서 확인할 수 있습니다.`,
  },
  {
    keywords: ["리마인드", "알림", "복습", "spaced", "중요"],
    answer: `북마크를 "중요" 표시(⭐)하면 에빙하우스 망각곡선에 따라:\n- 1일 뒤\n- 7일 뒤\n- 30일 뒤\n\n에 복습 알림이 자동 생성됩니다. 알림은 상단의 🔔 벨 아이콘에서 확인 가능합니다.`,
  },
  {
    keywords: ["지식 그래프", "네트워크", "맵", "연결"],
    answer: `상단 메뉴의 "지식 그래프"에서 저장한 북마크들 사이의 연관 키워드를 시각화한 네트워크 맵을 볼 수 있습니다. 같은 키워드를 공유하는 문서들이 연결되어 표시됩니다.`,
  },
  {
    keywords: ["통계", "학습", "stats", "그래프"],
    answer: `상단 메뉴의 "학습 통계"에서 이번 주 어떤 분야의 정보를 주로 습득했는지, 어떤 태그가 많은지 등을 시각적 그래프로 확인할 수 있습니다.`,
  },
  {
    keywords: ["뉴스레터", "newsletter", "주간"],
    answer: `상단 메뉴의 "뉴스레터"에서 매주 저장한 콘텐츠의 핵심 요약을 AI가 자동으로 정리한 주간 뉴스레터를 확인할 수 있습니다.`,
  },
  {
    keywords: ["보고서", "통합", "분석", "선택"],
    answer: `대시보드에서 여러 북마크를 체크박스로 선택(2개 이상)한 뒤 "통합 분석 보고서 생성" 버튼을 클릭하면, AI가 선택한 자료들을 종합 분석한 보고서를 작성합니다.`,
  },
  {
    keywords: ["삭제", "제거"],
    answer: `각 북마크 카드 우측의 휴지통 아이콘을 클릭하면 삭제할 수 있습니다. 삭제된 링크나 더 이상 존재하지 않는 URL은 시스템이 자동으로 감지하여 알림을 보냅니다.`,
  },
  {
    keywords: ["로그인", "구글", "계정"],
    answer: `AI Second Brain은 Google 계정으로 로그인합니다. 로그인 페이지에서 "Google로 시작하기"를 클릭하세요.`,
  },
];

function findAnswer(input: string): string {
  const lower = input.toLowerCase();

  for (const faq of FAQ) {
    if (faq.keywords.some((kw) => lower.includes(kw))) {
      return faq.answer;
    }
  }

  return `죄송합니다. 해당 질문에 대한 답변을 찾지 못했습니다.\n\n다음 주제에 대해 물어보실 수 있습니다:\n• 북마크릿 설치/사용법\n• URL 추가 방법\n• 검색 기능\n• AI 요약\n• 카테고리/분류\n• 리마인드/알림\n• 지식 그래프\n• 학습 통계\n• 뉴스레터\n• 통합 보고서\n• 북마크 삭제`;
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: `안녕하세요! AI Second Brain 사용법에 대해 궁금한 점을 물어보세요. 😊

이런 것들을 물어볼 수 있어요:
• "북마크릿 어떻게 설치해?"
• "검색은 어떻게 해?"
• "AI 요약은 뭐야?"
• "리마인드 알림 설정 방법"
• "통합 보고서 어떻게 만들어?"
• "뉴스레터는 어디서 봐?"` },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { role: "user", content: text };
    const botMsg: Message = { role: "bot", content: findAnswer(text) };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center z-50"
        aria-label={open ? "챗봇 닫기" : "챗봇 열기"}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* 챗봇 창 */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-[28rem] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* 헤더 */}
          <div className="px-4 py-3 bg-primary-600 text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="font-medium text-sm">도움말 챗봇</span>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="질문을 입력하세요..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="챗봇 메시지 입력"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-primary-700"
                aria-label="전송"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
