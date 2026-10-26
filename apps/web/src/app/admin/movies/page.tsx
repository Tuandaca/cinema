'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { adminService } from '@/services/admin.service';
import ConfirmModal from '@/components/ui/ConfirmModal';
import CinematicPoster from '@/components/common/CinematicPoster';
import {
  Film,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

interface MovieItem {
  id: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  trailerUrl: string | null;
  status: 'NOW_SHOWING' | 'COMING_SOON';
  rating: number | null;
  runtime: number | null;
  released: string | null;
  genres: { id: string; name: string }[];
  _count?: { showtimes: number };
}

export default function AdminMoviesPage() {
  const { token } = useAuth();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<MovieItem | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<MovieItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    posterUrl: '',
    trailerUrl: '',
    status: 'NOW_SHOWING' as 'NOW_SHOWING' | 'COMING_SOON',
    rating: 8.0,
    runtime: 120,
    released: '',
    genres: '',
  });

  const fetchMovies = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await adminService.getMovies(token, {
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      setMovies(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error('Error fetching movies:', err);
      setActionMessage({ type: 'error', text: 'Không thể tải danh sách phim.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [token, page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMovies();
  };

  const handleSyncTrending = async () => {
    if (!token || syncing) return;
    try {
      setSyncing(true);
      setActionMessage(null);
      const res = await adminService.syncMovies(token, 10);
      setActionMessage({
        type: 'success',
        text: `Đồng bộ thành công ${res.synced || res.length || 10} phim mới từ Trakt/TMDB!`,
      });
      fetchMovies();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Đồng bộ phim thất bại.',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      description: '',
      posterUrl: '',
      trailerUrl: '',
      status: 'NOW_SHOWING',
      rating: 8.0,
      runtime: 120,
      released: new Date().toISOString().split('T')[0],
      genres: 'Hành Động, Phiêu Lưu',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (movie: MovieItem) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description || '',
      posterUrl: movie.posterUrl || '',
      trailerUrl: movie.trailerUrl || '',
      status: movie.status,
      rating: movie.rating || 8.0,
      runtime: movie.runtime || 120,
      released: movie.released ? movie.released.split('T')[0] : '',
      genres: movie.genres?.map((g) => g.name).join(', ') || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        posterUrl: formData.posterUrl,
        trailerUrl: formData.trailerUrl,
        status: formData.status,
        rating: Number(formData.rating),
        runtime: Number(formData.runtime),
        released: formData.released ? new Date(formData.released).toISOString() : undefined,
        genres: formData.genres.split(',').map((g) => g.trim()).filter(Boolean),
      };

      if (editingMovie) {
        await adminService.updateMovie(token, editingMovie.id, payload);
        setActionMessage({ type: 'success', text: `Đã cập nhật phim "${formData.title}"!` });
      } else {
        await adminService.createMovie(token, payload);
        setActionMessage({ type: 'success', text: `Đã tạo mới phim "${formData.title}"!` });
      }

      setIsModalOpen(false);
      fetchMovies();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Có lỗi xảy ra khi lưu phim.',
      });
    }
  };

  const handleDeleteMovie = (movie: MovieItem) => {
    setMovieToDelete(movie);
  };

  const confirmDeleteMovie = async () => {
    if (!token || !movieToDelete) return;
    setIsDeleting(true);

    try {
      await adminService.deleteMovie(token, movieToDelete.id);
      setActionMessage({ type: 'success', text: `Đã xóa phim "${movieToDelete.title}" thành công!` });
      setMovieToDelete(null);
      fetchMovies();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Không thể xóa phim này.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Quản Lý Danh Mục Phim
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tổng cộng {total} phim trong cơ sở dữ liệu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncTrending}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#E5A93C]' : ''}`} />
            <span>{syncing ? 'Đang sync TMDB...' : 'Sync TMDB / Trakt'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E5A93C] hover:bg-[#d4972d] text-black text-xs font-bold transition shadow-lg shadow-[#E5A93C]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Phim Mới</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              : 'bg-red-500/10 text-red-300 border-red-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#14141D] border border-zinc-800/80 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#E5A93C]"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-zinc-400">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-xs focus:outline-none focus:border-[#E5A93C]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="NOW_SHOWING">Đang Chiếu (NOW_SHOWING)</option>
            <option value="COMING_SOON">Sắp Chiếu (COMING_SOON)</option>
          </select>
        </div>
      </div>

      {/* Movies Table */}
      <div className="rounded-2xl bg-[#14141D] border border-zinc-800/80 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3.5">Phim</th>
                <th className="px-4 py-3.5">Thể loại</th>
                <th className="px-4 py-3.5">Thời lượng</th>
                <th className="px-4 py-3.5">Đánh giá</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Suất chiếu</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    <div className="w-6 h-6 border-2 border-[#E5A93C] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Đang tải danh sách phim...
                  </td>
                </tr>
              ) : movies.length > 0 ? (
                movies.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/30 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <CinematicPoster
                          src={m.posterUrl}
                          alt={m.title}
                          className="w-10 h-14 object-cover rounded-lg border border-zinc-700/80 shadow shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate max-w-[220px]">
                            {m.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 line-clamp-1 max-w-[260px]">
                            {m.description || 'Chưa có mô tả'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {m.genres?.slice(0, 2).map((g) => (
                          <span
                            key={g.id}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-zinc-300">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{m.runtime || 120}p</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{m.rating ? m.rating.toFixed(1) : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          m.status === 'NOW_SHOWING'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {m.status === 'NOW_SHOWING' ? 'Đang Chiếu' : 'Sắp Chiếu'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-zinc-300">
                      {m._count?.showtimes || 0} suất
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMovie(m)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                          title="Xóa phim"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500">
                    Không tìm thấy bộ phim nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              Trang {page} / {totalPages} (Tổng {total} phim)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#14141D] border border-zinc-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4">
              {editingMovie ? 'Chỉnh Sửa Phim' : 'Thêm Phim Mới'}
            </h2>

            <form onSubmit={handleSaveMovie} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Tên phim *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                  >
                    <option value="NOW_SHOWING">Đang Chiếu (NOW_SHOWING)</option>
                    <option value="COMING_SOON">Sắp Chiếu (COMING_SOON)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Thời lượng (phút)</label>
                  <input
                    type="number"
                    value={formData.runtime}
                    onChange={(e) => setFormData({ ...formData, runtime: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Điểm IMDb/Rating (0 - 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Ngày phát hành</label>
                  <input
                    type="date"
                    value={formData.released}
                    onChange={(e) => setFormData({ ...formData, released: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Thể loại (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="Hành Động, Viễn Tưởng, Tâm Lý"
                  value={formData.genres}
                  onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Link Poster Ảnh (URL)</label>
                <input
                  type="url"
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                  value={formData.posterUrl}
                  onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Link Trailer (YouTube URL)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.trailerUrl}
                  onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E5A93C] hover:bg-[#d4972d] text-black font-bold shadow-lg shadow-[#E5A93C]/20"
                >
                  {editingMovie ? 'Cập Nhật' : 'Tạo Phim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Movie Modal */}
      <ConfirmModal
        isOpen={!!movieToDelete}
        title="Xác nhận xóa phim"
        message={`Bạn có chắc chắn muốn xóa phim "${movieToDelete?.title}"? Hành động này sẽ xóa các dữ liệu liên quan và không thể hoàn tác.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDeleteMovie}
        onCancel={() => setMovieToDelete(null)}
      />
    </div>
  );
}
