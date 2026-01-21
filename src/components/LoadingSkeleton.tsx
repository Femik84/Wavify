import React from "react";

interface LoadingSkeletonProps {
  isDark: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ isDark }) => {
  const bgColor = isDark ? "bg-black" : "bg-gray-50";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const skeletonBg = isDark ? "bg-gray-800" : "bg-gray-200";
  const headerBg = isDark ? "bg-zinc-900" : "bg-white";

  return (
    <div className={`min-h-screen ${bgColor} ${textPrimary} transition-colors duration-300 pb-20 lg:pb-29`}>
      {/* Header Skeleton */}
      <header className={`${headerBg} border-b ${isDark ? "border-zinc-800" : "border-gray-200"} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className={`h-8 w-32 ${skeletonBg} rounded animate-pulse`} />
            
            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-6">
              <div className={`h-4 w-16 ${skeletonBg} rounded animate-pulse`} />
              <div className={`h-4 w-16 ${skeletonBg} rounded animate-pulse`} />
              <div className={`h-4 w-16 ${skeletonBg} rounded animate-pulse`} />
            </div>
            
            {/* Right Side Icons */}
            <div className="flex items-center gap-4">
              <div className={`h-8 w-8 ${skeletonBg} rounded-full animate-pulse`} />
              <div className={`h-8 w-8 ${skeletonBg} rounded-full animate-pulse`} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-8">
          {/* Hero Skeleton - Mobile */}
          <div className={`h-56 ${skeletonBg} rounded-2xl animate-pulse`} />
          
          {/* Trending Section Title */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={`h-7 w-40 ${skeletonBg} rounded animate-pulse`} />
              <div className={`h-5 w-16 ${skeletonBg} rounded animate-pulse`} />
            </div>
            
            {/* Horizontal Scrolling Cards */}
            <div className="flex gap-2 overflow-hidden">
              <div className={`h-48 ${skeletonBg} rounded-2xl animate-pulse flex-shrink-0`} style={{ width: 'calc((100% - 20px) / 2.5)' }} />
              <div className={`h-48 ${skeletonBg} rounded-2xl animate-pulse flex-shrink-0`} style={{ width: 'calc((100% - 20px) / 2.5)' }} />
              <div className={`h-48 ${skeletonBg} rounded-2xl animate-pulse flex-shrink-0`} style={{ width: 'calc((100% - 20px) / 2.5)' }} />
            </div>
          </div>
          
          {/* Made For You Section */}
          <div className="space-y-4">
            <div className={`h-7 w-36 ${skeletonBg} rounded animate-pulse`} />
            <div className="grid grid-cols-1 gap-4">
              <div className={`h-24 ${skeletonBg} rounded-2xl animate-pulse`} />
              <div className={`h-24 ${skeletonBg} rounded-2xl animate-pulse`} />
            </div>
          </div>
          
          {/* Recently Played Section */}
          <div className="space-y-4">
            <div className={`h-7 w-44 ${skeletonBg} rounded animate-pulse`} />
            <div className="grid grid-cols-1 gap-4">
              <div className={`h-20 ${skeletonBg} rounded-2xl animate-pulse`} />
              <div className={`h-20 ${skeletonBg} rounded-2xl animate-pulse`} />
            </div>
          </div>
          
          {/* Genres Section */}
          <div className="space-y-4">
            <div className={`h-7 w-40 ${skeletonBg} rounded animate-pulse`} />
            <div className="grid grid-cols-2 gap-4">
              <div className={`h-32 ${skeletonBg} rounded-2xl animate-pulse`} />
              <div className={`h-32 ${skeletonBg} rounded-2xl animate-pulse`} />
              <div className={`h-32 ${skeletonBg} rounded-2xl animate-pulse`} />
              <div className={`h-32 ${skeletonBg} rounded-2xl animate-pulse`} />
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-[400px_1fr] lg:gap-8">
          {/* Left Column - Trending */}
          <div className="flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex items-center gap-3 mb-6">
              <div className={`h-8 w-8 ${skeletonBg} rounded animate-pulse`} />
              <div className={`h-8 w-40 ${skeletonBg} rounded animate-pulse`} />
            </div>
            
            <div className={`${isDark ? "bg-white/5 border-white/5" : "bg-white border-gray-200"} rounded-xl border flex-1 p-6 space-y-3`}>
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="flex items-center gap-4 animate-pulse">
                  <div className={`h-6 w-6 ${skeletonBg} rounded`} />
                  <div className={`h-12 w-12 ${skeletonBg} rounded-md`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 w-3/4 ${skeletonBg} rounded`} />
                    <div className={`h-3 w-1/2 ${skeletonBg} rounded`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-12 overflow-y-auto h-[calc(100vh-12rem)]">
            {/* Hero Skeleton - Desktop */}
            <div className={`h-64 ${skeletonBg} rounded-3xl animate-pulse`} />
            
            {/* Made For You Section */}
            <div className="space-y-6">
              <div className={`h-8 w-40 ${skeletonBg} rounded animate-pulse`} />
              <div className="grid grid-cols-2 gap-6">
                <div className={`h-24 ${skeletonBg} rounded-2xl animate-pulse`} />
                <div className={`h-24 ${skeletonBg} rounded-2xl animate-pulse`} />
              </div>
            </div>
            
            {/* Recently Played Section */}
            <div className="space-y-6">
              <div className={`h-8 w-44 ${skeletonBg} rounded animate-pulse`} />
              <div className="grid grid-cols-2 gap-4">
                <div className={`h-24 ${skeletonBg} rounded-2xl animate-pulse`} />
                <div className={`h-24 ${skeletonBg} rounded-2xl animate-pulse`} />
              </div>
            </div>
            
            {/* Genres Section */}
            <div className="space-y-6 pb-8">
              <div className={`h-8 w-40 ${skeletonBg} rounded animate-pulse`} />
              <div className="grid grid-cols-4 gap-4">
                <div className={`h-32 ${skeletonBg} rounded-2xl animate-pulse`} />
                <div className={`h-32 ${skeletonBg} rounded-2xl animate-pulse`} />
                <div className={`h-32 ${skeletonBg} rounded-2xl animate-pulse`} />
                <div className={`h-32 ${skeletonBg} rounded-2xl animate-pulse`} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className={`${headerBg} border-t ${isDark ? "border-zinc-800" : "border-gray-200"} fixed bottom-0 left-0 right-0 z-30`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Song Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`h-14 w-14 ${skeletonBg} rounded-lg animate-pulse flex-shrink-0`} />
              <div className="space-y-2 flex-1 min-w-0">
                <div className={`h-4 w-32 ${skeletonBg} rounded animate-pulse`} />
                <div className={`h-3 w-24 ${skeletonBg} rounded animate-pulse`} />
              </div>
            </div>
            
            {/* Center - Controls (Hidden on Mobile) */}
            <div className="hidden lg:flex items-center gap-4 flex-1 justify-center">
              <div className={`h-8 w-8 ${skeletonBg} rounded-full animate-pulse`} />
              <div className={`h-10 w-10 ${skeletonBg} rounded-full animate-pulse`} />
              <div className={`h-8 w-8 ${skeletonBg} rounded-full animate-pulse`} />
            </div>
            
            {/* Right - Volume (Hidden on Mobile) */}
            <div className="hidden lg:flex items-center gap-3 flex-1 justify-end">
              <div className={`h-8 w-8 ${skeletonBg} rounded-full animate-pulse`} />
              <div className={`h-2 w-24 ${skeletonBg} rounded-full animate-pulse`} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoadingSkeleton;