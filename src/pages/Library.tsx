import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  SlidersHorizontal,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import {
  fetchArtists,
  fetchSongs,
  getRecentlyPlayed,
  trackRecentlyPlayed,
  type Song,
  type Artist,
} from "../Data";

import Header from "../components/Header";
import MobileSidebar from "../components/MobileSidebar";
import Footer from "../components/Footer";

import { useAudio, audioService } from "../lib/audioService";
import { useTheme } from "../contexts/ThemeContext";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { saveLibraryCache, loadLibraryCache } from "../lib/LibraryUtils";

// Utility function to safely get artist name
function getArtistName(artist: any): string {
  if (!artist) return "Unknown Artist";
  return typeof artist === "string" ? artist : artist.name || "Unknown Artist";
}

/**
 * Song List Item Component
 */
const SongListItem = ({
  song,
  index,
  isPlaying,
  isDark,
  onPlay,
}: {
  song: Song;
  index: number;
  isPlaying: boolean;
  isDark: boolean;
  onPlay: () => void;
}) => {
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg ${hoverBg} transition-all duration-300 cursor-pointer group`}
      onClick={onPlay}
    >
      <div className={`text-2xl font-bold w-8 ${textSecondary} hidden lg:block`}>
        {index + 1}
      </div>

      <div className="w-14 h-14 rounded-md overflow-hidden shrink-0 shadow-md relative">
        <img
          src={song.cover}
          alt={`${song.title} artwork`}
          className="w-full h-full object-cover block"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          width={56}
          height={56}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold truncate ${textPrimary}`}>{song.title}</h3>
        <p className={`text-sm truncate ${textSecondary}`}>{getArtistName(song.artist)}</p>
      </div>

      <div className={`text-sm ${textSecondary} hidden md:block min-w-[100px] truncate`}>
        {song.album}
      </div>

      <div className={`text-sm ${textSecondary} hidden lg:block`}>
        {song.duration}
      </div>

      <button
        aria-label={`Play ${song.title}`}
        className={`bg-red-600 rounded-full p-2 transition-all duration-300 shrink-0`}
        onClick={(e) => {
          e.stopPropagation();
          onPlay();
        }}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-white fill-white" />
        ) : (
          <Play className="w-4 h-4 text-white" />
        )}
      </button>
    </div>
  );
};

/**
 * Artist Card Component
 */
const ArtistCard = ({
  artist,
  isDark,
  onClick,
}: {
  artist: Artist;
  isDark: boolean;
  onClick: () => void;
}) => {
  const cardBg = isDark ? "bg-white/5" : "bg-white";
  const cardHoverBg = isDark ? "hover:bg-white/7" : "hover:bg-gray-100";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  const followersText = artist.followers ? `${artist.followers} followers` : "Artist";

  return (
    <div
      className={`shrink-0 w-48 ${cardBg} rounded-lg p-4 cursor-pointer transition-all duration-300 ${cardHoverBg} hover:scale-105 hover:shadow-2xl group`}
      style={{ scrollSnapAlign: "start" }}
      onClick={onClick}
    >
      <div className="w-full aspect-square rounded-full mb-4 overflow-hidden mx-auto shadow-lg">
        <img
          src={artist.image}
          alt={`${artist.name} portrait`}
          className="w-full h-full object-cover block"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          width={192}
          height={192}
        />
      </div>

      <h3 className={`font-semibold text-center truncate ${textPrimary}`}>{artist.name}</h3>
      <p className={`text-sm text-center ${textSecondary}`}>{followersText}</p>
    </div>
  );
};

/**
 * Main Library Component
 */
