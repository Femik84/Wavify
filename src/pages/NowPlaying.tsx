import React, { useEffect, useState } from "react";
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Heart, MoreHorizontal } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAudio } from "../lib/audioService";
import { useTheme } from "../contexts/ThemeContext";
import apiInstance from "../utils/axios";

// Utility function to safely get artist name
function getArtistName(artist: any): string {
  if (!artist) return "Unknown Artist";
  return typeof artist === "string" ? artist : artist.name || "Unknown Artist";
}

export default function NowPlaying() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, togglePlay, next, prev, seekTo, setVolume, toggleShuffle, cycleRepeat, playTrackAtIndex } = useAudio();
  const { playlist, currentIndex, isPlaying, currentTime, duration, volume, shuffle, repeat } = state;
  const { isDark } = useTheme();
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  const currentTrack = playlist?.[currentIndex];

  // Sync URL with current track
  useEffect(() => {
    if (playlist && playlist.length > 0 && playlist[currentIndex]) {
      const currentTrack = playlist[currentIndex];
      const urlIndex = searchParams.get("track");
      
      if (urlIndex !== currentIndex.toString()) {
        setSearchParams({ 
          track: currentIndex.toString(),
          title: encodeURIComponent(currentTrack.title),
          artist: encodeURIComponent(getArtistName(currentTrack.artist))
        }, { replace: true });
      }
    }
  }, [currentIndex, playlist, searchParams, setSearchParams]);

  // Load track from URL on mount or redirect if no playlist
  useEffect(() => {
    const trackIndex = searchParams.get("track");
    
    if (!playlist || playlist.length === 0) {
      navigate("/", { replace: true });
      return;
    }
    
    if (trackIndex) {
      const index = parseInt(trackIndex);
      if (!isNaN(index) && index >= 0 && index < playlist.length && index !== currentIndex) {
        playTrackAtIndex(index);
      }
    }
  }, []);

  // Check if current track is liked
  useEffect(() => {
    const checkIfLiked = async () => {
      if (!currentTrack?.id) return;

      try {
        const response = await apiInstance.get(`songs/${currentTrack.id}/`);
        setIsLiked(response.data.is_liked || false);
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkIfLiked();
    setHasTrackedPlay(false); // Reset tracked play for new track
  }, [currentTrack?.id]);

  // Track recently played when song starts playing
  useEffect(() => {
    const trackRecentlyPlayed = async () => {
      if (!currentTrack?.id || !isPlaying || hasTrackedPlay) return;

      try {
        await apiInstance.post(`songs/${currentTrack.id}/play/`);
        setHasTrackedPlay(true);
      } catch (error) {
        console.error("Error tracking recently played:", error);
      }
    };

    trackRecentlyPlayed();
  }, [currentTrack?.id, isPlaying, hasTrackedPlay]);

  // Handle like/unlike toggle
  const handleLikeToggle = async () => {
    if (!currentTrack?.id || isLikeLoading) return;

    setIsLikeLoading(true);

    try {
      const response = await apiInstance.post(`songs/${currentTrack.id}/like/`);
      setIsLiked(response.data.is_liked);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Optionally show an error message to user
    } finally {
      setIsLikeLoading(false);
    }
  };

  function formatTime(t: number) {
    if (!t || isNaN(t)) return "0:00";
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  if (!playlist || playlist.length === 0 || !currentTrack) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-gradient-to-b from-gray-900 via-gray-900 to-black" : "bg-gradient-to-b from-gray-100 via-white to-gray-50"}`}>
      <div className="relative h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 z-10">
          <button 
            onClick={() => navigate(-1)} 
            className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
          >
            <ChevronDown className={`w-6 h-6 ${isDark ? "text-white" : "text-gray-900"}`} />
          </button>
          <span className={`text-sm font-semibold tracking-wide uppercase ${isDark ? "text-white" : "text-gray-900"}`}>
            Now Playing
          </span>
          <button 
            className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
          >
            <MoreHorizontal className={`w-6 h-6 ${isDark ? "text-white" : "text-gray-900"}`} />
          </button>
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center px-8 py-6">
          <div className="w-full max-w-md">
            <img 
              src={currentTrack.cover} 
              alt="Album Art" 
              className={`w-full aspect-square rounded-lg shadow-2xl object-cover ${isDark ? "shadow-black/50" : "shadow-gray-400/30"}`}
            />
          </div>
        </div>

        {/* Track Info & Controls */}
        <div className="px-8 pb-8 space-y-6">
          {/* Track Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl font-bold mb-1 truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                {currentTrack.title}
              </h1>
              <p className={`text-base truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {getArtistName(currentTrack.artist)}
              </p>
            </div>
            <button 
              onClick={handleLikeToggle}
              disabled={isLikeLoading}
              className={`p-2 ml-4 transition-all rounded-full ${
                isDark ? "hover:bg-white/10" : "hover:bg-black/5"
              } ${isLikeLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Heart 
                className={`w-6 h-6 transition-all ${
                  isLiked 
                    ? "text-red-500 fill-red-500" 
                    : isDark 
                      ? "text-gray-400 hover:text-white" 
                      : "text-gray-600 hover:text-gray-900"
                }`} 
              />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div 
              className={`w-full h-1 rounded-full cursor-pointer group ${isDark ? "bg-gray-700" : "bg-gray-300"}`}
              onClick={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                const rect = el.getBoundingClientRect();
                const clickX = (e as React.MouseEvent).clientX - rect.left;
                const percent = Math.min(Math.max(clickX / rect.width, 0), 1);
                seekTo(percent);
              }}
            >
              <div 
                className={`h-full rounded-full relative transition-all ${isDark ? "bg-white" : "bg-gray-900"}`}
                style={{ width: `${progressPercent}%` }}
              >
                <div 
                  className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "bg-white" : "bg-gray-900"}`}
                />
              </div>
            </div>
            <div className={`flex justify-between text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button 
              onClick={() => toggleShuffle()} 
              className={`p-2 rounded-full transition-all ${
                shuffle 
                  ? isDark ? "text-red-500 hover:text-red-400" : "text-red-600 hover:text-red-700"
                  : isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button 
              onClick={() => prev()} 
              className={`p-2 transition-colors ${isDark ? "text-white hover:text-gray-300" : "text-gray-900 hover:text-gray-700"}`}
            >
              <SkipBack className="w-8 h-8" fill="currentColor" />
            </button>

            <button 
              onClick={() => togglePlay()} 
              className={`p-4 rounded-full shadow-xl transition-all hover:scale-105 ${
                isDark ? "bg-white text-black hover:bg-gray-100" : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {isPlaying ? <Pause className="w-7 h-7" fill="currentColor" /> : <Play className="w-7 h-7 ml-1" fill="currentColor" />}
            </button>

            <button 
              onClick={() => next()} 
              className={`p-2 transition-colors ${isDark ? "text-white hover:text-gray-300" : "text-gray-900 hover:text-gray-700"}`}
            >
              <SkipForward className="w-8 h-8" fill="currentColor" />
            </button>

            <button 
              onClick={() => cycleRepeat()} 
              className={`p-2 rounded-full transition-all relative ${
                repeat !== "off"
                  ? isDark ? "text-red-500 hover:text-red-400" : "text-red-600 hover:text-red-700"
                  : isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Repeat className="w-5 h-5" />
              {repeat === "one" && (
                <span className={`absolute -top-0.5 -right-0.5 text-[10px] font-bold ${isDark ? "text-red-500" : "text-red-600"}`}>1</span>
              )}
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 max-w-md mx-auto pt-2">
            <Volume2 className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
            <input 
              type="range" 
              min={0} 
              max={1} 
              step={0.01} 
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))}
              className={`flex-1 h-1 rounded-full appearance-none cursor-pointer ${
                isDark 
                  ? "bg-gray-700 [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:bg-white" 
                  : "bg-gray-300 [&::-webkit-slider-thumb]:bg-gray-900 [&::-moz-range-thumb]:bg-gray-900"
              } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}