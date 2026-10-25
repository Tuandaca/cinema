'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?callbackUrl=/admin');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D11] text-white">
        <div className="w-12 h-12 border-4 border-[#E5A93C] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 text-sm font-medium">Đang kiểm tra quyền quản trị...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D11] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Truy Cập Bị Từ Chối</h1>
        <p className="text-zinc-400 max-w-md mb-6 text-sm">
          Tài khoản của bạn ({user?.email}) không có quyền Quản trị viên (Role: {user?.role || 'USER'}). Vui lòng đăng nhập bằng tài khoản Quản trị để tiếp tục.
        </p>
        <div className="flex gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm transition-all"
          >
            Về Trang Chủ
          </Link>
          <Link
            href="/auth/login?callbackUrl=/admin"
            className="px-5 py-2.5 rounded-xl bg-[#E5A93C] hover:bg-[#d4972d] text-black font-semibold text-sm transition-all shadow-lg shadow-[#E5A93C]/20"
          >
            Đăng Nhập Quản Trị
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
