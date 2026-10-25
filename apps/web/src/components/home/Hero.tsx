"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Ticket, X } from 'lucide-react';

const Hero = () => {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const handleBookTickets = () => {
    const trendingEl = document.getElementById('trending-section');
    if (trendingEl) {
      trendingEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Media (Video or Image) */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" 
          alt="Avatar: Fire and Ash" 
          className="w-full h-full object-cover"
        />
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-coicine-charcoal via-coicine-charcoal/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-coicine-charcoal via-transparent to-coicine-charcoal/30"></div>
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-6 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded uppercase tracking-widest">Trending</span>
            <span className="text-coicine-gold text-sm font-bold">★ 9.8 Rating</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-headline font-bold mb-6 leading-tight tracking-tighter">
            AVATAR:<br />
            <span className="text-coicine-gold">FIRE AND ASH</span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl mb-10 leading-relaxed max-w-xl">
            Jake Sully and Neytiri must face a new threat as the Ash People emerge from the volcanic regions of Pandora, challenging everything they&apos;ve fought for.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={handleBookTickets}
              className="flex items-center gap-3 px-8 py-4 bg-coicine-gold text-black rounded-full font-bold hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,215,0,0.4)] cursor-pointer"
            >
              <Ticket size={20} />
              Book Tickets Now
            </button>
            <button 
              onClick={() => setIsTrailerOpen(true)}
              className="flex items-center gap-3 px-8 py-4 bg-white/10 glass rounded-full font-bold hover:bg-white/20 transition-all transform hover:scale-105 cursor-pointer"
            >
              <Play size={20} />
              Watch Trailer
            </button>
            <button 
              onClick={handleBookTickets}
              aria-label="View movies info"
              className="p-4 bg-white/5 hover:bg-white/15 rounded-full transition-all border border-white/10 cursor-pointer"
            >
              <Info size={20} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Fade Out */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-coicine-charcoal to-transparent"></div>

      {/* Trailer Modal */}
      <AnimatePresence>
        {isTrailerOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsTrailerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <Play size={18} className="text-coicine-gold" />
                  <h3 className="font-bold text-white text-lg">
                    Trailer: Avatar: Fire and Ash
                  </h3>
                </div>
                <button
                  onClick={() => setIsTrailerOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                  aria-label="Close trailer modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video Player Embed */}
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src="https://www.youtube.com/embed/d9MyW72ELq0?autoplay=1&rel=0"
                  title="Trailer: Avatar: Fire and Ash"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Hero;
