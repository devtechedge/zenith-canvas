export default function CanvasLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7F6]">
      {/* Sidebar Skeleton */}
      <aside className="w-64 h-screen bg-[#F4F7F6] border-r-2 border-[#1A1A1A] flex flex-col justify-between overflow-hidden animate-pulse">
        <div className="p-4 border-b-2 border-[#1A1A1A] bg-white h-16" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-8 bg-gray-200 border-2 border-[#1A1A1A]" />
          <div className="h-6 bg-gray-200 w-1/2" />
          <div className="space-y-2">
            <div className="h-8 bg-gray-200" />
            <div className="h-8 bg-gray-200" />
            <div className="h-8 bg-gray-200" />
          </div>
        </div>
        <div className="p-3 bg-white border-t-2 border-[#1A1A1A] h-20" />
      </aside>

      {/* Main Skeleton */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden animate-pulse">
        <header className="h-14 border-b-2 border-[#1A1A1A] bg-white px-6 flex items-center justify-between" />
        <div className="flex-1 overflow-y-auto">
          {/* Cover Placeholder */}
          <div className="h-56 w-full bg-gray-200 border-b-2 border-[#1A1A1A]" />

          {/* Title Area Placeholder */}
          <div className="max-w-4xl mx-auto px-6 pt-8 space-y-4">
            <div className="w-16 h-16 border-4 border-[#1A1A1A] bg-gray-200" />
            <div className="h-12 bg-gray-200 w-3/4 border-2 border-[#1A1A1A]" />
          </div>

          {/* Block Skeletons */}
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            <div className="h-6 bg-gray-200 w-1/3" />
            <div className="h-24 bg-gray-200 border-2 border-[#1A1A1A]" />
            <div className="h-6 bg-gray-200 w-1/2" />
            <div className="h-32 bg-gray-200 border-2 border-[#1A1A1A]" />
          </div>
        </div>
      </div>
    </div>
  );
}
