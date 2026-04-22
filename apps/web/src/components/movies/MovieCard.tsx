"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, Play } from 'lucide-react';

interface MovieCardProps {
  title: string;
  posterUrl: string;
  rating: string;
  duration: string;
  genre: string[];
}

const MovieCard = ({ title, posterUrl, rating, duration, genre }: MovieCardProps) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group relative bg-coicine-ebony rounded-2xl overflow-hidden cursor-pointer"
    >
      {/* Poster Image */}
      <div className="aspect-[2/3] overflow-hidden relative">
        <img 
          src={posterUrl} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-16 h-16 bg-coicine-gold text-black rounded-full flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-300">
            <Play size={32} fill="black" />
          </div>
        </div>
        
        {/* Rating Badge */}
        <div className="absolute top-4 right-4 glass px-2 py-1 rounded-lg flex items-center gap-1">
          <Star size={12} className="text-coicine-gold fill-coicine-gold" />
          <span className="text-[10px] font-bold">{rating}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
          {genre.map((g, i) => (
            <span key={i} className="px-2 py-0.5 border border-white/10 rounded-full">{g}</span>
          ))}
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={10} />
            {duration}
          </span>
        </div>
        <h3 className="font-headline font-bold text-lg group-hover:text-coicine-gold transition-colors truncate">
          {title}
        </h3>
      </div>
    </motion.div>
  );
};

export default MovieCard;
