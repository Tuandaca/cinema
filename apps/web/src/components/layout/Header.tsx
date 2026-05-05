"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { CINEMA_APP_NAME } from '@cinema/shared';
import { useAuth } from '@/providers/AuthProvider';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
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

  const navLinks = [
    { name: 'Movies', href: '/movies' },
    { name: 'Showtimes', href: '/showtimes' },
    { name: 'Promotions', href: '/promotions' },
    { name: 'About', href: '/about' },
  ];

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
            {CINEMA_APP_NAME.split(' ')[0]}<span className="text-white">{CINEMA_APP_NAME.split(' ').slice(1).join(' ')}</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="text-lg font-semibold hover:text-coicine-gold transition-colors duration-200"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-5">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Search size={20} />
          </button>

          {isAuthenticated ? (
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all"
              >
                <div className="w-6 h-6 bg-coicine-gold rounded-full flex items-center justify-center text-black text-xs font-bold">
                  {user?.name?.[0].toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm font-medium">{user?.name}</span>
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
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={32} />
              </button>
            </div>
            
            <nav className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className="text-2xl font-headline hover:text-coicine-gold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="mt-auto">
              {isAuthenticated ? (
                <button 
                  onClick={logout}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-red-500/20 text-red-500 rounded-xl text-lg font-bold"
                >
                  <LogOut size={20} />
                  Logout
                </button>
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
