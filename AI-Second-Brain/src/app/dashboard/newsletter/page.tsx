"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

interface Newsletter {
  id: string;
  title: string;
  content: string;
  weekStart: string;
  weekEnd: string;
  createdAt: string;
}

export default function NewsletterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [newsletterImage, setNewsletterImage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchNewsletters();
    }
  }, [status]);

  const fetchNewsletters = async () => {
    try {
      const res = await fetch("/api/newsletter");
      const data = await res.json();
      setNewsletters(data.newsletters || []);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const generateNewsletter = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/newsletter", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.newsletter) {
        setNewsletters((prev) => [data.newsletter, ...prev]);
        setSelectedNewsletter(data.newsletter);
        // AI 이미지 생성
        fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: "weekly learning newsletter summary" }),
        })
          .then((r) => r.json())
          .then((d) => { if (d.image) setNewsletterImage(d.image); })
          .catch(() => {});
      } else {
        const msg = data.error || "뉴스레터 생성에 실패했습니다.";
        if (msg.includes("429") || msg.includes("quota")) {
          alert("AI API 할당량이 초과되었습니다. 잠시 후(1~2분) 다시 시도해주세요.");
        } else {
          alert(msg);
        }
      }
    } catch {
      alert("뉴스레터 생성 중 오류가 발생했습니다.");
    }
    setGenerating(false);
  };

  const deleteNewsletter = async (id: string) => {
    if (!confirm("이 뉴스레터를 삭제하시겠습니까?")) return;
    // 즉시 UI에서 제거 (옵티미스틱)
    setNewsletters((prev) => prev.filter((nl) => nl.id !== id));
    if (selectedNewsletter?.id === id) setSelectedNewsletter(null);
    // 백그라운드에서 서버 삭제
    fetch(`/api/newsletter?id=${id}`, { method: "DELETE" }).catch(() => {
      // 실패 시 다시 불러오기
      fetchNewsletters();
    });
  };

  if (status === "loading" || !session) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header session={session} />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">나만의 뉴스레터</h2>
            <p className="text-sm text-gray-600 mt-1">
              매주 저장한 정보 중 핵심 내용을 AI가 뉴스레터로 정리합니다.
            </p>
          </div>
          <button
            onClick={generateNewsletter}
            disabled={generating}
            className="btn-primary disabled:opacity-50"
          >
            {generating ? "생성 중..." : "이번 주 뉴스레터 생성"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 뉴스레터 목록 */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : newsletters.length === 0 ? (
              <div className="card text-center py-8 text-gray-500 text-sm">
                아직 생성된 뉴스레터가 없습니다.<br />
                &quot;이번 주 뉴스레터 생성&quot; 버튼을 눌러보세요.
              </div>
            ) : (
              newsletters.map((nl) => (
                <div
                  key={nl.id}
                  className={`card transition-all relative group ${
                    selectedNewsletter?.id === nl.id ? "ring-2 ring-primary-400" : ""
                  }`}
                >
                  <button
                    onClick={() => setSelectedNewsletter(nl)}
                    className="w-full text-left"
                  >
                    <p className="font-medium text-sm text-gray-900 line-clamp-2 pr-6">{nl.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(nl.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNewsletter(nl.id); }}
                    className="absolute top-3 right-3 p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="삭제"
                    aria-label="뉴스레터 삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 뉴스레터 내용 */}
          <div className="md:col-span-2">
            {selectedNewsletter ? (
              <div className="card">
                {/* AI 생성 이미지 (없으면 CSS 폴백) */}
                {newsletterImage ? (
                  <img src={newsletterImage} alt="뉴스레터 시각화" className="w-full h-28 object-cover rounded-lg mb-4" />
                ) : (
                  <div className="h-20 rounded-lg mb-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 flex items-center justify-center gap-2 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
                    <span className="text-3xl relative z-10">📬</span>
                    <span className="text-white font-bold text-sm relative z-10">주간 학습 정리</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">{selectedNewsletter.title}</h3>
                  <button
                    onClick={() => {
                      const synth = window.speechSynthesis;
                      if (synth.speaking) {
                        synth.cancel();
                        return;
                      }
                      if (!selectedNewsletter?.content) return;
                      // 긴 텍스트를 200자씩 분할 (브라우저 TTS 길이 제한 우회)
                      const text = selectedNewsletter.content;
                      const chunks = text.match(/[\s\S]{1,200}/g) || [];
                      let i = 0;
                      const speakNext = () => {
                        if (i >= chunks.length) return;
                        const utterance = new SpeechSynthesisUtterance(chunks[i]);
                        utterance.lang = "ko-KR";
                        utterance.rate = 0.9;
                        utterance.onend = () => { i++; speakNext(); };
                        synth.speak(utterance);
                      };
                      speakNext();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    title="음성으로 읽기"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    읽어주기
                  </button>
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                  {selectedNewsletter.content}
                </div>
              </div>
            ) : (
              <div className="card text-center py-16 text-gray-500">
                뉴스레터를 선택하면 내용이 여기에 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
