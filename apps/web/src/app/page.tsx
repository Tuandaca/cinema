import { CINEMA_APP_NAME } from "@cinema/shared";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <h1 className="text-6xl font-bold tracking-tighter">
        Welcome to <span className="text-red-600">{CINEMA_APP_NAME}</span>
      </h1>
      <p className="mt-4 text-xl text-neutral-400">
        AI-Powered Movie Experience
      </p>
      <div className="mt-12 flex gap-4">
        <button className="px-8 py-3 bg-red-600 rounded-full font-bold hover:bg-red-700 transition-colors">
          Browse Movies
        </button>
        <button className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-colors">
          AI Assistant
        </button>
      </div>
    </main>
  );
}
