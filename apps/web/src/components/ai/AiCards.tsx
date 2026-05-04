import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, ChevronRight, Star, Armchair, Popcorn, Building2, DollarSign, Film, Users } from 'lucide-react';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════
interface Movie {
  id: string;
  title: string;
  posterUrl?: string;
  rating?: number;
  runtime?: number;
  description?: string;
  genres?: { name: string }[];
  status?: string;
  released?: string;
  link?: string;
}

interface Showtime {
  id: string;
  startTime: string;
  endTime?: string;
  priceBase: number;
  movieId: string;
  room: {
    name: string;
    capacity?: number;
  };
}

interface Combo {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface SeatAvailability {
  total: number;
  available: number;
  booked: number;
  locked: number;
  vipAvailable: number;
  normalAvailable: number;
  bookingLink?: string;
}

interface TheaterInfo {
  theaterName: string;
  rooms: {
    id: string;
    name: string;
    capacity: number;
    totalSeats: number;
  }[];
  facilities: string[];
}

// ═══════════════════════════════════════════
// 🎬 Movie List Card
// ═══════════════════════════════════════════
export const MovieListAi: React.FC<{ movies: Movie[] }> = ({ movies }) => {
  if (!movies || movies.length === 0) {
    return <p className="text-xs text-white/40 italic mt-2">Không tìm thấy phim nào phù hợp.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5 mt-2">
      {movies.slice(0, 5).map((movie) => (
        <Link
          key={movie.id}
          href={`/movies/${movie.id}`}
          className="flex gap-3 p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group"
        >
          {movie.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-14 h-20 object-cover rounded-lg shadow-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <h4 className="text-white font-medium text-sm truncate group-hover:text-red-500 transition-colors">
              {movie.title}
            </h4>
            <div className="flex items-center gap-3 text-[10px] text-white/50">
              {movie.rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
                </span>
              )}
              {movie.runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {movie.runtime}p
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {movie.genres?.slice(0, 2).map((g) => (
                <span
                  key={g.name}
                  className="text-[9px] px-1.5 py-0.5 bg-white/5 text-white/40 rounded border border-white/5"
                >
                  {g.name}
                </span>
              ))}
              {movie.status === 'NOW_SHOWING' && (
                <span className="text-[9px] px-1.5 py-0.5 bg-green-600/10 text-green-400 rounded border border-green-600/20">
                  Đang chiếu
                </span>
              )}
              {movie.status === 'COMING_SOON' && (
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-600/10 text-blue-400 rounded border border-blue-600/20">
                  Sắp chiếu
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center px-1">
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
          </div>
        </Link>
      ))}
      {movies.length > 5 && (
        <p className="text-[10px] text-white/30 text-center">+ {movies.length - 5} phim khác</p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════
// 🎬 Movie Detail Card
// ═══════════════════════════════════════════
export const MovieDetailAi: React.FC<{ movie: Movie }> = ({ movie }) => {
  return (
    <div className="flex flex-col gap-3 mt-2 p-3 bg-white/5 border border-white/5 rounded-xl">
      <div className="flex gap-4">
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-20 h-28 object-cover rounded-lg shadow-xl flex-shrink-0"
          />
        )}
        <div className="flex-1 flex flex-col justify-start gap-1">
          <h4 className="text-white font-bold text-base leading-tight">{movie.title}</h4>
          <div className="flex items-center gap-3 text-xs text-white/60">
            {movie.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-white font-medium">
                  {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
                </span>
              </span>
            )}
            {movie.runtime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {movie.runtime} phút
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {movie.genres?.map((g) => (
              <span
                key={g.name}
                className="text-[10px] px-2 py-0.5 bg-red-600/10 text-red-400 rounded-full border border-red-600/20"
              >
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      {movie.description && (
        <p className="text-[11px] text-white/50 leading-relaxed line-clamp-3">{movie.description}</p>
      )}
      <div className="flex gap-2">
        <Link
          href={`/movies/${movie.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-white/10 text-white text-[11px] font-medium rounded-lg hover:bg-white/20 transition-all"
        >
          <Film className="w-3 h-3" /> Chi tiết
        </Link>
        <Link
          href={`/movies/${movie.id}/booking`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 transition-all"
        >
          🎟️ Đặt vé
        </Link>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// 🕐 Showtime List Card
// ═══════════════════════════════════════════
export const ShowtimeListAi: React.FC<{ showtimes: Showtime[] }> = ({ showtimes }) => {
  if (!showtimes || showtimes.length === 0) {
    return (
      <p className="text-xs text-white/40 italic mt-2">Không còn suất chiếu nào cho ngày này.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {showtimes.map((st) => (
        <Link
          key={st.id}
          href={`/movies/${st.movieId}/booking?showtimeId=${st.id}`}
          className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-1.5 hover:border-red-600/30 hover:bg-red-600/5 transition-all group"
        >
          <div className="flex items-center gap-1.5 text-white/90">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span className="text-sm font-bold">
              {new Date(st.startTime).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
            <MapPin className="w-3 h-3" />
            <span>{st.room.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-[10px]">
            <DollarSign className="w-3 h-3" />
            <span>{st.priceBase?.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="mt-0.5 text-center py-1 bg-red-600/10 group-hover:bg-red-600 text-red-500 group-hover:text-white text-[10px] font-medium rounded transition-all">
            Đặt vé
          </div>
        </Link>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════
// 🍿 Combo List Card
// ═══════════════════════════════════════════
export const ComboListAi: React.FC<{ combos: Combo[] }> = ({ combos }) => {
  if (!combos || combos.length === 0) {
    return <p className="text-xs text-white/40 italic mt-2">Chưa có combo nào.</p>;
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {combos.map((combo) => (
        <div
          key={combo.id}
          className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-start gap-3"
        >
          <div className="p-2 bg-amber-600/10 rounded-lg">
            <Popcorn className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium text-sm">{combo.name}</h4>
            <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{combo.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-sm font-bold text-amber-500">
              {combo.price?.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════
// 💺 Seat Availability Card
// ═══════════════════════════════════════════
export const SeatAvailabilityAi: React.FC<{ data: SeatAvailability }> = ({ data }) => {
  const pct = data.total > 0 ? Math.round((data.available / data.total) * 100) : 0;

  return (
    <div className="mt-2 p-3 bg-white/5 border border-white/5 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Armchair className="w-4 h-4 text-green-500" />
        <span className="text-sm font-bold text-white">Tình trạng ghế</span>
        <span
          className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
            pct > 50
              ? 'bg-green-600/10 text-green-400'
              : pct > 20
                ? 'bg-yellow-600/10 text-yellow-400'
                : 'bg-red-600/10 text-red-400'
          }`}
        >
          {pct}% trống
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex justify-between p-2 bg-green-600/5 rounded-lg">
          <span className="text-white/60">Ghế trống</span>
          <span className="font-bold text-green-400">{data.available}</span>
        </div>
        <div className="flex justify-between p-2 bg-red-600/5 rounded-lg">
          <span className="text-white/60">Đã đặt</span>
          <span className="font-bold text-red-400">{data.booked}</span>
        </div>
        <div className="flex justify-between p-2 bg-blue-600/5 rounded-lg">
          <span className="text-white/60">VIP trống</span>
          <span className="font-bold text-blue-400">{data.vipAvailable}</span>
        </div>
        <div className="flex justify-between p-2 bg-white/5 rounded-lg">
          <span className="text-white/60">Thường trống</span>
          <span className="font-bold text-white/80">{data.normalAvailable}</span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// 🏛️ Theater Info Card
// ═══════════════════════════════════════════
export const TheaterInfoAi: React.FC<{ data: TheaterInfo }> = ({ data }) => {
  return (
    <div className="mt-2 p-3 bg-white/5 border border-white/5 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-bold text-white">{data.theaterName}</span>
      </div>
      <div className="space-y-1.5 mb-3">
        {data.rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-[11px]"
          >
            <span className="text-white/80 font-medium">{room.name}</span>
            <span className="text-white/40 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {room.totalSeats} ghế
            </span>
          </div>
        ))}
      </div>
      {data.facilities && data.facilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.facilities.map((f, i) => (
            <span
              key={i}
              className="text-[9px] px-2 py-0.5 bg-purple-600/10 text-purple-400 rounded-full border border-purple-600/20"
            >
              ✨ {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
