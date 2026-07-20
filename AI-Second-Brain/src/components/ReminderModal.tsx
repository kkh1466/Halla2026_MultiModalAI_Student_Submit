"use client";

import { useState } from "react";

interface ReminderModalProps {
  bookmarkId: string;
  bookmarkTitle: string;
  onClose: () => void;
}

export function ReminderModal({ bookmarkId, bookmarkTitle, onClose }: ReminderModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setLoading(true);
    const remindAt = new Date(`${date}T${time}:00`);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookmarkId,
          remindAt: remindAt.toISOString(),
          message: message || `"${bookmarkTitle}" 다시 볼 시간입니다`,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 1500);
      }
    } catch (error) {
      console.error("Reminder creation error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="reminder-title">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 id="reminder-title" className="text-lg font-bold mb-4">알림 설정</h3>

        {success ? (
          <div className="text-center py-4">
            <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-700 font-medium">알림이 설정되었습니다!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="reminder-date" className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
              <input
                id="reminder-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="input-field"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="reminder-time" className="block text-sm font-medium text-gray-700 mb-1">시간</label>
              <input
                id="reminder-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="reminder-message" className="block text-sm font-medium text-gray-700 mb-1">메모 (선택)</label>
              <input
                id="reminder-message"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="리마인드 시 표시할 메시지"
                className="input-field"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="btn-secondary">취소</button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? "설정 중..." : "알림 설정"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
