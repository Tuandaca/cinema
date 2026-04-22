import Hero from "@/components/home/Hero";
import MovieCard from "@/components/movies/MovieCard";

export default function Home() {
  const trendingMovies = [
    {
      title: "Avatar: Fire and Ash",
      posterUrl: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop",
      rating: "9.8",
      duration: "162 min",
      genre: ["Action", "Sci-Fi"]
    },
    {
      title: "Project Hail Mary",
      posterUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2072&auto=format&fit=crop",
      rating: "9.5",
      duration: "135 min",
      genre: ["Sci-Fi", "Drama"]
    },
    {
      title: "The Super Mario Galaxy",
      posterUrl: "https://images.unsplash.com/photo-1605898835518-20380ce40b4a?q=80&w=2070&auto=format&fit=crop",
      rating: "8.9",
      duration: "105 min",
      genre: ["Animation", "Adventure"]
    },
    {
      title: "Balls Up",
      posterUrl: "https://images.unsplash.com/photo-1542010589005-d1eabbad53c2?q=80&w=2070&auto=format&fit=crop",
      rating: "8.2",
      duration: "110 min",
      genre: ["Action", "Comedy"]
    },
  ];

  return (
    <div className="flex flex-col w-full">
      <Hero />
      
      {/* Trending Section */}
      <section className="py-24 container mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-headline font-bold mb-2">Trending Now</h2>
            <p className="text-gray-400">Most watched movies this week</p>
          </div>
          <button className="text-coicine-gold font-bold hover:underline">View All</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trendingMovies.map((movie, index) => (
            <MovieCard key={index} {...movie} />
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-24 container mx-auto px-6">
        <div className="relative h-64 w-full rounded-3xl overflow-hidden glass border border-white/10 flex items-center p-12">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-coicine-gold/20 to-transparent"></div>
          <div className="relative z-10 max-w-lg">
            <h3 className="text-3xl font-headline font-bold mb-4">Join CoiCine Membership</h3>
            <p className="text-gray-300 mb-6">Get 20% off on all tickets and exclusive access to early premieres.</p>
            <button className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-coicine-gold transition-colors">
              Sign Up Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
