"use client";

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime exception caught at App root:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[#1A1A1A] p-4">
      <div className="text-center p-8 border-4 border-black bg-white neo-shadow max-w-md w-full">
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tight text-red-500">ERROR</h1>
        <h2 className="text-lg font-black uppercase mb-4 tracking-tight">Application Exception</h2>
        <p className="text-xs text-stone-600 font-bold mb-6 leading-relaxed">
          A client-side layout thread encountered an unexpected state. Restoring local board synchronizer.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="bg-black text-[#FFB703] border-2 border-black px-4 py-2 text-xs font-black uppercase rounded-none hover:bg-stone-900 transition-all cursor-pointer"
          >
            Reset Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
