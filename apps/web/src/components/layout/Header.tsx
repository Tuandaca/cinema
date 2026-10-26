"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Menu, X, LogOut, LayoutDashboard, Ticket } from 'lucide-react';
import { CINEMA_APP_NAME } from '@cinema/shared';
import { useAuth } from '@/providers/AuthProvider';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'glass py-3 shadow-lg' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl font-headline font-bold text-coicine-gold tracking-tighter uppercase">
            COI<span className="text-white">CINE</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {/* Movies */}
          <Link 
            href="/movies"
            className="relative py-1 text-base font-semibold hover:text-coicine-gold transition-colors duration-200"
          >
            <span className={isActive('/movies') ? 'text-coicine-gold' : 'text-gray-200'}>
              Movies
            </span>
            {isActive('/movies') && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-coicine-gold shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>

          {/* Showtimes */}
          <Link 
            href="/showtimes"
            className="relative py-1 text-base font-semibold hover:text-coicine-gold transition-colors duration-200"
          >
            <span className={isActive('/showtimes') ? 'text-coicine-gold' : 'text-gray-200'}>
              Showtimes
            </span>
            {isActive('/showtimes') && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-coicine-gold shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>

          {/* Vé của tôi - directly in main navigation */}
          <Link 
            href="/profile/tickets"
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              pathname === '/profile/tickets'
                ? 'bg-coicine-gold text-black font-bold shadow-[0_0_20px_rgba(255,215,0,0.5)]'
                : isAuthenticated
                ? 'border border-coicine-gold/30 bg-coicine-gold/15 text-coicine-gold shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:bg-coicine-gold/25 hover:border-coicine-gold/60'
                : 'text-gray-300 hover:text-coicine-gold hover:bg-white/5'
            }`}
          >
            <Ticket 
              size={18} 
              className={pathname === '/profile/tickets' ? 'text-black' : 'text-coicine-gold'} 
            />
            <span>Vé của tôi</span>
            {isAuthenticated && pathname !== '/profile/tickets' && (
              <span className="w-2 h-2 rounded-full bg-coicine-gold animate-pulse shadow-[0_0_8px_#FFD700]" />
            )}
          </Link>

          {/* Promotions */}
          <Link 
            href="/promotions"
            className="relative py-1 text-base font-semibold hover:text-coicine-gold transition-colors duration-200"
          >
            <span className={isActive('/promotions') ? 'text-coicine-gold' : 'text-gray-200'}>
              Promotions
            </span>
            {isActive('/promotions') && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-coicine-gold shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>

          {/* About */}
          <Link 
            href="/about"
            className="relative py-1 text-base font-semibold hover:text-coicine-gold transition-colors duration-200"
          >
            <span className={isActive('/about') ? 'text-coicine-gold' : 'text-gray-200'}>
              About
            </span>
            {isActive('/about') && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-coicine-gold shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-5">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Search">
            <Search size={20} />
          </button>

          {isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all"
              >
                <div className="w-6 h-6 bg-coicine-gold rounded-full flex items-center justify-center text-black text-xs font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline text-sm font-medium">{user?.name || 'User'}</span>
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-56 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/5">
                      <p className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Signed in as</p>
                      <p className="font-bold truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      {user?.role === 'ADMIN' && (
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-cyan-400">
                          <LayoutDashboard size={18} />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link href="/profile/tickets" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-[#E5A93C]">
                        <Ticket size={18} />
                        Vé của tôi
                      </Link>
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/auth/login" className="hidden md:flex items-center gap-2 px-6 py-2 bg-coicine-gold text-black rounded-full text-sm font-bold hover:bg-yellow-400 transition-all transform hover:scale-105">
              <User size={18} />
              Login
            </Link>
          )}

          <button 
            className="md:hidden p-2 hover:bg-white/10 rounded-full"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-coicine-charcoal flex flex-col p-8"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="text-2xl font-headline font-bold text-coicine-gold">COICINE</span>
              <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close mobile menu">
                <X size={32} />
              </button>
            </div>
            
            <nav className="flex flex-col gap-6">
              <Link 
                href="/movies"
                className={`text-2xl font-headline ${isActive('/movies') ? 'text-coicine-gold font-bold' : 'hover:text-coicine-gold'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Movies
              </Link>
              <Link 
                href="/showtimes"
                className={`text-2xl font-headline ${isActive('/showtimes') ? 'text-coicine-gold font-bold' : 'hover:text-coicine-gold'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Showtimes
              </Link>
              
              {/* Vé của tôi on mobile main nav */}
              <Link 
                href="/profile/tickets"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 text-2xl font-headline ${
                  pathname === '/profile/tickets'
                    ? 'text-coicine-gold font-bold'
                    : isAuthenticated
                    ? 'text-coicine-gold font-semibold'
                    : 'text-gray-300 hover:text-coicine-gold'
                }`}
              >
                <Ticket size={24} className="text-coicine-gold" />
                <span>Vé của tôi</span>
                {isAuthenticated && (
                  <span className="w-2.5 h-2.5 rounded-full bg-coicine-gold animate-pulse shadow-[0_0_10px_#FFD700]" />
                )}
              </Link>

              <Link 
                href="/promotions"
                className={`text-2xl font-headline ${isActive('/promotions') ? 'text-coicine-gold font-bold' : 'hover:text-coicine-gold'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Promotions
              </Link>
              <Link 
                href="/about"
                className={`text-2xl font-headline ${isActive('/about') ? 'text-coicine-gold font-bold' : 'hover:text-coicine-gold'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
            </nav>

            <div className="mt-auto space-y-3">
              {isAuthenticated ? (
                <>
                  {user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#E5A93C] text-black rounded-xl text-base font-bold shadow-lg shadow-[#E5A93C]/20"
                    >
                      <LayoutDashboard size={20} />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/profile/tickets"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/20 rounded-xl text-base font-bold"
                  >
                    <Ticket size={20} />
                    Vé của tôi
                  </Link>
                  <button 
                    onClick={logout}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-500/20 text-red-500 rounded-xl text-base font-bold"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth/login" 
                  className="flex items-center justify-center gap-2 w-full py-4 bg-coicine-gold text-black rounded-xl text-lg font-bold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User size={20} />
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
