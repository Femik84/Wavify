import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Play, Pause, Heart, ChevronLeft, Clock, SkipBack, SkipForward, Volume2, Shuffle, Repeat
} from "lucide-react";
import {
  fetchPlaylists,
  getTrendingSongs,
  getSongsByPlaylist
} from "../Data";
import type { Playlist, Song } from "../Data";
import { useAudio } from "../lib/audioService";
import { useTheme } from "../contexts/ThemeContext";

export default function DailyMixPage() {
  const navigate = useNavigate();
  const { mixId } = useParams<{ mixId: string }>();
  const { isDark, setTheme } = useTheme();

  const [currentMix, setCurrentMix] = useState<Playlist | null>(null);
  const [mixSongs, setMixSongs] = useState<Song[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const playlistInitialized = useRef(false);

  const {
    state,
    togglePlay,
    next,
    prev,
    seekTo,
    setVolume,
    setPlaylist,
    toggleShuffle,
    cycleRepeat,
    playTrackAtIndex,
  } = useAudio();

  const { playlist, currentIndex, isPlaying, volume, currentTime, duration, shuffle, repeat } = state;
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Load playlist (mix) and its songs from backend, plus trending songs
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const allPlaylists = await fetchPlaylists();
        if (cancelled) return;

        const decoded = decodeURIComponent(mixId || "");
        const mix = allPlaylists.find((m) => m.name === decoded) || null;
        setCurrentMix(mix);

        if (mix) {
          const songs = await getSongsByPlaylist(mix.name);
          if (cancelled) return;
          setMixSongs(songs);

          // initialize audio playlist with this mix only once per mount
          if (!playlistInitialized.current && songs.length > 0) {
            setPlaylist(songs, 0);
            playlistInitialized.current = true;
          }
        } else {
          setMixSongs([]);
        }

        // load trending songs for the sidebar
        const trend = await getTrendingSongs();
        if (cancelled) return;
        setTrendingSongs(trend.slice(0, 6));
      } catch (err) {
        console.error("Error loading mix page data:", err);
        setError("Failed to load mix. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      playlistInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixId]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-black" : "bg-gray-50"} ${isDark ? "text-white" : "text-gray-900"} flex items-center justify-center`}>
        <div className="animate-pulse space-y-3">
          <div className="w-96 h-96 bg-gray-200 rounded-2xl" />
          <div className="h-6 w-72 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{error}</h2>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-semibold transition"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentMix) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Mix not found</h2>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-semibold transition"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const setIsDark = (v: boolean) => setTheme(v ? "dark" : "light");

  const bgColor = isDark ? "bg-black" : "bg-gray-50";
  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const hoverBg = isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100";
  const borderColor = isDark ? "border-zinc-800" : "border-gray-200";

  function formatTime(t: number) {
    if (!t || isNaN(t)) return "0:00";
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  const playAllSongs = () => {
    if (mixSongs.length > 0) {
      setPlaylist(mixSongs, 0);
      playTrackAtIndex(0);
    }
  };

  const handleBackClick = () => {
    navigate("/", { replace: true });
  };

  const playRecentSong = (index: number) => {
    if (trendingSongs.length === 0) return;
    const idx = Math.max(0, Math.min(index, trendingSongs.length - 1));
    setPlaylist(trendingSongs, idx);
    playTrackAtIndex(idx);
  };

  const currentSong = playlist[currentIndex];

  return (
    <div className={`min-h-screen ${bgColor} ${textPrimary} transition-colors duration-300 pb-32`}>
      {/* Mobile View */}
      <div className="lg:hidden">
        <div className="relative" style={{
          background: isDark
            ? "linear-gradient(180deg, #991b1b 0%, #000000 100%)"
            : "linear-gradient(180deg, #dc2626 0%, #f9fafb 100%)"
        }}>
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6">
            <button
              onClick={handleBackClick}
              className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Mix header */}
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-8">
            <div className="flex flex-col items-center gap-6">
              <div className="flex-shrink-0">
                <img
                  src={currentMix.image}
                  alt={currentMix.name}
                  className="w-43 h-43 rounded-2xl shadow-2xl object-cover"
                />
              </div>

              <div className="text-center space-y-2">
                <h1 className="text-2xl font-black">{currentMix.name}</h1>
                <p className="text-lg opacity-80">{currentMix.description}</p>
                <div className="flex items-center gap-2 justify-center text-sm">
                  <span className="font-semibold">Wavify</span>
                  <span>•</span>
                  <span>{mixSongs.length} songs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls and songs */}
        <div className="max-w-7xl mx-auto px-6 ">
          <div className="flex items-center gap-6 mb-8">
            <button
              onClick={playAllSongs}
              className="w-13 h-13 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition transform hover:scale-105 shadow-2xl"
            >
              <Play className="w-6 h-6 fill-white ml-1" />
            </button>
            <button className={`p-3 rounded-full ${hoverBg} transition`}>
              <Heart className="w-7 h-7" />
            </button>
          </div>

          {/* Songs list */}
          <div className="space-y-1">
            {mixSongs.map((song, index) => {
              const isCurrentSong = currentIndex === index && playlist[currentIndex]?.audio === song.audio;
              const isThisSongPlaying = isCurrentSong && isPlaying;

              return (
                <div
                  key={song.id ?? index}
                  className={`grid grid-cols-[auto_1fr_auto] gap-4 items-center p-3 rounded-lg ${hoverBg} transition cursor-pointer group ${
                    isCurrentSong ? (isDark ? "bg-zinc-800" : "bg-gray-200") : ""
                  }`}
                  onClick={() => {
                    setPlaylist(mixSongs, index);
                    playTrackAtIndex(index);
                  }}
                >
                  <div className="w-8 flex items-center justify-center">
                    {isThisSongPlaying ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                        className="text-red-600"
                      >
                        <Pause className="w-5 h-5 fill-current" />
                      </button>
                    ) : (
                      <>
                        <span className={`${textSecondary} group-hover:hidden block`}>
                          {index + 1}
                        </span>
                        <Play className="w-5 h-5 fill-current text-red-600 hidden group-hover:block" />
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.cover}
                      alt={song.title}
                      className="w-12 h-12 rounded-lg object-cover shadow-md flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-semibold truncate ${isCurrentSong ? "text-red-600" : ""}`}>
                        {song.title}
                      </h4>
                      <p className={`text-sm ${textSecondary} truncate`}>{song.artist?.name ?? "Unknown Artist"}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrentSong && isPlaying) {
                        togglePlay();
                      } else {
                        setPlaylist(mixSongs, index);
                        playTrackAtIndex(index);
                      }
                    }}
                    className="p-2 text-red-600"
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
        </div>
      </div>

      {/* Desktop View - Split Layout */}
      <div className="hidden lg:block">
        <div className="flex h-[calc(100vh-140px)]">
          {/* Left Side - Recently Played (Trending) */}
          <div className={`w-1/3 ${cardBg} border-r ${borderColor} overflow-y-auto`}>
            <div className="p-6 sticky top-0 bg-opacity-95 backdrop-blur z-10" style={{
              background: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)'
            }}>
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={handleBackClick}
                  className={`p-2 rounded-full relative top-3 bg-red-600 transition`}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <h2 className="text-2xl font-bold">Trending Songs</h2>
              </div>
              <p className={`text-sm ${textSecondary} ml-16`}>Recent hits</p>
            </div>

            <div className="px-6 pb-6 space-y-2">
              {trendingSongs.map((song, index) => {
                const isCurrentSong = playlist[currentIndex]?.audio === song.audio;
                const isThisSongPlaying = isCurrentSong && isPlaying;

                return (
                  <div
                    key={song.id ?? index}
                    className={`${cardBg} rounded-lg p-4 ${hoverBg} transition cursor-pointer group ${
                      isCurrentSong ? (isDark ? "bg-zinc-800" : "bg-gray-200") : ""
                    }`}
                    onClick={() => playRecentSong(index)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={song.cover}
                        alt={song.title}
                        className="w-14 h-14 rounded-lg object-cover shadow-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold truncate ${isCurrentSong ? "text-red-600" : ""}`}>
                          {song.title}
                        </h4>
                        <p className={`text-sm ${textSecondary} truncate`}>{song.artist?.name ?? "Unknown Artist"}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrentSong && isPlaying) {
                            togglePlay();
                          } else {
                            playRecentSong(index);
                          }
                        }}
                        className="p-2 text-red-600"
                      >
                        {isThisSongPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side - Daily Mix */}
          <div className="w-2/3 overflow-y-auto">
            <div
              className="relative"
              style={{
                background: isDark
                  ? "linear-gradient(180deg, #991b1b 0%, #000000 100%)"
                  : "linear-gradient(180deg, #dc2626 0%, #f9fafb 100%)"
              }}
            >
              <div className="px-8 pt-6 pb-4">
                <div className="flex items-end gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={currentMix.image}
                      alt={currentMix.name}
                      className="w-44 h-44 rounded-2xl shadow-2xl object-cover"
                    />
                  </div>
                  <div className="space-y-2 pb-2 relative bottom-3">
                    <p className="text-sm font-semibold uppercase tracking-wider text-white">
                      Playlist
                    </p>
                    <h1 className="text-4xl font-black text-white">
                      {currentMix.name}
                    </h1>
                    <p className="text-lg opacity-80 text-white">
                      {currentMix.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-white">
                      <span className="font-semibold">Wavify</span>
                      <span>•</span>
                      <span>{mixSongs.length} songs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={playAllSongs}
                  className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105"
                >
                  <Play className="w-6 h-6 fill-white ml-1" />
                </button>
                <button className={`p-2 rounded-full ${hoverBg}`}>
                  <Heart className="w-6 h-6" />
                </button>
              </div>

              {/* Songs header */}
              <div
                className={`grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 border-b ${borderColor} ${textSecondary} text-sm font-semibold mb-2`}
              >
                <div className="w-8 text-center">#</div>
                <div>Title</div>
                <div>
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              {/* Songs List */}
              <div className="space-y-1">
                {mixSongs.map((song, index) => {
                  const isCurrentSong =
                    currentIndex === index && playlist[currentIndex]?.audio === song.audio;

                  const isThisSongPlaying = isCurrentSong && isPlaying;

                  return (
                    <div
                      key={song.id ?? index}
                      className={`grid grid-cols-[auto_1fr_auto] gap-4 items-center p-3 rounded-lg cursor-pointer group ${hoverBg} ${
                        isCurrentSong
                          ? isDark
                            ? "bg-zinc-800"
                            : "bg-gray-200"
                          : ""
                      }`}
                      onClick={() => {
                        setPlaylist(mixSongs, index);
                        playTrackAtIndex(index);
                      }}
                    >
                      <div className="w-8 flex items-center justify-center">
                        {isThisSongPlaying ? (
                          <Pause className="w-5 h-5 fill-current text-red-600" />
                        ) : (
                          <>
                            <span className={`${textSecondary} group-hover:hidden`}>
                              {index + 1}
                            </span>
                            <Play className="w-5 h-5 hidden group-hover:block fill-current text-red-600" />
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={song.cover}
                          alt={song.title}
                          className="w-12 h-12 rounded-lg object-cover shadow-md"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className={`font-semibold truncate ${isCurrentSong ? "text-red-600" : ""}`}>
                            {song.title}
                          </h4>
                          <p className={`text-sm ${textSecondary} truncate`}>{song.artist?.name ?? "Unknown Artist"}</p>
                        </div>
                      </div>

                      <div className="text-sm text-right">
                        <span className={textSecondary}>{song.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Player - Always Present */}
      <footer className={`fixed bottom-0 left-0 right-0 ${cardBg} border-t ${borderColor} backdrop-blur-xl ${isDark ? "bg-black/95" : "bg-white/95"} shadow-2xl z-30`}>
        {/* Mobile Mini Player */}
        <div className="lg:hidden block">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 mb-2">
              <img src={currentSong?.cover} alt="Now Playing" className="w-12 h-12 rounded-lg object-cover shadow-lg" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{currentSong?.title}</h4>
                <p className={`text-xs ${textSecondary} truncate`}>{currentSong?.artist?.name}</p>
              </div>
              <button
                onClick={togglePlay}
                className="p-2 text-red-600"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-0.5">
              <div className="bg-red-600 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Desktop Player */}
        <div className="hidden lg:block max-w-full mx-auto px-6 py-4">
          <div className="mb-3">
            <div className="w-full bg-gray-700 rounded-full h-1 cursor-pointer group relative" onClick={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              const rect = el.getBoundingClientRect();
              const clickX = (e as React.MouseEvent).clientX - rect.left;
              const percent = Math.min(Math.max(clickX / rect.width, 0), 1);
              seekTo(percent);
            }}>
              <div className="bg-red-600 h-full rounded-full relative transition-all" style={{ width: `${progressPercent}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-100 transition shadow-lg" />
              </div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <img src={currentSong?.cover} alt="Now Playing" className="w-14 h-14 rounded-lg object-cover shadow-lg" />
              <div className="min-w-0">
                <h4 className="font-bold truncate">{currentSong?.title}</h4>
                <p className={`text-sm ${textSecondary} truncate`}>{currentSong?.artist?.name}</p>
              </div>
              <button className={`p-2 rounded-full ${hoverBg} transition ml-2`}>
                <Heart className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => toggleShuffle()} className={`p-2 rounded-full ${hoverBg} transition ${shuffle ? "bg-red-700/20 border border-red-600" : ""}`}>
                <Shuffle className="w-5 h-5" />
              </button>
              <button onClick={() => prev()} className={`p-2 rounded-full ${hoverBg} transition`}>
                <SkipBack className="w-5 h-5 fill-current" />
              </button>
              <button onClick={() => togglePlay()} className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition transform hover:scale-110 shadow-2xl">
                {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
              </button>
              <button onClick={() => next()} className={`p-2 rounded-full ${hoverBg} transition`}>
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
              <button onClick={() => cycleRepeat()} className={`p-2 rounded-full ${hoverBg} transition ${repeat !== "off" ? "bg-red-700/20 border border-red-600" : ""}`}>
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <Repeat className="w-5 h-5" />
                  {repeat === "one" && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold leading-none">1</span>
                  )}
                </div>
              </button>
            </div>

            <div className="flex items-center gap-3 flex-1 justify-end">
              <Volume2 className="w-5 h-5" />
              <div className="w-24 flex items-center gap-2">
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}