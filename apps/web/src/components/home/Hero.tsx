"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Info, Ticket } from 'lucide-react';

const Hero = () => {
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
            Jake Sully and Neytiri must face a new threat as the Ash People emerge from the volcanic regions of Pandora, challenging everything they've fought for.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button className="flex items-center gap-3 px-8 py-4 bg-coicine-gold text-black rounded-full font-bold hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,215,0,0.4)]">
              <Ticket size={20} />
              Book Tickets Now
            </button>
            <button className="flex items-center gap-3 px-8 py-4 bg-white/10 glass rounded-full font-bold hover:bg-white/20 transition-all transform hover:scale-105">
              <Play size={20} />
              Watch Trailer
            </button>
            <button className="p-4 bg-white/5 hover:bg-white/15 rounded-full transition-all border border-white/10">
              <Info size={20} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Fade Out */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-coicine-charcoal to-transparent"></div>
    </section>
  );
};

export default Hero;
