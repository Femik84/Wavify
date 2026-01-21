import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  Heart,
} from "lucide-react";
import { useAudio } from "../lib/audioService";
import { useTheme } from "../contexts/ThemeContext";
import type {  Artist } from "../Data";
import apiInstance from "../utils/axios";

// Utility function to safely return the artist name
function getArtistName(artist: Artist | string | undefined): string {
  if (!artist) return "";
  return typeof artist === "string" ? artist : artist.name || "";
}

// Utility function to format time in min:sec
function formatTime(t: number | undefined): string {
  if (!t || isNaN(t)) return "0:00";
  const minutes = Math.floor(t / 60);
  const seconds = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function Footer() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const {
    state,
    togglePlay,
    next,
    prev,
    seekTo,
    setVolume,
    toggleShuffle,
    cycleRepeat,
  } = useAudio();

  const { playlist, currentIndex, isPlaying, volume, currentTime, duration, shuffle, repeat } = state;
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const currentTrack = playlist?.[currentIndex];

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
  }, [currentTrack?.id]);

  // Handle like/unlike toggle
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentTrack?.id || isLikeLoading) return;

    setIsLikeLoading(true);

    try {
      const response = await apiInstance.post(`songs/${currentTrack.id}/like/`);
      setIsLiked(response.data.is_liked);
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLikeLoading(false);
    }
  };

 
  function navigateToNowPlaying() {
    const currentTrack = playlist?.[currentIndex];
    if (currentTrack) {
      // Use getArtistName for the query param
      navigate(`/now-playing?track=${currentIndex}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(getArtistName(currentTrack.artist))}`);
    }
  }

  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const hoverBg = isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <footer className={`fixed bottom-0 left-0 right-0 ${cardBg} border-t ${isDark ? "border-zinc-800" : "border-gray-200"} backdrop-blur-xl ${isDark ? "bg-black/95" : "bg-white/95"} shadow-2xl`}>
      {/* Mobile Mini Player */}
      <div onClick={navigateToNowPlaying} className="md:hidden block cursor-pointer">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <img src={playlist?.[currentIndex]?.cover} alt="Now Playing" className="w-12 h-12 rounded-lg object-cover shadow-lg" />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">{playlist?.[currentIndex]?.title}</h4>
              <p className={`text-xs ${textSecondary} truncate`}>
                {getArtistName(playlist?.[currentIndex]?.artist)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePlay();
              }}
              className="p-2 text-red-600 "
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-0.5">
            <div className="bg-red-600 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Desktop Player - Reduced Height */}
      <div className="hidden md:block">
        {/* Progress Bar at Top */}
        <div
          className="w-full bg-gray-700 h-1 cursor-pointer group relative"
          onClick={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            const rect = el.getBoundingClientRect();
            const clickX = (e as React.MouseEvent)!.clientX - rect.left;
            const percent = Math.min(Math.max(clickX / rect.width, 0), 1);
            seekTo(percent);
          }}
        >
          <div className="bg-red-600 h-full relative transition-all" style={{ width: `${progressPercent}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg" />
          </div>
        </div>

        {/* Main Content - Compact */}
        <div className="max-w-7xl mx-auto px-6 py-2.5">
          <div className="flex items-center justify-between gap-6">
            {/* Left Section - Track Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xs">
              <img src={playlist?.[currentIndex]?.cover} alt="Now Playing" className="w-12 h-12 rounded-md object-cover shadow-lg" />
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm truncate">{playlist?.[currentIndex]?.title}</h4>
                <p className={`text-xs ${textSecondary} truncate`}>
                  {getArtistName(playlist?.[currentIndex]?.artist)}
                </p>
              </div>
              <button 
                onClick={handleLikeToggle}
                disabled={isLikeLoading}
                className={`p-1.5 relative right-20 rounded-full ${hoverBg} transition ${isLikeLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Heart 
                  className={`w-5 h-5 transition-all ${
                    isLiked 
                      ? "text-red-500 fill-red-500" 
                      : ""
                  }`} 
                />
              </button>
            
            </div>

            {/* Center Section - Controls */}
            <div className="flex items-center gap-2">
              <button onClick={() => toggleShuffle()} className={`p-1.5 rounded-full ${hoverBg} transition ${shuffle ? "bg-red-700/20 border border-red-600" : ""}`} title="Shuffle">
                <Shuffle className="w-4 h-4" />
              </button>
              <button onClick={() => prev()} className={`p-1.5 rounded-full ${hoverBg} transition`} title="Previous">
                <SkipBack className="w-4 h-4 fill-current" />
              </button>
              <button onClick={() => togglePlay()} className="p-2.5 bg-red-600 hover:bg-red-700 rounded-full transition transform hover:scale-105 shadow-lg" aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>
              <button onClick={() => next()} className={`p-1.5 rounded-full ${hoverBg} transition`} title="Next">
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
              <button onClick={() => cycleRepeat()} className={`p-1.5 rounded-full ${hoverBg} transition ${repeat !== "off" ? "bg-red-700/20 border border-red-600" : ""}`} title={`Repeat: ${repeat}`}>
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                  {repeat === "one" && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-3 h-3 rounded-full flex items-center justify-center font-bold leading-none">1</span>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-1 text-xs ml-2">
                <span className="tabular-nums">{formatTime(currentTime)}</span>
                <span className={textSecondary}>/</span>
                <span className={`tabular-nums ${textSecondary}`}>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Section - Volume */}
            <div className="flex items-center gap-2 flex-1 justify-end max-w-xs">
              <Volume2 className="w-4 h-4" />
              <input 
                type="range" 
                min={0} 
                max={1} 
                step={0.01} 
                value={volume} 
                onChange={(e) => setVolume(Number(e.target.value))} 
                className="w-20 h-1 accent-red-600 cursor-pointer" 
                style={{
                  background: `linear-gradient(to right, rgb(220, 38, 38) 0%, rgb(220, 38, 38) ${volume * 100}%, rgb(55, 65, 81) ${volume * 100}%, rgb(55, 65, 81) 100%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}