"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import { SearchBar } from "./SearchBar";

interface HeaderProps {
  session: Session;
  children?: React.ReactNode;
}

export function Header({ session, children }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 hidden lg:inline">AI Second Brain</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          <Link href="/dashboard" className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 text-gray-700">
            대시보드
          </Link>
          <Link href="/dashboard/stats" className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 text-gray-700">
            학습 통계
          </Link>
          <Link href="/dashboard/knowledge-graph" className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 text-gray-700">
            지식 그래프
          </Link>
          <Link href="/dashboard/newsletter" className="px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 text-gray-700">
            뉴스레터
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <SearchBar />
        {children}
        <div className="flex items-center gap-2 min-w-0">
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt="프로필"
              width={28}
              height={28}
              className="rounded-full flex-shrink-0"
            />
          )}
          <span className="text-sm text-gray-700 hidden sm:inline truncate max-w-[80px]">{session.user?.name}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm text-gray-500 hover:text-gray-700 flex-shrink-0 whitespace-nowrap"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
