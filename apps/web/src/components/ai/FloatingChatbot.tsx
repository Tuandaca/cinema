'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import axios from 'axios';
import { MovieListAi, ShowtimeListAi } from './AiCards';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  uiCards?: {
    type: 'MOVIE_LIST' | 'SHOWTIME_LIST';
    data: any;
  }[];
}

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
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    console.log('🤖 AI Chat calling:', `${API_URL}/ai/chat`);

    try {
      const response = await axios.post(`${API_URL}/ai/chat`, {
        message: userMessage,
        sessionId,
      }, {
        headers: {
          // If we had a token, we would add it here.
          // Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: response.data.text,
          uiCards: response.data.uiCards
        },
      ]);
      setSessionId(response.data.sessionId);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Xin lỗi, trợ lý đang bận một chút. Bạn vui lòng thử lại sau nhé!' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div
          className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-red-600/20 to-purple-600/20 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-600 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">CoiCine AI Buddy</h3>
                <p className="text-[10px] text-white/60">Trợ lý điện ảnh thông minh</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">
                  Chào bạn! Tôi có thể giúp bạn tìm phim, xem suất chiếu hoặc tư vấn phim theo tâm trạng.
                </p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={clsx(
                  'flex w-full',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={clsx(
                    'max-w-[85%] p-3 rounded-2xl text-sm',
                    msg.role === 'user'
                      ? 'bg-red-600 text-white rounded-tr-none'
                      : 'bg-white/10 text-white/90 rounded-tl-none border border-white/5'
                  )}
                >
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {msg.uiCards && msg.uiCards.length > 0 && (
                    <div className="mt-2 space-y-2 border-t border-white/5 pt-2">
                      {msg.uiCards.map((card, cardIndex) => {
                        if (card.type === 'MOVIE_LIST') {
                          return <MovieListAi key={cardIndex} movies={card.data} />;
                        }
                        if (card.type === 'SHOWTIME_LIST') {
                          return <ShowtimeListAi key={cardIndex} showtimes={card.data} />;
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none border border-white/5">
                  <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-black/40 border-t border-white/10">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Hỏi về phim, suất chiếu..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-red-600/50 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          console.log('Toggle chat, current state:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/20 hover:bg-red-700 transition-colors relative"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full"></span>
          </>
        )}
      </motion.button>
    </div>
  );
};
