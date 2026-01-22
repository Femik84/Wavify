import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import MobileSidebar from "../components/MobileSidebar";
import Footer from "../components/Footer";
import React from 'react';
import {
  fetchPlaylists,
  getTrendingSongs,
  getRecentlyPlayed,
  fetchGenres,
  fetchArtists,
  trackRecentlyPlayed,
} from "../Data";
import type { Song, Playlist, Genre, Artist } from "../Data";
import { Play, Pause, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useAudio } from "../lib/audioService";
import { useTheme } from "../contexts/ThemeContext";
import LoadingSkeleton from "../components/LoadingSkeleton";

// Utility function to safely get artist name
function getArtistName(artist: any): string {
  if (!artist) return "Unknown Artist";
  return typeof artist === "string" ? artist : artist.name || "Unknown Artist";
}

export default function Home() {
  const navigate = useNavigate();
  const { setTheme, isDark } = useTheme();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const { state, togglePlay, setPlaylist, playTrackAtIndex } = useAudio();

  const { playlist, currentIndex, isPlaying } = state;

  // Data state
  const [heroSlides, setHeroSlides] = useState<Playlist[]>([]);
  const [madeForYou, setMadeForYou] = useState<Playlist[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  // Only store the last 4 recently played items
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          playlistsResp,
          trendingResp,
          recentResp,
          genresResp,
          artistsResp,
        ] = await Promise.all([
          fetchPlaylists(),
          getTrendingSongs(),
          getRecentlyPlayed(),
          fetchGenres(),
          fetchArtists(),
        ]);

        if (cancelled) return;

        setHeroSlides(playlistsResp || []);
        setMadeForYou((playlistsResp || []).slice(0, 4));
        setTrendingSongs(trendingResp || []);
        // Keep only the most recent 4 items from the server response
        setRecentlyPlayed((recentResp || []).slice(0, 4));
        setGenres(genresResp || []);
        setArtists((artistsResp || []).slice(0, 4));
      } catch (err) {
        console.error("Error loading home data:", err);
        setError("Failed to load data. Please try again.");
        // keep previous states (or empty)
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Once trending songs are loaded, set them as the session playlist (only once)
  useEffect(() => {
    if (initRef.current) return;
    if (trendingSongs && trendingSongs.length > 0) {
      if (!playlist || playlist.length === 0) {
        setPlaylist(trendingSongs, 0);
      }
      initRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendingSongs]);

  // Hero Slide Autoplay (only when there are slides)
  useEffect(() => {
    if (!heroSlides || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const setIsDark = (v: boolean) => setTheme(v ? "dark" : "light");
  const bgColor = isDark ? "bg-black" : "bg-gray-50";
  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const hoverBg = isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100";
  const chartContainerBg = isDark ? "bg-white/5" : "bg-white";
  const chartContainerBorder = isDark ? "border-white/5" : "border-gray-200";

  // Navigation helpers
  function navigateToHeroPlaylist(slide: Playlist, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    navigate(`/playlist/${encodeURIComponent(slide.name)}`);
  }
  function navigateToPlaylist(name: string) {
    navigate(`/playlist/${encodeURIComponent(name)}`);
  }
  function navigateToGenre(name: string) {
    navigate(`/genre/${encodeURIComponent(name)}`);
  }


  // Helper to keep recentlyPlayed state limited to last 4 and avoid duplicates.
  // Uses song.id if available, otherwise falls back to audio URL as an identifier.
  function addToRecentlyPlayed(song: Song) {
    if (!song) return;
    setRecentlyPlayed((prev) => {
      // Identify by id if available, otherwise by audio src
      const idKey = (s?: Song) => (s && (s.id ?? s.audio)) ?? undefined;
      const newId = idKey(song);
      const filtered = prev.filter((s) => idKey(s) !== newId);
      const updated = [song, ...filtered].slice(0, 4);
      return updated;
    });
  }

  // Play handlers using loaded state arrays
async function playTrendingSongAtIndex(index: number, isMobile: boolean = false) {
  if (!trendingSongs || trendingSongs.length === 0) return;
  const idx = Math.max(0, Math.min(index, trendingSongs.length - 1));
  const song = trendingSongs[idx];

  setPlaylist(trendingSongs, idx);
  playTrackAtIndex(idx);

  // Optimistically update UI
  addToRecentlyPlayed(song);
  
  // ✅ AWAIT the backend call
  try {
    await trackRecentlyPlayed(song.id);
  } catch (err) {
    console.error("Failed to track play:", err);
  }

  if (isMobile && typeof window !== "undefined" && window.innerWidth < 768) {
    navigate(
      `/now-playing?track=${idx}&title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(
        getArtistName(song.artist)
      )}`
    );
  }
}

async function playRecentlyPlayedAtIndex(index: number, isMobile: boolean = false) {
  if (!recentlyPlayed || recentlyPlayed.length === 0) return;
  const idx = Math.max(0, Math.min(index, recentlyPlayed.length - 1));
  const song = recentlyPlayed[idx];

  setPlaylist(recentlyPlayed, idx);
  playTrackAtIndex(idx);

  // Optimistically update UI
  addToRecentlyPlayed(song);
  
  // ✅ AWAIT the backend call
  try {
    await trackRecentlyPlayed(song.id);
  } catch (err) {
    console.error("Failed to track play:", err);
  }

  if (isMobile && typeof window !== "undefined" && window.innerWidth < 768) {
    navigate(
      `/now-playing?track=${idx}&title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(
        getArtistName(song.artist)
      )}`
    );
  }
}

  // UI fallback while loading
 if (loading) {
  return <LoadingSkeleton isDark={isDark} />;
}

  return (
    <div className={`min-h-screen ${bgColor} ${textPrimary} transition-colors duration-300 pb-20 lg:pb-10`}>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <MobileSidebar isDark={isDark} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Header isDark={isDark} setIsDark={setIsDark} setSidebarOpen={setSidebarOpen} />

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-12">





     {/* Hero Carousel */}
<section className="relative h-60 rounded-2xl overflow-hidden group">
  {heroSlides.map((slide, idx) => (
    <div
      key={`mobile-${slide.id}-${slide.name}`}
      className={`absolute inset-0 transition-opacity duration-700 cursor-pointer ${idx === currentSlide ? "opacity-100" : "opacity-0"}`}
      onClick={() => navigateToHeroPlaylist(heroSlides[currentSlide])}
    >
      <img src={slide.image} alt={slide.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute bottom-6 left-6 space-y-2">
        <h2 className="text-3xl font-black text-white">{slide.name}</h2>
        <p className="text-sm text-gray-300 line-clamp-2">{slide.description}</p>
        <button
          onClick={(e) => navigateToHeroPlaylist(heroSlides[currentSlide], e)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition transform hover:scale-105 shadow-2xl mt-2"
        >
          <Play className="w-4 h-4 fill-white" />
          Play Playlist
        </button>
      </div>
    </div>
  ))}

  <button
    onClick={(e) => {
      e.stopPropagation();
      setCurrentSlide((currentSlide - 1 + heroSlides.length) % Math.max(1, heroSlides.length));
    }}
    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition z-10"
    aria-label="Previous slide"
  >
    <ChevronLeft className="w-5 h-5" />
  </button>
  <button
    onClick={(e) => {
      e.stopPropagation();
      setCurrentSlide((currentSlide + 1) % Math.max(1, heroSlides.length));
    }}
    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition z-10"
    aria-label="Next slide"
  >
    <ChevronRight className="w-5 h-5" />
  </button>
  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
    {heroSlides.map((_, idx) => (
      <button
        key={heroSlides[idx].id}
        onClick={(e) => {
          e.stopPropagation();
          setCurrentSlide(idx);
        }}
        className={`w-1.5 h-1.5 rounded-full transition ${idx === currentSlide ? "bg-red-600 w-6" : "bg-white/50"}`}
        aria-label={`Go to slide ${idx + 1}`}
      />
    ))}
  </div>
</section>

       

{/* Trending Now */}
<section className="space-y-6">
  <div className="flex items-center justify-between">
    <h3 className="text-3xl font-bold">Trending Now</h3>
    <button 
      onClick={() => navigate('/browse')}
      className="text-red-600 hover:text-red-500 font-semibold text-sm"
    >
      See All
    </button>
  </div>
  <div className="flex  overflow-x-auto scrollbar-hide gap-2">
    {trendingSongs.map((song, idx) => {
      return (
        <div
          key={song.id}
          className={`${cardBg} rounded-2xl p-4 ${hoverBg} transition group cursor-pointer shadow-lg hover:shadow-2xl shrink-0`}
          style={{ width: 'calc((100% - 20px) / 2.5)' }}
          onClick={() => playTrendingSongAtIndex(idx, true)}
        >
          <div className="relative mb-3">
            <img src={song.cover} alt={song.title} className="w-full aspect-square object-cover rounded-xl" />
          </div>
          <div>
            <h4 className="font-bold text-sm line-clamp-2 mb-1">{song.title}</h4>
            <p className={`text-xs ${textSecondary} truncate`}>
              {getArtistName(song.artist)}
            </p>
          </div>
        </div>
      );
    })}
  </div>
</section>

          {/* Made For You */}
          <section className="space-y-4">
            <h3 className="text-3xl font-bold">Made For You</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {madeForYou.map(mix => (
                <div
                  key={mix.id}
                  className={`${cardBg} rounded-2xl p-4 ${hoverBg} transition cursor-pointer shadow-lg hover:shadow-2xl group`}
                  onClick={() => navigateToPlaylist(mix.name)}
                >
                  <div className="flex gap-4 mb-4">
                    <img src={mix.image} alt={mix.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold mb-1">{mix.name}</h4>
                      <p className={`text-xs ${textSecondary}`}>{mix.description}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-red-600 h-full rounded-full transition-all duration-300" style={{ width: `${(mix.songCount ?? 0) > 0 ? Math.min(100, (mix.songCount! / 10) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recently Played */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold">Recently Played</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentlyPlayed.map((song, idx) => {
                const isCurrentSong = playlist[currentIndex]?.audio === song.audio;
                const isThisSongPlaying = isCurrentSong && isPlaying;

                return (
                  <div
                    key={song.id}
                    className={`${cardBg} rounded-2xl p-4 ${hoverBg} transition cursor-pointer flex items-center gap-4 shadow-lg hover:shadow-2xl group/item`}
                    onClick={() => playRecentlyPlayedAtIndex(idx, true)}
                  >
                    <img src={song.cover} alt={song.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{song.title}</h4>
                      <p className={`text-sm ${textSecondary} truncate`}>
                        {getArtistName(song.artist)}
                      </p>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (isCurrentSong && isPlaying) {
                          togglePlay();
                        } else {
                          playRecentlyPlayedAtIndex(idx, true);
                        }
                      }}
                      className="shrink-0 p-2 text-red-600"
                    >
                      {isThisSongPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Genres & Moods */}
          <section className="space-y-6">
            <h3 className="text-3xl font-bold">Browse Genres</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  className={`${cardBg} rounded-2xl overflow-hidden ${hoverBg} transition group cursor-pointer shadow-lg hover:shadow-2xl hover:border-2 hover:border-red-600 relative h-32`}
                  onClick={() => navigateToGenre(genre.name)}
                >
                  <div className="absolute inset-0 w-full h-full">
                    <img src={genre.image} alt={genre.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute inset-0 bg-linear-to-br from-black/60 to-black/20" />
                  </div>
                  <div className="relative z-10 h-full flex items-end p-4">
                    <p className="font-bold text-base text-white">{genre.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-[400px_1fr] lg:gap-8">
          {/* Trending Now, Main, Genres, Artists */}
          <div className="flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <TrendingUp className="w-8 h-8 text-red-600" />
              <h3 className="text-3xl font-bold">Trending Now</h3>
            </div>
            <div className={`${chartContainerBg} rounded-xl border ${chartContainerBorder} flex-1 overflow-hidden flex flex-col`}>
              <div className="overflow-y-auto flex-1 p-6 space-y-3 scrollbar-hide">
                {trendingSongs.map((song, idx) => {
                  const isCurrentSong = playlist[currentIndex]?.audio === song.audio;
                  const isThisSongPlaying = isCurrentSong && isPlaying;

                  return (
                    <div
                      key={song.id}
                      onMouseEnter={() => setHoveredCard(`trending-${idx}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className={`flex items-center gap-4 p-3 rounded-lg ${hoverBg} transition-all duration-300 cursor-pointer group`}
                      onClick={() => playTrendingSongAtIndex(idx, false)}
                    >
                      <div className={`text-xl font-bold w-6 ${textSecondary}`}>{idx + 1}</div>
                      <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 shadow-md">
                        <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${textPrimary}`}>{song.title}</h3>
                        <p className={`text-sm truncate ${textSecondary}`}>{getArtistName(song.artist)}</p>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (isCurrentSong && isPlaying) {
                            togglePlay();
                          } else {
                            playTrendingSongAtIndex(idx, false);
                          }
                        }}
                        className={`bg-red-600 rounded-full p-2 transition-all duration-300 shrink-0 ${
                          hoveredCard === `trending-${idx}` ? "opacity-100 scale-100" : "opacity-0 scale-75"
                        } hover:bg-red-700`}
                      >
                        {isThisSongPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-12 overflow-y-auto h-[calc(100vh-12rem)] scrollbar-hide">
            <section className="relative h-64 rounded-3xl overflow-hidden group">
              {heroSlides.map((slide, idx) => (
                <div
                  key={`desktop-${slide.id}-${slide.name}`}
                  className={`absolute inset-0 transition-opacity duration-700 cursor-pointer ${idx === currentSlide ? "opacity-100" : "opacity-0"}`}
                  onClick={() => navigateToHeroPlaylist(heroSlides[currentSlide])}
                >
                  <img src={slide.image} alt={slide.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-8 left-8 space-y-3">
                    <h2 className="text-4xl font-black text-white">{slide.name}</h2>
                    <p className="text-lg text-gray-300">{slide.description}</p>
                    <button
                      onClick={(e) => navigateToHeroPlaylist(heroSlides[currentSlide], e)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold transition transform hover:scale-105 shadow-2xl"
                    >
                      <Play className="w-5 h-5 fill-white" />
                      Play Playlist
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((currentSlide - 1 + heroSlides.length) % Math.max(1, heroSlides.length));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition z-10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((currentSlide + 1) % Math.max(1, heroSlides.length));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition z-10"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {heroSlides.map((_, idx) => (
                  <button
                    key={heroSlides[idx].id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition ${idx === currentSlide ? "bg-red-600 w-8" : "bg-white/50"}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </section>

            {/* Playlists */}
            <section className="space-y-6">
              <h3 className="text-3xl font-bold">Made For You</h3>
              <div className="grid grid-cols-2 gap-6">
                {madeForYou.map(mix => (
                  <div
                    key={mix.id}
                    className={`${cardBg} rounded-2xl p-4 ${hoverBg} transition cursor-pointer shadow-lg hover:shadow-2xl group`}
                    onClick={() => navigateToPlaylist(mix.name)}
                  >
                    <div className="flex gap-3 items-center">
                      <img src={mix.image} alt={mix.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm mb-0.5 truncate">{mix.name}</h4>
                        <p className={`text-xs ${textSecondary} line-clamp-2`}>{mix.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recently Played */}
            <section className="space-y-6">
              <h3 className="text-3xl font-bold">Recently Played</h3>
              <div className="grid grid-cols-2 gap-4">
                {recentlyPlayed.map((song, idx) => {
                  const isCurrentSong = playlist[currentIndex]?.audio === song.audio;
                  const isThisSongPlaying = isCurrentSong && isPlaying;

                  return (
                    <div
                      key={song.id}
                      className={`${cardBg} rounded-2xl p-4 ${hoverBg} transition cursor-pointer flex items-center gap-4 shadow-lg hover:shadow-2xl group/item`}
                      onClick={() => playRecentlyPlayedAtIndex(idx, false)}
                    >
                      <img src={song.cover} alt={song.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{song.title}</h4>
                        <p className={`text-sm ${textSecondary} truncate`}>
                          {getArtistName(song.artist)}
                        </p>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (isCurrentSong && isPlaying) {
                            togglePlay();
                          } else {
                            playRecentlyPlayedAtIndex(idx, false);
                          }
                        }}
                        className="p-3 bg-red-600 rounded-full opacity-0 group-hover/item:opacity-100 transition transform group-hover/item:scale-110 shrink-0"
                      >
                        {isThisSongPlaying ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Genres */}
            <section className="space-y-6 pb-8">
              <h3 className="text-3xl font-bold">Browse Genres</h3>
              <div className="grid grid-cols-4 gap-4">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    className={`${cardBg} rounded-2xl overflow-hidden ${hoverBg} transition group cursor-pointer shadow-lg hover:shadow-2xl hover:border-2 hover:border-red-600 relative h-32`}
                    onClick={() => navigateToGenre(genre.name)}
                  >
                    <div className="absolute inset-0 w-full h-full">
                      <img src={genre.image} alt={genre.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                      <div className="absolute inset-0 bg-linear-to-br from-black/60 to-black/20" />
                    </div>
                    <div className="relative z-10 h-full flex items-end p-4">
                      <p className="font-bold text-base text-white">{genre.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}