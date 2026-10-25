import type { Metadata } from 'next';
import MovieDetailView from '@/components/movies/MovieDetailView';
import { Movie } from '@/services/movie.service';

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

async function fetchMovie(id: string): Promise<Movie | null> {
  try {
    const apiUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:3006/api';

    const res = await fetch(`${apiUrl}/movies/${id}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    // Graceful offline fallback during build/SSR if API is unreachable
    return null;
  }
}

export async function generateMetadata({
  params,
}: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const movie = await fetchMovie(id);

  if (!movie) {
    return {
      title: 'Chi Tiết Phim | CoiCine',
      description:
        'Xem thông tin chi tiết, lịch chiếu và đặt vé xem phim trực tuyến tại rạp CoiCine.',
      openGraph: {
        title: 'Chi Tiết Phim | CoiCine',
        description:
          'Xem thông tin chi tiết, lịch chiếu và đặt vé xem phim trực tuyến tại rạp CoiCine.',
        type: 'video.movie',
        siteName: 'CoiCine',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Chi Tiết Phim | CoiCine',
        description:
          'Xem thông tin chi tiết, lịch chiếu và đặt vé xem phim trực tuyến tại rạp CoiCine.',
      },
    };
  }

  const title = `${movie.title} | CoiCine`;
  const description =
    movie.description ||
    `Xem thông tin chi tiết, lịch chiếu và đặt vé xem phim ${movie.title} với trải nghiệm điện ảnh đỉnh cao tại CoiCine.`;
  const imageUrl =
    movie.backdropUrl || movie.posterUrl || '/images/og-default.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'video.movie',
      siteName: 'CoiCine',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: movie.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function MovieDetailPage({ params }: MoviePageProps) {
  const { id } = await params;
  const movie = await fetchMovie(id);

  return <MovieDetailView id={id} initialMovie={movie} />;
}
