'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import axios from 'axios';
import {
  MovieListAi,
  ShowtimeListAi,
  MovieDetailAi,
  ComboListAi,
  SeatAvailabilityAi,
  TheaterInfoAi,
} from './AiCards';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

interface UiCard {
  type: 'MOVIE_LIST' | 'SHOWTIME_LIST' | 'MOVIE_DETAIL' | 'COMBO_LIST' | 'SEAT_AVAILABILITY' | 'THEATER_INFO';
  data: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  uiCards?: UiCard[];
}

const QUICK_SUGGESTIONS = [
  { emoji: '🎬', text: 'Đang chiếu phim gì?' },
  { emoji: '⭐', text: 'Gợi ý phim hay' },
  { emoji: '🍿', text: 'Xem combo bắp nước' },
  { emoji: '🏛️', text: 'Thông tin rạp' },
];

export const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: messageText }]);
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/ai/chat`,
        { message: messageText, sessionId },
        { timeout: 30000 },
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.text || '',
          uiCards: response.data.uiCards,
        },
      ]);
      setSessionId(response.data.sessionId);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg =
        error.code === 'ECONNABORTED'
          ? 'Kết nối bị timeout. Bạn thử lại nhé!'
          : 'Xin lỗi, trợ lý đang bận một chút. Bạn vui lòng thử lại sau nhé! 😅';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input.trim());

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  const renderCard = (card: UiCard, index: number) => {
    switch (card.type) {
      case 'MOVIE_LIST':
        return <MovieListAi key={index} movies={card.data} />;
      case 'MOVIE_DETAIL':
        return <MovieDetailAi key={index} movie={card.data} />;
      case 'SHOWTIME_LIST':
        return <ShowtimeListAi key={index} showtimes={card.data} />;
      case 'COMBO_LIST':
        return <ComboListAi key={index} combos={card.data} />;
      case 'SEAT_AVAILABILITY':
        return <SeatAvailabilityAi key={index} data={card.data} />;
      case 'THEATER_INFO':
        return <TheaterInfoAi key={index} data={card.data} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[360px] sm:w-[420px] h-[550px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-red-600/20 to-purple-600/20 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-600 rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">CoiCine AI Buddy</h3>
                  <p className="text-[10px] text-white/60">Trợ lý điện ảnh thông minh</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleNewChat}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  title="Cuộc trò chuyện mới"
                >
                  <RotateCcw className="w-4 h-4 text-white/60" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
            >
              {/* Welcome Screen */}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                    <Sparkles className="w-7 h-7 text-red-500" />
                  </div>
                  <h4 className="text-white font-bold mb-1">Xin chào! 👋</h4>
                  <p className="text-white/40 text-xs mb-5 max-w-[250px]">
                    Tôi có thể giúp bạn tìm phim, xem lịch chiếu, gợi ý phim, kiểm tra ghế trống và nhiều hơn nữa!
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {QUICK_SUGGESTIONS.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(suggestion.text)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-left transition-all group"
                      >
                        <span className="text-base">{suggestion.emoji}</span>
                        <p className="text-[11px] text-white/60 group-hover:text-white/80 mt-1 leading-tight">
                          {suggestion.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={clsx(
                    'flex w-full',
                    msg.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={clsx(
                      'max-w-[90%] rounded-2xl text-sm',
                      msg.role === 'user'
                        ? 'bg-red-600 text-white rounded-tr-none p-3'
                        : 'bg-white/[0.07] text-white/90 rounded-tl-none border border-white/5 p-3',
                    )}
                  >
                    {msg.content && (
                      <div className="prose prose-invert prose-sm max-w-none [&>p]:mb-1.5 [&>ul]:mt-1 [&>ol]:mt-1 [&>p:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}

                    {msg.uiCards && msg.uiCards.length > 0 && (
                      <div className={clsx('space-y-2', msg.content && 'border-t border-white/5 pt-2 mt-2')}>
                        {msg.uiCards.map((card, cardIndex) => renderCard(card, cardIndex))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.07] p-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    <span className="text-[11px] text-white/40">Đang suy nghĩ...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-black/40 border-t border-white/10">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Hỏi về phim, suất chiếu, combo..."
                  disabled={isLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-600/50 disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-600 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/30 hover:bg-red-700 transition-colors relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full animate-pulse" />
        )}
      </motion.button>
    </div>
  );
};
