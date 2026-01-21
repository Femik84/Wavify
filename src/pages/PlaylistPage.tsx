import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Play,
  Pause,
  ChevronLeft,
  Clock,
} from "lucide-react";
import {
  fetchPlaylists,
  getTrendingSongs,
  getSongsByPlaylist,
  fetchGenres,
  getSongsByGenre,
  fetchArtists,
  getSongsByArtist,
  type Playlist,
  type Song,
  type Genre,
  type Artist,
} from "../Data";
import { useAudio } from "../lib/audioService";
import { useTheme } from "../contexts/ThemeContext";
import Footer from "../components/Footer";
import LoadingSkeleton from "../components/LoadingSkeleton";

// Helper to determine entity type from the URL
function useEntityType() {
  const location = useLocation();
  if (location.pathname.startsWith("/playlist/")) return "playlist";
  if (location.pathname.startsWith("/genre/")) return "genre";
  if (location.pathname.startsWith("/artist/")) return "artist";
  return null;
}

export default function PlaylistPage() {
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const entityType = useEntityType();
  const { isDark, setTheme } = useTheme();

  const [entity, setEntity] = useState<Playlist | Genre | Artist | null>(null);
  const [entitySongs, setEntitySongs] = useState<Song[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    state,
    togglePlay,
    setPlaylist,
    playTrackAtIndex,
  } = useAudio();

  const initRef = useRef(false); // ensure we don't re-init audio repeatedly

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setEntity(null);
      setEntitySongs([]);

      try {
        const name = decodeURIComponent(entityId || "");

        // Fetch trending for sidebar
        const trending = await getTrendingSongs();
        if (cancelled) return;
        setTrendingSongs(trending.slice(0, 6));

        let found: Playlist | Genre | Artist | null = null;
        let songs: Song[] = [];

        switch (entityType) {
          case "playlist": {
            const playlists = await fetchPlaylists();
            if (cancelled) return;
            found = playlists.find((p) => p.name === name) || null;
            if (found) {
              songs = await getSongsByPlaylist(found.name);
            }
            break;
          }
          case "genre": {
            const genres = await fetchGenres();
            if (cancelled) return;
            found = genres.find((g) => g.name === name) || null;
            if (found) {
              songs = await getSongsByGenre((found as Genre).name);
            }
            break;
          }
          case "artist": {
            const artists = await fetchArtists();
            if (cancelled) return;
            found = artists.find((a) => a.name === name) || null;
            if (found) {
              songs = await getSongsByArtist((found as Artist).name);
            }
            break;
          }
          default:
            found = null;
            songs = [];
        }

        if (cancelled) return;

        setEntity(found);
        setEntitySongs(songs || []);

        // Initialize audio session playlist with entity songs (once)
        if (!initRef.current && songs && songs.length > 0) {
          const svcPlaylistEmpty = !state.playlist || state.playlist.length === 0;
          if (svcPlaylistEmpty) {
            setPlaylist(songs, 0);
            initRef.current = true;
          }
        }
      } catch (err) {
        console.error("Error loading entity page:", err);
        setError("Failed to load content. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (entityType && entityId) {
      load();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityType]);

  // Handle back navigation
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Loading UI
  if (loading) {
    return <LoadingSkeleton isDark={isDark} />;
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-black" : "bg-gray-50"} ${isDark ? "text-white" : "text-gray-900"} flex items-center justify-center`}>
        <div className="text-center">
          <p className="mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-full bg-red-600 text-white">Retry</button>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {entityType ? `${entityType[0].toUpperCase() + entityType.slice(1)} not found` : "Page not found"}
          </h2>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-semibold transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const bgColor = isDark ? "bg-black" : "bg-gray-50";
  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const hoverBg = isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100";
  const borderColor = isDark ? "border-zinc-800" : "border-gray-200";

  const { playlist, currentIndex, isPlaying } = state;

  // Play all songs from the entity
  const playAllSongs = () => {
    if (entitySongs.length > 0) {
      setPlaylist(entitySongs, 0);
      playTrackAtIndex(0);
    }
  };

  // Play a specific song from the entity
  const playSongAtIndex = (index: number) => {
    setPlaylist(entitySongs, index);
    playTrackAtIndex(index);
  };

  // Play trending song from sidebar
  const playTrendingSong = (index: number) => {
    setPlaylist(trendingSongs, index);
    playTrackAtIndex(index);
  };

  // Determine header image/title/description
  const imageSrc = "image" in entity ? (entity as any).image : (entity as any).cover;
  const title = entity.name;
  const description =
    ("description" in entity && (entity as any).description) ||
    ("bio" in entity && (entity as any).bio) ||
    "";

  return (
    <div className={`min-h-screen ${bgColor} ${textPrimary} transition-colors duration-300 pb-20 lg:pb-24`}>
      <div className="hidden lg:flex h-[calc(100vh-6rem)]">
        {/* Left Side - Trending Now */}
        <div className={`${cardBg} w-1/3 border-r ${borderColor} overflow-y-auto scrollbar-hide`}>
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
          `}</style>

          <div className="p-6 sticky top-0 bg-opacity-95 backdrop-blur z-10" style={{
            background: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)'
          }}>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={handleBack}
                className={`p-2 rounded-full relative top-3 bg-red-600 transition hover:bg-red-700`}
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
                  key={song.id}
                  className={`${cardBg} rounded-lg p-4 ${hoverBg} transition cursor-pointer group ${isCurrentSong ? (isDark ? "bg-zinc-800" : "bg-gray-200") : ""}`}
                  onClick={() => {
                    if (isCurrentSong && isPlaying) {
                      togglePlay();
                    } else {
                      playTrendingSong(index);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img src={song.cover} alt={song.title} className="w-14 h-14 rounded-lg object-cover shadow-md flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${isCurrentSong ? "text-red-600" : ""}`}>{song.title}</h4>
                      <p className={`text-sm ${textSecondary} truncate`}>{song.artist.name}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentSong && isPlaying) {
                          togglePlay();
                        } else {
                          playTrendingSong(index);
                        }
                      }}
                      className="p-2 text-red-600"
                    >
                      {isThisSongPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Playlist/Genre/Artist detail */}
        <div className="w-2/3 overflow-y-auto">
          <div
            className="relative"
            style={{
              background: isDark
                ? "linear-gradient(180deg, #991b1b 0%, #000000 100%)"
                : "linear-gradient(180deg, #dc2626 0%, #f9fafb 100%)"
            }}
          >
            <div className="px-8 py-6">
              <div className="flex items-end gap-6">
                <div className="flex-shrink-0">
                  <img src={imageSrc} alt={title} className="w-44 h-44 rounded-2xl shadow-2xl object-cover" />
                </div>
                <div className="space-y-2 pb-2 flex-1 min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wider text-white">
                    {entityType ? entityType.charAt(0).toUpperCase() + entityType.slice(1) : ""}
                  </p>
                  <h1 className="text-4xl font-black text-white">{title}</h1>
                  <p className="text-lg opacity-80 text-white">{description}</p>
                  {"songCount" in entity && (
                    <div className="flex items-center gap-2 text-sm text-white">
                      <span className="font-semibold">Wavify</span>
                      <span>•</span>
                      <span>{entitySongs.length} songs</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={playAllSongs}
                  className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105 flex-shrink-0 mb-2"
                >
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </button>
              </div>
            </div>

            <div className="px-8 pb-6">
              {/* Songs header */}
              <div className={`grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 border-b ${borderColor} ${textSecondary} text-sm font-semibold mb-2`}>
                <div className="w-8 text-center">#</div>
                <div>Title</div>
                <div>
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              {/* Songs List */}
              <div className="space-y-1">
                {entitySongs.map((song, index) => {
                  const isCurrentSong = playlist[currentIndex]?.audio === song.audio;
                  const isThisSongPlaying = isCurrentSong && isPlaying;

                  return (
                    <div
                      key={song.id ?? index}
                      className={`grid grid-cols-[auto_1fr_auto] gap-4 items-center p-3 rounded-lg cursor-pointer group ${hoverBg} ${isCurrentSong ? (isDark ? "bg-zinc-800" : "bg-gray-200") : ""}`}
                      onClick={() => {
                        if (isCurrentSong && isPlaying) {
                          togglePlay();
                        } else {
                          playSongAtIndex(index);
                        }
                      }}
                    >
                      <div className="w-8 flex items-center justify-center">
                        {isThisSongPlaying ? (
                          <Pause className="w-5 h-5 fill-current text-red-600" />
                        ) : (
                          <>
                            <span className={`${textSecondary} group-hover:hidden`}>{index + 1}</span>
                            <Play className="w-5 h-5 hidden group-hover:block fill-current text-red-600" />
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-lg object-cover shadow-md" />
                        <div className="min-w-0 flex-1">
                          <h4 className={`font-semibold truncate ${isCurrentSong ? "text-red-600" : ""}`}>{song.title}</h4>
                          <p className={`text-sm ${textSecondary} truncate`}>{song.artist.name}</p>
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

      {/* Mobile View */}
      <div className="lg:hidden">
        <div className="relative h-80">
          <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />

          {/* Back Button */}
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-all transform hover:scale-105 shadow-lg z-20"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-end justify-between px-6 pb-6">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">
                {entityType ? entityType.charAt(0).toUpperCase() + entityType.slice(1) : ""}
              </p>
              <h1 className="text-3xl font-black text-white mb-2 leading-tight">{title}</h1>
              <p className="text-sm text-white/80 mb-3 line-clamp-2">{description}</p>
              {"songCount" in entity && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className="font-semibold">Wavify</span>
                  <span>•</span>
                  <span>{entitySongs.length} songs</span>
                </div>
              )}
            </div>

            <button
              onClick={playAllSongs}
              className="flex-shrink-0 w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-95 hover:scale-105"
            >
              <Play className="w-6 h-6 fill-white text-white ml-0.5" />
            </button>
          </div>
        </div>

        <div className="px-6 pt-6 pb-12">
          <div className="space-y-2">
            {entitySongs.map((song, index) => {
              const isCurrentSong = playlist[currentIndex]?.audio === song.audio;
              const isThisSongPlaying = isCurrentSong && isPlaying;

              return (
                <div
                  key={song.id ?? index}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${hoverBg} ${isCurrentSong ? (isDark ? "bg-zinc-800 ring-1 ring-red-600/20" : "bg-gray-100 ring-1 ring-red-600/20") : ""}`}
                  onClick={() => {
                    if (isCurrentSong && isPlaying) {
                      togglePlay();
                    } else {
                      playSongAtIndex(index);
                    }
                  }}
                >
                  <div className="w-6 flex items-center justify-center flex-shrink-0">
                    {isThisSongPlaying ? (
                      <Pause className="w-4 h-4 fill-current text-red-600" />
                    ) : (
                      <span className={`text-sm font-semibold ${textSecondary}`}>{index + 1}</span>
                    )}
                  </div>

                  <div className="relative flex-shrink-0">
                    <img src={song.cover} alt={song.title} className="w-14 h-14 rounded-lg object-cover shadow-md" />
                    {isThisSongPlaying && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold truncate ${isCurrentSong ? "text-red-600" : ""}`}>{song.title}</h4>
                    <p className={`text-sm ${textSecondary} truncate`}>{song.artist.name}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSongAtIndex(index);
                    }}
                    className="p-2 text-red-600"
                  >
                    {isThisSongPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}