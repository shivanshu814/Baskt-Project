'use client';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#010b1d] to-[#011330]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
          <div className="absolute inset-0 h-24 w-24 rounded-full border-2 border-white/5 border-r-blue-500 animate-spin-slow" />
        </div>
        <p className="text-lg text-white/60 animate-pulse mt-6">Loading...</p>
      </div>
    </div>
  );
}
