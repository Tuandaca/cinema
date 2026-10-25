'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { useAuth } from '@/providers/AuthProvider';
import {
  LayoutDashboard,
  Film,
  CalendarClock,
  Armchair,
  Ticket,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Clapperboard,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/movies', label: 'Quản lý Phim', icon: Film },
  { href: '/admin/showtimes', label: 'Suất Chiếu', icon: CalendarClock },
  { href: '/admin/theaters', label: 'Phòng & Ghế', icon: Armchair },
  { href: '/admin/bookings', label: 'Đơn Đặt Vé', icon: Ticket },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0A0A0E] text-zinc-100 flex flex-col md:flex-row">
        {/* SIDEBAR */}
        <aside className="w-full md:w-64 bg-[#121218] border-b md:border-b-0 md:border-r border-zinc-800/80 flex flex-col shrink-0 z-30">
          {/* Logo & Brand */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-800/60">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E5A93C] to-[#F5C76D] flex items-center justify-center text-black shadow-lg shadow-[#E5A93C]/20">
                <Clapperboard className="w-5 h-5 font-bold" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-wider text-white">
                  COI<span className="text-[#E5A93C]">CINE</span>
                </span>
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/20">
                  ADMIN
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            <p className="px-3 py-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Quản Trị Rạp
            </p>
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#E5A93C] text-black font-semibold shadow-md shadow-[#E5A93C]/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Actions Footer */}
          <div className="p-4 border-t border-zinc-800/60 space-y-3 bg-[#0F0F14]/50">
            {/* Admin User Info */}
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-[#E5A93C]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || 'System Admin'}
                </p>
                <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all border border-zinc-700/50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Trang chủ</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium transition-all border border-red-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 px-6 bg-[#121218]/80 backdrop-blur-md border-b border-zinc-800/60 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>CoiCine Management</span>
              <span>/</span>
              <span className="text-[#E5A93C] font-medium capitalize">
                {pathname.split('/')[2] || 'Dashboard'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Hệ thống trực tuyến</span>
              </div>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
