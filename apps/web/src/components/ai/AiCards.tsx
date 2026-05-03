import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, ChevronRight, Star } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  posterUrl?: string;
  rating?: number;
  genres?: { name: string }[];
}

interface Showtime {
  id: string;
  startTime: string;
  priceBase: number;
  room: {
    name: string;
  };
}

export const MovieListAi: React.FC<{ movies: Movie[] }> = ({ movies }) => {
  return (
    <div className="flex flex-col gap-3 mt-2">
      {movies.map((movie) => (
        <Link
          key={movie.id}
          href={`/movies/${movie.id}`}
          className="flex gap-3 p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group"
        >
          {movie.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-16 h-24 object-cover rounded-lg shadow-lg"
            />
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="text-white font-medium text-sm truncate group-hover:text-red-500 transition-colors">
              {movie.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs text-white/60">{movie.rating || 'N/A'}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {movie.genres?.slice(0, 2).map((g) => (
                <span key={g.name} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-white/40 rounded border border-white/5">
                  {g.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center px-2">
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
};

export const ShowtimeListAi: React.FC<{ showtimes: Showtime[] }> = ({ showtimes }) => {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {showtimes.map((st) => (
        <div
          key={st.id}
          className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-1 cursor-default hover:border-red-600/30 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-white/90">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span className="text-sm font-bold">
              {new Date(st.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
            <MapPin className="w-3 h-3" />
            <span>{st.room.name}</span>
          </div>
          <Link
            href={`/booking/${st.id}`}
            className="mt-1 text-center py-1 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-medium rounded transition-all"
          >
            Đặt vé
          </Link>
        </div>
      ))}
      {showtimes.length === 0 && (
        <p className="col-span-2 text-xs text-white/40 italic">Không còn suất chiếu nào cho ngày này.</p>
      )}
    </div>
  );
};