export default function Library() {
  const navigate = useNavigate();
  const { setTheme, isDark } = useTheme();

  // Sidebar state + ref
  const [sidebarOpen, setSidebarOpenState] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const [, setHoveredCard] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "title" | "artist">("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const recentlyPlayedRef = useRef<HTMLDivElement>(null);
  const artistsRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const { state, setPlaylist, playTrackAtIndex, togglePlay } = useAudio();

  // Local state loaded from backend
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<Artist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initRef = useRef(false);

  // Safe open/close for sidebar:
  const openSidebar = () => setSidebarOpenState(true);
  const closeSidebar = () => {
    try {
      const active = document.activeElement as HTMLElement | null;
      if (active && sidebarRef.current && sidebarRef.current.contains(active)) {
        active.blur();
      }
    } catch {
      // ignore
    }
    setSidebarOpenState(false);
  };

  // Sort liked songs based on selected criteria
  const sortedLikedSongs = React.useMemo(() => {
    const songs = [...likedSongs];
    
    switch (sortBy) {
      case "title":
        return songs.sort((a, b) => a.title.localeCompare(b.title));
      case "artist":
        return songs.sort((a, b) => 
          getArtistName(a.artist).localeCompare(getArtistName(b.artist))
        );
      case "recent":
      default:
        return songs;
    }
  }, [likedSongs, sortBy]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };

    if (showSortMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortMenu]);

  // Load data once on mount - with localStorage caching
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let cancelled = false;

    const load = async () => {
      // Try to load from cache first - INSTANT display
      const cached = loadLibraryCache();
      if (cached) {
        setLikedSongs(cached.likedSongs);
        setFavoriteArtists(cached.favoriteArtists);
        setRecentlyPlayed(cached.recentlyPlayed);
        setLoading(false);
        
        // Initialize audio service with cached data
        const svcState = audioService.getState();
        if (
          !initRef.current &&
          (!svcState.playlist || svcState.playlist.length === 0) &&
          cached.likedSongs.length > 0
        ) {
          setPlaylist(cached.likedSongs, 0);
          initRef.current = true;
        }
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        // Fetch fresh data from backend
        const [artistsResp, songs, recentResp] = await Promise.all([
          fetchArtists({ signal }),
          fetchSongs({ signal }),
          getRecentlyPlayed({ signal }),
        ]);

        if (cancelled) return;

        const favorites = (artistsResp || []).filter((a: any) => !!a.isFavorite);
        const liked = songs.filter((s) => s.isLiked);
        const recent = (recentResp || []).slice(0, 8);

        setFavoriteArtists(favorites);
        setLikedSongs(liked);
        setRecentlyPlayed(recent);

        // Save fresh data to cache
        saveLibraryCache({
          likedSongs: liked,
          favoriteArtists: favorites,
          recentlyPlayed: recent
        });

        // Initialize audio session playlist
        const svcState = audioService.getState();
        if (
          !initRef.current &&
          (!svcState.playlist || svcState.playlist.length === 0) &&
          liked.length > 0
        ) {
          setPlaylist(liked, 0);
          initRef.current = true;
        }
      } catch (err) {
        if ((err as any)?.name === "CanceledError" || (err as any)?.name === "AbortError") {
          return;
        }
        console.error("Error loading library data:", err);
        if (!cancelled) setError("Failed to load your library. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play liked song with backend tracking
  const handlePlaySong = async (index: number) => {
    if (!sortedLikedSongs || sortedLikedSongs.length === 0) return;
    const idx = Math.max(0, Math.min(index, sortedLikedSongs.length - 1));
    const song = sortedLikedSongs[idx];
    
    setPlaylist(sortedLikedSongs, idx);
    playTrackAtIndex(idx);

    // Optimistically update recently played
    const newRecent = [song, ...recentlyPlayed.filter(s => s.id !== song.id)].slice(0, 8);
    setRecentlyPlayed(newRecent);
    
    // Save to localStorage immediately
    saveLibraryCache({
      likedSongs,
      favoriteArtists,
      recentlyPlayed: newRecent
    });

    // Track play in backend (background)
    try {
      await trackRecentlyPlayed(song.id);
    } catch (err) {
      console.error("Failed to track play:", err);
    }

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      navigate(
        `/now-playing?track=${idx}&title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(
          getArtistName(song.artist)
        )}`
      );
    }
  };

  // Play recently played item with backend tracking
  const handlePlayRecentItem = async (item: Song) => {
    if (!recentlyPlayed || recentlyPlayed.length === 0) return;
    const audioUrl = item.audio;
    const recentIndex = recentlyPlayed.findIndex((s) => s.audio === audioUrl);

    if (recentIndex !== -1) {
      setPlaylist(recentlyPlayed, recentIndex);
      playTrackAtIndex(recentIndex);

      // Optimistically update recently played
      const newRecent = [item, ...recentlyPlayed.filter(s => s.id !== item.id)].slice(0, 8);
      setRecentlyPlayed(newRecent);
      
      // Save to localStorage immediately
      saveLibraryCache({
        likedSongs,
        favoriteArtists,
        recentlyPlayed: newRecent
      });

      // Track play in backend (background)
      try {
        await trackRecentlyPlayed(item.id);
      } catch (err) {
        console.error("Failed to track play:", err);
      }

      if (typeof window !== "undefined" && window.innerWidth < 768) {
        navigate(
          `/now-playing?track=${recentIndex}&title=${encodeURIComponent(item.title)}&artist=${encodeURIComponent(
            getArtistName(item.artist)
          )}`
        );
      }
    }
  };

  // Navigate to artist page
  const navigateToArtist = (name: string) => {
    navigate(`/artist/${encodeURIComponent(name)}`);
  };

  function scrollContainer(ref: { current: HTMLElement | null }, direction: "left" | "right") {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 300);
    const delta = direction === "left" ? -amount : amount;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  // Theme-based styling
  const bgColor = isDark ? "bg-black" : "bg-gray-50";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const chartContainerBg = isDark ? "bg-white/5" : "bg-white";
  const chartContainerBorder = isDark ? "border-white/5" : "border-gray-200";
  const cardBg = isDark ? "bg-white/5" : "bg-white";
  const cardHoverBg = isDark ? "hover:bg-white/7" : "hover:bg-gray-100";

  const hideScrollbarStyle = `
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;

  const { playlist, currentIndex, isPlaying } = state;

  // Loading / error UI
  if (loading) {
    return <LoadingSkeleton isDark={isDark} />;
  }

  if (error) {
    return (
      <div className={`min-h-screen ${bgColor} ${textPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full bg-red-600 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgColor} ${textPrimary} transition-colors duration-300 pb-24 lg:pb-32`}>
      <style>{hideScrollbarStyle}</style>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <MobileSidebar
        ref={sidebarRef}
        isDark={isDark}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={(open: boolean) => (open ? openSidebar() : closeSidebar())}
      />

      <Header
        isDark={isDark}
        setIsDark={(v: boolean) => setTheme(v ? "dark" : "light")}
        setSidebarOpen={(open: boolean) => (open ? openSidebar() : closeSidebar())}
      />

      {/* Main Content - Centered with max-width */}
      <main className="max-w-7xl mx-auto px-6 py-4 lg:py-6 space-y-12">
        {/* Liked Songs Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div>
              <div className="flex items-center gap-3  lg:mb-0">
                <div className="w-9 h-9 relative top-3 lg:top-0 ml-2 bg-linear-to-br from-red-600 to-red-800 rounded flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <h2 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>Liked Songs</h2>
                <span className={`${textSecondary} text-sm hidden relative top-1 lg:inline`}>{likedSongs.length} songs</span>
              </div>
              <span className={`${textSecondary} text-sm lg:hidden ml-14`}>{likedSongs.length} songs</span>
            </div>
            <div className="relative" ref={sortMenuRef}>
              <button 
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={`p-2.5 rounded-full ${cardBg} hover:${isDark ? 'bg-white/10' : 'bg-gray-100'} transition-all`}
              >
                <SlidersHorizontal className={`w-5 h-5 ${textSecondary}`} />
              </button>
              
              {showSortMenu && (
               <div className={`absolute right-0 mt-2 w-48 ${isDark ? 'bg-zinc-900' : 'bg-white'} rounded-lg shadow-2xl border ${chartContainerBorder} overflow-hidden z-50`}>
                  <div className={`p-2 border-b ${chartContainerBorder}`}>
                    <p className={`text-xs font-semibold ${textSecondary} px-2 py-1`}>Sort by</p>
                  </div>
                  <button
                    onClick={() => {
                      setSortBy("recent");
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 ${sortBy === "recent" ? "bg-red-600/10 text-red-600" : textPrimary} ${cardHoverBg} transition-colors flex items-center justify-between`}
                  >
                    <span>Recently Added</span>
                    {sortBy === "recent" && <div className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("title");
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 ${sortBy === "title" ? "bg-red-600/10 text-red-600" : textPrimary} ${cardHoverBg} transition-colors flex items-center justify-between`}
                  >
                    <span>Title (A-Z)</span>
                    {sortBy === "title" && <div className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("artist");
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 ${sortBy === "artist" ? "bg-red-600/10 text-red-600" : textPrimary} ${cardHoverBg} transition-colors flex items-center justify-between`}
                  >
                    <span>Artist (A-Z)</span>
                    {sortBy === "artist" && <div className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`${chartContainerBg} rounded-xl p-6 border ${chartContainerBorder} shadow-lg`}>
            <div className="space-y-3">
              {sortedLikedSongs.map((song, index) => {
                const isCurrentSong = playlist[currentIndex]?.audio === song.audio;
                const isThisSongPlaying = isCurrentSong && isPlaying;

                return (
                  <div
                    key={song.id}
                    onMouseEnter={() => setHoveredCard(`liked-${index}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <SongListItem
                      song={song}
                      index={index}
                      isPlaying={isThisSongPlaying}
                      isDark={isDark}
                      onPlay={() => handlePlaySong(index)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recently Played Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>Recently Played</h2>

            {recentlyPlayed.length > 0 && (
              <div className="hidden lg:flex gap-2 items-center">
                <button
                  onClick={() => scrollContainer(recentlyPlayedRef, "left")}
                  aria-label="Scroll recently played left"
                  className={`${cardBg} p-2 rounded-full ${cardHoverBg} transition`}
                >
                  <ChevronLeft className={`w-5 h-5 ${textPrimary}`} />
                </button>
                <button
                  onClick={() => scrollContainer(recentlyPlayedRef, "right")}
                  aria-label="Scroll recently played right"
                  className={`${cardBg} p-2 rounded-full ${cardHoverBg} transition`}
                >
                  <ChevronRight className={`w-5 h-5 ${textPrimary}`} />
                </button>
              </div>
            )}
          </div>

          {recentlyPlayed.length === 0 ? (
            <div className={`${chartContainerBg} rounded-xl p-12 border ${chartContainerBorder} shadow-lg`}>
              <div className="text-center">
                <Play className={`w-16 h-16 ${textSecondary} mx-auto mb-4`} />
                <p className={`${textSecondary} text-lg`}>No recently played songs yet</p>
                <p className={`${textSecondary} text-sm mt-2`}>Start listening to your favorite tracks!</p>
              </div>
            </div>
          ) : (
            <div
              ref={recentlyPlayedRef}
              className="flex gap-4 overflow-x-auto py-2 px-1 touch-pan-x scroll-smooth hide-scrollbar"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {recentlyPlayed.map((item) => {
                const isCurrentSong = playlist[currentIndex]?.audio === item.audio;
                const isThisSongPlaying = isCurrentSong && isPlaying;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredCard(`recent-${item.id}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={`shrink-0 w-72 ${cardBg} rounded-lg p-4 ${cardHoverBg} transition-all duration-300 hover:scale-105 cursor-pointer group`}
                    style={{ scrollSnapAlign: "start" }}
                    onClick={() => handlePlayRecentItem(item)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 shadow-lg">
                        <img
                          src={item.cover}
                          alt={`${item.title} artwork`}
                          className="w-full h-full object-cover block"
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                          width={64}
                          height={64}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${textPrimary}`}>{item.title}</h3>
                        <p className={`text-sm truncate ${textSecondary}`}>
                          {getArtistName(item.artist)}
                        </p>
                      </div>

                      <button
                        aria-label={`Play ${item.title}`}
                        className={`bg-red-600 rounded-full p-2 transition-all duration-300 shrink-0`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrentSong && isPlaying) {
                            togglePlay();
                          } else {
                            handlePlayRecentItem(item);
                          }
                        }}
                      >
                        {isThisSongPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Favorite Artists Section - ONLY showing favorite artists */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-red-600 fill-red-600" />
              <h2 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>Favorite Artists</h2>
            </div>

            <div className="hidden lg:flex gap-2">
              <button
                onClick={() => scrollContainer(artistsRef, "left")}
                aria-label="Scroll artists left"
                className={`${cardBg} p-2 rounded-full ${cardHoverBg} transition`}
              >
                <ChevronLeft className={`w-5 h-5 ${textPrimary}`} />
              </button>
              <button
                onClick={() => scrollContainer(artistsRef, "right")}
                aria-label="Scroll artists right"
                className={`${cardBg} p-2 rounded-full ${cardHoverBg} transition`}
              >
                <ChevronRight className={`w-5 h-5 ${textPrimary}`} />
              </button>
            </div>
          </div>

          {favoriteArtists.length === 0 ? (
            <div className={`${chartContainerBg} rounded-xl p-12 border ${chartContainerBorder} shadow-lg`}>
              <div className="text-center">
                <Star className={`w-16 h-16 ${textSecondary} mx-auto mb-4`} />
                <p className={`${textSecondary} text-lg`}>No favorite artists yet</p>
                <p className={`${textSecondary} text-sm mt-2`}>Start exploring and mark artists as favorites!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Grid for small screens */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:hidden">
                {favoriteArtists.slice(0, 4).map((artist) => (
                  <div
                    key={artist.id}
                    className={`group relative flex flex-col items-center p-4 rounded-lg ${cardBg} ${cardHoverBg} transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:scale-105`}
                    onClick={() => navigateToArtist(artist.name)}
                  >
                    <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-full shadow-xl">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-full h-full object-cover block"
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        width={160}
                        height={160}
                      />
                    </div>
                    <h3 className={`${textPrimary} font-semibold text-center`}>{artist.name}</h3>
                    <p className={`${textSecondary} text-sm`}>{artist.followers ? `${artist.followers} followers` : "Artist"}</p>
                  </div>
                ))}
              </div>

              {/* Horizontal scroll for large screens */}
              <div
                ref={artistsRef}
                className="hidden lg:flex gap-4 overflow-x-auto py-2 px-1 touch-pan-x scroll-smooth hide-scrollbar"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {favoriteArtists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    isDark={isDark}
                    onClick={() => navigateToArtist(artist.name)}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}