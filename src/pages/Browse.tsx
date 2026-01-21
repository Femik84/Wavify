import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import MobileSidebar from "../components/MobileSidebar";
import Footer from "../components/Footer";
import { useTheme } from "../contexts/ThemeContext";
import { useAudio } from "../lib/audioService";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Star,
  Radio,
  Disc,
  PlayCircle,
} from "lucide-react";
import api from "../utils/axios"; 
import {
  fetchPlaylists,
  fetchGenres,
  fetchArtists,
  getTrendingSongs,
  getNewReleases,
  getTopCharts,
  invalidateArtistsCache,
  type Song,
  type Playlist,
  type Genre,
  type Artist,
} from "../Data";
import LoadingSkeleton from "../components/LoadingSkeleton";
import BrowserSearch from "../components/BrowseSearch";

// Utility function to safely get artist name
function getArtistName(artist: any): string {
  if (!artist) return "Unknown Artist";
  return typeof artist === "string" ? artist : artist.name || "Unknown Artist";
}


const WavefyBrowser: React.FC = () => {
  const navigate = useNavigate();
  const { setTheme, isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const { state, togglePlay, setPlaylist, playTrackAtIndex } = useAudio();
  const { playlist, currentIndex, isPlaying } = state;

  // Refs for horizontal scroll containers
  const trendingRef = useRef<HTMLDivElement | null>(null);
  const artistsRef = useRef<HTMLDivElement | null>(null);
  const genresRef = useRef<HTMLDivElement | null>(null);
  const newReleasesRef = useRef<HTMLDivElement | null>(null);

  // Data loaded from backend
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlist[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [genresUI, setGenresUI] = useState<Genre[]>([]);
  const [artistsUI, setArtistsUI] = useState<ArtistWithFollowFlag[]>([]);
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [topCharts, setTopCharts] = useState<Song[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure we only set initial session playlist once (optional)
  const initRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extend Artist type locally to include normalized follow flag
  type ArtistWithFollowFlag = Artist & { is_following?: boolean };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch playlists, genres, artists and filtered lists concurrently
        const [
          playlistsResp,
          genresResp,
          artistsResp,
          trendingResp,
          newReleasesResp,
          topChartsResp,
        ] = await Promise.all([
          fetchPlaylists(),
          fetchGenres(),
          fetchArtists(),
          getTrendingSongs(),
          getNewReleases(),
          getTopCharts(),
        ]);

        if (cancelled) return;

        // Featured playlists (take up to 8)
        setFeaturedPlaylists(
          (playlistsResp || []).filter((p) => p.isFeatured).slice(0, 8)
        );

        setGenresUI(genresResp || []);

        // Map artists - use isFavorite from backend as is_following for UI
        const normalizedArtists: ArtistWithFollowFlag[] = (artistsResp || []).map(
          (a: Artist) => ({
            ...a,
            is_following: a.isFavorite, // Use the isFavorite field from backend
          })
        );
        setArtistsUI(normalizedArtists.slice(0, 12)); // limit to reasonable number

        setTrendingSongs(trendingResp || []);
        setNewReleases(newReleasesResp || []);
        setTopCharts(topChartsResp || []);

        // Initialize audio playlist with trending when nothing is set yet (once)
        if (!initRef.current && (trendingResp || []).length > 0) {
          if (!playlist || playlist.length === 0) {
            setPlaylist(trendingResp, 0);
          }
          initRef.current = true;
        }
      } catch (err) {
        console.error("Error loading browser data:", err);
        setError("Failed to load browser data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setIsDark = (v: boolean) => setTheme(v ? "dark" : "light");

  // Styling tokens
  const bgColor = isDark ? "bg-black" : "bg-gray-50";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const cardBg = isDark ? "bg-white/5" : "bg-white";
  const cardHoverBg = isDark ? "hover:bg-white/7" : "hover:bg-gray-100";
  const inputBg = isDark ? "bg-gray-800/10" : "bg-white";
  const inputBorder = isDark ? "border-gray-200/50" : "border-gray-300";
  const chartContainerBg = isDark ? "bg-white/5" : "bg-white";
  const chartContainerBorder = isDark ? "border-white/5" : "border-gray-200";

  function scrollContainer(
    ref: { current: HTMLElement | null },
    direction: "left" | "right"
  ) {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 300);
    const delta = direction === "left" ? -amount : amount;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  const hideScrollbarStyle = `
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;

  // Navigation helpers
  function navigateToPlaylist(name: string) {
    navigate(`/playlist/${encodeURIComponent(name)}`);
  }

  function navigateToGenre(name: string) {
    navigate(`/genre/${encodeURIComponent(name)}`);
  }

  function navigateToArtist(name: string) {
    navigate(`/artist/${encodeURIComponent(name)}`);
  }

  // Construct favorite endpoint for an artist id.
  function favoriteEndpointFor(artistId: number) {
    return `artists/${artistId}/favorite/`;
  }

  // Follow/unfollow handler (optimistic UI)
async function toggleFollow(artistId: number) {
  // Find index
  const idx = artistsUI.findIndex((a) => a.id === artistId);
  if (idx === -1) return;

  // Optimistically update UI
  const prev = artistsUI[idx].is_following ?? false;
  setArtistsUI((prevList) =>
    prevList.map((a) => (a.id === artistId ? { ...a, is_following: !prev } : a))
  );

  try {
    if (prev) {
      // Send DELETE request if the artist is already being followed
      await api.delete(favoriteEndpointFor(artistId));
    } else {
      // Send POST request to follow the artist
      await api.post(favoriteEndpointFor(artistId));
    }
  } catch (err: any) {
    console.error("Follow/unfollow failed", err);

    // Revert optimistic update
    setArtistsUI((prevList) =>
      prevList.map((a) => (a.id === artistId ? { ...a, is_following: prev } : a))
    );

    // If unauthorized, navigate to login
    if (err?.response?.status === 401) {
      navigate("/login");
      return;
    }

    // Fallback user feedback
    alert("Could not update follow state. Please try again.");
  }
}

  // Play handlers that use loaded state arrays
  function playTrendingSongAtIndex(index: number, isMobile: boolean = false) {
    if (!trendingSongs || trendingSongs.length === 0) return;
    const idx = Math.max(0, Math.min(index, trendingSongs.length - 1));
    setPlaylist(trendingSongs, idx);
    playTrackAtIndex(idx);

    if (isMobile && typeof window !== "undefined" && window.innerWidth < 768) {
      const song = trendingSongs[idx];
      navigate(
        `/now-playing?track=${idx}&title=${encodeURIComponent(
          song.title
        )}&artist=${encodeURIComponent(getArtistName(song.artist))}`
      );
    }
  }

  function playNewReleaseAtIndex(index: number, isMobile: boolean = false) {
    if (!newReleases || newReleases.length === 0) return;
    const idx = Math.max(0, Math.min(index, newReleases.length - 1));
    setPlaylist(newReleases, idx);
    playTrackAtIndex(idx);

    if (isMobile && typeof window !== "undefined" && window.innerWidth < 768) {
      const song = newReleases[idx];
      navigate(
        `/now-playing?track=${idx}&title=${encodeURIComponent(
          song.title
        )}&artist=${encodeURIComponent(getArtistName(song.artist))}`
      );
    }
  }

  function playTopChartAtIndex(index: number, isMobile: boolean = false) {
    if (!topCharts || topCharts.length === 0) return;
    const idx = Math.max(0, Math.min(index, topCharts.length - 1));
    setPlaylist(topCharts, idx);
    playTrackAtIndex(idx);

    if (isMobile && typeof window !== "undefined" && window.innerWidth < 768) {
      const song = topCharts[idx];
      navigate(
        `/now-playing?track=${idx}&title=${encodeURIComponent(
          song.title
        )}&artist=${encodeURIComponent(getArtistName(song.artist))}`
      );
    }
  }

  // Loading / error states UI
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
    <div className={`min-h-screen ${bgColor} ${textPrimary} transition-colors duration-300 pb-20 lg:pb-29`}>
      <style>{hideScrollbarStyle}</style>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <MobileSidebar isDark={isDark} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Header isDark={isDark} setIsDark={setIsDark} setSidebarOpen={setSidebarOpen} />

      <main className="max-w-7xl mx-auto px-6 py-4 space-y-7 lg:space-y-12">

{/* Search (mobile only) */}
<div className="block lg:hidden">
  <BrowserSearch isDark={isDark} />
</div>


        {/* Large Screen: Featured Playlists and Trending Now in single viewport */}
        <div className="hidden lg:block ">
          <div className="flex flex-col space-y-6">
          {/* Featured Playlists */}
            <section className={`flex-shrink-0 mb-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <div className="flex items-center gap-3 mb-4">
                <PlayCircle className="w-6 h-6 text-red-600" />
                <h2 className={`text-xl lg:text-2xl font-bold ${textPrimary}`}>Featured Playlists</h2>
              </div>
              <div className="grid grid-cols-5 xl:grid-cols-7 gap-2.5">
                {featuredPlaylists.map((playlistItem, idx) => (
                  <div
                    key={playlistItem.id}
                    onMouseEnter={() => setHoveredCard(`playlist-${playlistItem.id}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => navigateToPlaylist(playlistItem.name)}
                    className={`group relative ${cardBg} rounded-lg p-2.5 cursor-pointer transition-all duration-300 ${cardHoverBg} hover:scale-105 hover:shadow-2xl ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                    style={{ transitionDelay: `${idx * 50}ms` }}
                  >
                    <div className="w-full aspect-square rounded-md mb-2 overflow-hidden shadow-lg">
                      <img
                        src={playlistItem.image}
                        alt={`${playlistItem.name} artwork`}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <h3 className={`font-semibold mb-0.5 truncate text-xs ${textPrimary}`}>{playlistItem.name}</h3>
                    <p className={`text-[10px] ${textSecondary}`}>{playlistItem.songCount ?? 0} songs</p>
                    <button
                      aria-label={`Play ${playlistItem.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToPlaylist(playlistItem.name);
                      }}
                      className={`absolute bottom-12 right-2.5 bg-red-600 rounded-full p-2 shadow-lg transition-all duration-300 ${
                        hoveredCard === `playlist-${playlistItem.id}` ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      } hover:bg-red-700 hover:scale-110`}
                    >
                      <Play className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Trending Now */}
            <section className="flex-shrink-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-red-600" />
                  <h3 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>Trending Now</h3>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => scrollContainer(trendingRef, "left")}
                    aria-label="Scroll trending left"
                    className={`${cardBg} p-2 rounded-full ${cardHoverBg} transition`}
                  >
                    <ChevronLeft className={`w-5 h-5 ${textPrimary}`} />
                  </button>
                  <button
                    onClick={() => scrollContainer(trendingRef, "right")}
                    aria-label="Scroll trending right"
                    className={`${cardBg} p-2 rounded-full ${cardHoverBg} transition`}
                  >
                    <ChevronRight className={`w-5 h-5 ${textPrimary}`} />
                  </button>
                </div>
              </div>
              <div
                ref={trendingRef}
                className="flex gap-4 overflow-x-auto py-2 px-1 touch-pan-x scroll-smooth hide-scrollbar"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {trendingSongs.map((song, idx) => {
                  const isCurrentSong = playlist[currentIndex]?.audio === song.audio;
                  const isThisSongPlaying = isCurrentSong && isPlaying;

                  return (
                    <div
                      key={song.id}
                      onMouseEnter={() => setHoveredCard(`song-${song.id}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => playTrendingSongAtIndex(idx, false)}
                      className={`flex-shrink-0 w-72 ${cardBg} rounded-lg p-4 ${cardHoverBg} transition-all duration-300 hover:scale-105 cursor-pointer group`}
                      style={{ scrollSnapAlign: "start" }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 shadow-lg">
                          <img src={song.cover} alt={`${song.title} artwork`} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold truncate ${textPrimary}`}>{song.title}</h3>
                          <p className={`text-sm truncate ${textSecondary}`}>{getArtistName(song.artist)}</p>
                          <p className="text-xs text-red-400 mt-1">Trending</p>
                        </div>
                        <button
                          aria-label={`Play ${song.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCurrentSong && isPlaying) {
                              togglePlay();
                            } else {
                              playTrendingSongAtIndex(idx, false);
                            }
                          }}
                          className={`bg-red-600 rounded-full p-2 transition-all duration-300 flex-shrink-0 ${
                            hoveredCard === `song-${song.id}` ? "opacity-100 scale-100" : "opacity-0 scale-75"
                          } hover:bg-red-700`}
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
            </section>
          </div>
        </div>

        {/* Mobile/Tablet: Original scrollable layout */}
        <div className="lg:hidden space-y-7">
          {/* Featured Playlists */}


{/* Featured Playlists - Mobile Horizontal Scroll */}
<section className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
  <div className="flex items-center gap-3 mb-6">
    <PlayCircle className="w-7 h-7 text-red-600" />
    <h2 className={`text-2xl font-bold ${textPrimary}`}>Featured Playlists</h2>
  </div>
  
  <div 
    className="flex gap-4 overflow-x-auto py-2 px-1 touch-pan-x scroll-smooth hide-scrollbar"
    style={{ scrollSnapType: "x mandatory" }}
  >
    {featuredPlaylists.map((playlistItem, idx) => (
      <div
        key={playlistItem.id}
        onMouseEnter={() => setHoveredCard(`playlist-${playlistItem.id}`)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => navigateToPlaylist(playlistItem.name)}
        className={`flex-shrink-0 w-[calc(40%-8px)] group relative ${cardBg} rounded-lg p-4 cursor-pointer transition-all duration-300 ${cardHoverBg} hover:scale-105 hover:shadow-2xl`}
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="w-full aspect-square rounded-md mb-4 overflow-hidden shadow-lg">
          <img
            src={playlistItem.image}
            alt={`${playlistItem.name} artwork`}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <h3 className={`font-semibold mb-1 truncate ${textPrimary}`}>{playlistItem.name}</h3>
        <p className={`text-sm ${textSecondary}`}>{playlistItem.songCount ?? 0} songs</p>
      </div>
    ))}
  </div>
</section>

          {/* Trending Now */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-red-600" />
              <h3 className={`text-2xl font-bold ${textPrimary}`}>Trending Now</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto py-2 px-1 touch-pan-x scroll-smooth hide-scrollbar">
              {trendingSongs.map((song, idx) => {
                const isCurrentSong = playlist[currentIndex]?.audio === song.audio;
                const isThisSongPlaying = isCurrentSong && isPlaying;

                return (
                  <div
                    key={song.id}
                    onClick={() => playTrendingSongAtIndex(idx, true)}
                    className={`flex-shrink-0 w-72 ${cardBg} rounded-lg p-4 ${cardHoverBg} transition-all duration-300 hover:scale-105 cursor-pointer`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 shadow-lg">
                        <img src={song.cover} alt={`${song.title} artwork`} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${textPrimary}`}>{song.title}</h3>
                        <p className={`text-sm truncate ${textSecondary}`}>{getArtistName(song.artist)}</p>
                        <p className="text-xs text-red-400 mt-1">Trending</p>
                      </div>
                      <button
                        aria-label={`Play ${song.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrentSong && isPlaying) {
                            togglePlay();
                          } else {
                            playTrendingSongAtIndex(idx, true);
                          }
                        }}
                        className="bg-red-600 rounded-full p-2 transition-all flex-shrink-0"
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
          </section>
        </div>

        {/* Popular Genres */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Radio className="w-8 h-8 text-red-600" />
              <h3 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>Popular Genres</h3>
            </div>
            <div className="hidden lg:flex gap-2">
              <button
                onClick={() => scrollContainer(genresRef, "left")}
                aria-label="Scroll genres left"
                className={`${cardBg} p-2 rounded-full ${cardHoverBg} transition`}
              >
                <ChevronLeft className={`w-5 h-5 ${textPrimary}`} />
              </button>
              <button
                onClick={() => scrollContainer(genresRef, "right")}
                aria-label="Scroll genres right"
                className={`${cardBg} p-2 rounded-full ${cardHoverBg} transition`}
              >
                <ChevronRight className={`w-5 h-5 ${textPrimary}`} />
              </button>
            </div>
          </div>
          <div
            ref={genresRef}
            className="flex gap-4 overflow-x-auto py-2 px-1 touch-pan-x scroll-smooth hide-scrollbar"
            style={{ scrollSnapType: "x mandatory" }}
          >
          {genresUI.map((genre, idx) => (
              <div
                key={genre.id}
                onMouseEnter={() => setHoveredCard(`genre-${genre.id}`)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigateToGenre(genre.name)}
                className={`flex-shrink-0 w-[calc(40%-8px)] lg:w-40 group relative rounded-lg cursor-pointer transition-all duration-300 overflow-hidden hover:scale-105 hover:shadow-2xl ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${idx * 40}ms`, scrollSnapAlign: "start" }}
              >
                <div className="w-full aspect-square overflow-hidden rounded-lg shadow-md">
                  <img src={genre.image} alt={`${genre.name} background`} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-300 flex items-end p-3">
                  <div>
                    <h3 className="font-bold text-white text-sm lg:text-base">{genre.name}</h3>
                  </div>
                </div>
                <button
                  aria-label={`Browse ${genre.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToGenre(genre.name);
                  }}
                  className={`hidden lg:block absolute top-3 right-3 bg-red-600 rounded-full p-2 shadow-lg transition-all duration-300 ${
                    hoveredCard === `genre-${genre.id}` ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                  } hover:bg-red-700 hover:scale-110`}
                >
                  <Play className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        </section>

      {/* Artist Spotlights (with Follow/Following button) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-red-600" />
              <h3 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>Artist Spotlights</h3>
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
          <div
            ref={artistsRef}
            className="flex gap-4 overflow-x-auto py-2 px-1 touch-pan-x scroll-smooth hide-scrollbar"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {artistsUI.map((artist) => (
              <div
                key={artist.id}
                onMouseEnter={() => setHoveredCard(`artist-${artist.id}`)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigateToArtist(artist.name)}
                className={`flex-shrink-0 w-[calc(50%-8px)] lg:w-40 ${cardBg} rounded-lg p-3 cursor-pointer transition-all duration-300 ${cardHoverBg} hover:scale-105 hover:shadow-2xl group`}
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="w-full aspect-square rounded-full mb-3 overflow-hidden mx-auto shadow-lg">
                  <img src={artist.image} alt={`${artist.name} portrait`} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <h3 className={`font-semibold text-center truncate text-sm ${textPrimary}`}>{artist.name}</h3>
                <p className={`text-xs text-center ${textSecondary}`}>{artist.followers ?? "—"} followers</p>

                {/* Follow/Following button based on is_following state */}
                <div className="flex justify-center">
                  <button
                    aria-pressed={!!artist.is_following}
                    aria-label={artist.is_following ? `Unfollow ${artist.name}` : `Follow ${artist.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(artist.id);
                    }}
                    className={`mt-2 inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                      artist.is_following
                        ? `${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {artist.is_following ? "Following" : "Follow"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
       {/* New Releases */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Disc className="w-8 h-8 text-red-600" />
              <h3 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>New Releases</h3>
            </div>
            <div className="hidden lg:flex gap-2">
              <button
                onClick={() => scrollContainer(newReleasesRef, "left")}
                aria-label="Scroll new releases left"
                className={`${cardBg} p-2 rounded-full ${cardHoverBg} transition`}
              >
                <ChevronLeft className={`w-5 h-5 ${textPrimary}`} />
              </button>
              <button
                onClick={() => scrollContainer(newReleasesRef, "right")}
                aria-label="Scroll new releases right"
                className={`${cardBg} p-2 rounded-full ${cardHoverBg} transition`}
              >
                <ChevronRight className={`w-5 h-5 ${textPrimary}`} />
              </button>
            </div>
          </div>
          <div
            ref={newReleasesRef}
            className="flex gap-4 overflow-x-auto py-2 px-1 touch-pan-x scroll-smooth hide-scrollbar"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {newReleases.map((release, idx) => {
              const isCurrentSong = playlist[currentIndex]?.audio === release.audio;
              const isThisSongPlaying = isCurrentSong && isPlaying;

              return (
                <div
                  key={release.id}
                  onMouseEnter={() => setHoveredCard(`release-${release.id}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => playNewReleaseAtIndex(idx, true)}
                  className={`flex-shrink-0 w-[calc(40%-8px)] lg:w-40 group relative ${cardBg} rounded-lg p-3 cursor-pointer transition-all duration-300 ${cardHoverBg} hover:scale-105 hover:shadow-2xl ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${idx * 60}ms`, scrollSnapAlign: "start" }}
                >
                  <div className="w-full aspect-square rounded-md mb-3 overflow-hidden shadow-lg">
                    <img src={release.cover} alt={`${release.title} artwork`} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <h3 className={`font-semibold mb-1 truncate text-sm ${textPrimary}`}>{release.title}</h3>
                  <p className={`text-xs ${textSecondary}`}>{getArtistName(release.artist)}</p>
                  <button
                    aria-label={`Play ${release.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrentSong && isPlaying) {
                        togglePlay();
                      } else {
                        playNewReleaseAtIndex(idx, true);
                      }
                    }}
                    className={`hidden md:block absolute bottom-16 right-4 bg-red-600 rounded-full p-2.5 shadow-lg transition-all duration-300 ${
                      hoveredCard === `release-${release.id}` ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    } hover:bg-red-700 hover:scale-110`}
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
        </section>

        {/* Top Charts */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-red-600" />
            <h3 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>Top Charts</h3>
          </div>
          <div className={`${chartContainerBg} rounded-xl p-6 border ${chartContainerBorder}`}>
            <div className="space-y-3">
              {topCharts.map((song, idx) => {
                const isCurrentSong = playlist[currentIndex]?.audio === song.audio;
                const isThisSongPlaying = isCurrentSong && isPlaying;

                return (
                  <div
                    key={song.id}
                    onMouseEnter={() => setHoveredCard(`chart-${song.id}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => playTopChartAtIndex(idx, true)}
                    className={`flex items-center gap-4 p-3 rounded-lg ${cardHoverBg} transition-all duration-300 cursor-pointer group`}
                  >
                    <div className={`text-2xl font-bold w-8 ${textSecondary} hidden lg:block`}>{idx + 1}</div>
                    <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 shadow-md">
                      <img src={song.cover} alt={`${song.title} artwork`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate ${textPrimary}`}>{song.title}</h3>
                      <p className={`text-sm truncate ${textSecondary}`}>{getArtistName(song.artist)}</p>
                    </div>
                    <div className={`text-sm ${textSecondary} hidden lg:block`}>{song.duration}</div>
                    <button
                      aria-label={`Play ${song.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentSong && isPlaying) {
                          togglePlay();
                        } else {
                          playTopChartAtIndex(idx, true);
                        }
                      }}
                      className={`bg-red-600 rounded-full p-2 transition-all duration-300 flex-shrink-0 ${
                        hoveredCard === `chart-${song.id}` ? "opacity-100 scale-100" : "md:opacity-0 md:scale-75 opacity-100 scale-100"
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
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default WavefyBrowser;