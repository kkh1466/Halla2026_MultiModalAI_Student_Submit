"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Carrot,
  UtensilsCrossed,
  Calculator,
  BarChart3,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  userName: string;
}

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/ingredients", label: "식재료 관리", icon: Carrot },
  { href: "/recipes", label: "레시피 등록", icon: UtensilsCrossed },
  { href: "/cost", label: "원가 계산", icon: Calculator },
  { href: "/reports", label: "리포트", icon: BarChart3 },
];

export default function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">푸드코스트</h1>
        <p className="text-sm text-gray-500 mt-1">{userName}님</p>
      </div>

      <nav className="flex-1 p-4 space-y-1" aria-label="메인 네비게이션">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              data-testid={`sidebar-nav-${item.href.slice(1)}`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 w-full transition-colors"
          data-testid="sidebar-logout-button"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
