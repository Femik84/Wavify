 import { useState, useEffect, useRef } from "react";
import { Search, Sun, Moon, Menu, Music, User, Folder, Disc } from "lucide-react";
import { navItems, trackRecentlyPlayed } from "../Data";
import { useNavigate, useLocation } from "react-router-dom";
import {
  fetchSongs,
  fetchArtists,
  fetchPlaylists,
  fetchGenres,
  type Song,
  type Artist,
  type Playlist,
  type Genre,
} from "../Data";
import { useAudio } from "../lib/audioService";

type SearchResults = {
  songs: Song[];
  artists: Artist[];
  playlists: Playlist[];
  genres: Genre[];
};

type Props = {
  isDark: boolean;
  setIsDark: (d: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
};

export default function Header({ isDark, setIsDark, setSidebarOpen }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    songs: [],
    artists: [],
    playlists: [],
    genres: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [allData, setAllData] = useState<SearchResults>({
    songs: [],
    artists: [],
    playlists: [],
    genres: [],
  });
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setPlaylist, playTrackAtIndex } = useAudio();

  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const hoverBg = isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const borderColor = isDark ? "border-zinc-800" : "border-gray-200";

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [songs, artists, playlists, genres] = await Promise.all([
          fetchSongs(),
          fetchArtists(),
          fetchPlaylists(),
          fetchGenres(),
        ]);
        setAllData({ songs, artists, playlists, genres });
      } catch (error) {
        console.error("Error loading search data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter results based on query
  useEffect(() => {
    if (!query.trim()) {
      setResults({ songs: [], artists: [], playlists: [], genres: [] });
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    const lowerQuery = query.toLowerCase();

    const filteredSongs = allData.songs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.name.toLowerCase().includes(lowerQuery) ||
        song.album.toLowerCase().includes(lowerQuery)
    );

    const filteredArtists = allData.artists.filter((artist) =>
      artist.name.toLowerCase().includes(lowerQuery)
    );

    const filteredPlaylists = allData.playlists.filter(
      (playlist) =>
        playlist.name.toLowerCase().includes(lowerQuery) ||
        playlist.description?.toLowerCase().includes(lowerQuery)
    );

    const filteredGenres = allData.genres.filter((genre) =>
      genre.name.toLowerCase().includes(lowerQuery)
    );

    setResults({
      songs: filteredSongs.slice(0, 5),
      artists: filteredArtists.slice(0, 5),
      playlists: filteredPlaylists.slice(0, 5),
      genres: filteredGenres.slice(0, 5),
    });
  }, [query, allData]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSongClick = async (song: Song) => {
    // Find the index of this song in the results
    const songIndex = results.songs.findIndex(s => s.id === song.id);
    
    // Set the entire search results as the playlist
    setPlaylist(results.songs, songIndex);
    playTrackAtIndex(songIndex);
    
    // Track the play
    try {
      await trackRecentlyPlayed(song.id);
    } catch (err) {
      console.error("Failed to track play:", err);
    }
    
    // Check if mobile and navigate to now-playing
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      const artistName = typeof song.artist === "string" ? song.artist : song.artist?.name || "Unknown Artist";
      navigate(
        `/now-playing?track=${songIndex}&title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(artistName)}`
      );
    }
    
    setShowDropdown(false);
    setQuery("");
  };

  const handleArtistClick = (artist: Artist) => {
    navigate(`/artist/${encodeURIComponent(artist.name)}`);
    setShowDropdown(false);
    setQuery("");
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    navigate(`/playlist/${encodeURIComponent(playlist.name)}`);
    setShowDropdown(false);
    setQuery("");
  };

  const handleGenreClick = (genre: Genre) => {
    navigate(`/genre/${encodeURIComponent(genre.name)}`);
    setShowDropdown(false);
    setQuery("");
  };

  const hasResults =
    results.songs.length > 0 ||
    results.artists.length > 0 ||
    results.playlists.length > 0 ||
    results.genres.length > 0;

  // Mobile search handler: navigate to /browse and ensure scroll to top
  const handleMobileSearch = () => {
    navigate("/browse");
    if (typeof window !== "undefined") {
      // small timeout to ensure navigation happens first in SPA routers that might preserve scroll
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }, 50);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-xl ${
        isDark ? "bg-black/80" : "bg-white/80"
      } border-b ${borderColor}`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <h1
            className="text-3xl font-black cursor-pointer"
            onClick={() => navigate("/")}
          >
            Wavi<span className="text-red-600">fy</span>
          </h1>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {navItems.map((item, idx) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={idx}
                  onClick={() => navigate(item.href)}
                  className={`text-sm font-medium transition ${
                    isActive ? "text-red-600" : textSecondary
                  } hover:text-red-600`}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Search + Theme Toggle + Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Search Container with Dropdown */}
          <div ref={searchRef} className="relative hidden md:block">
            <div
              className={`flex items-center gap-3 ${cardBg} rounded-full px-5 py-2.5 shadow-lg transition`}
            >
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && setShowDropdown(true)}
                placeholder="Search songs, artists, albums..."
                className={`text-sm ${textSecondary} w-64 bg-transparent outline-none ${textPrimary}`}
              />
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
              <div
                className={`absolute top-full mt-2 w-full min-w-[400px] ${cardBg} rounded-2xl shadow-2xl border ${borderColor} overflow-hidden`}
              >
                <div className="max-h-[70vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {isLoading ? (
                    <div className="py-8 text-center">
                      <div className="inline-block w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <p className={`mt-3 text-sm ${textSecondary}`}>Loading...</p>
                    </div>
                  ) : !query.trim() ? (
                    <div className="py-8 text-center">
                      <Search className={`w-10 h-10 mx-auto mb-2 ${textSecondary}`} />
                      <p className={`text-sm ${textSecondary}`}>
                        Start typing to search
                      </p>
                    </div>
                  ) : !hasResults ? (
                    <div className="py-8 text-center">
                      <Search className={`w-10 h-10 mx-auto mb-2 ${textSecondary}`} />
                      <p className={`text-sm ${textSecondary}`}>
                        No results found for "{query}"
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {/* Songs */}
                      {results.songs.length > 0 && (
                        <div className="mb-2">
                          <div className={`px-4 py-2 flex items-center gap-2 ${textSecondary}`}>
                            <Music className="w-4 h-4" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">
                              Songs
                            </h3>
                          </div>
                          {results.songs.map((song) => (
                            <button
                              key={song.id}
                              onClick={() => handleSongClick(song)}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 ${hoverBg} transition`}
                            >
                              <img
                                src={song.cover}
                                alt={song.title}
                                className="w-10 h-10 rounded object-cover"
                              />
                              <div className="flex-1 text-left min-w-0">
                                <p className={`text-sm font-medium ${textPrimary} truncate`}>
                                  {song.title}
                                </p>
                                <p className={`text-xs ${textSecondary} truncate`}>
                                  {song.artist.name} • {song.album}
                                </p>
                              </div>
                              <span className={`text-xs ${textSecondary} shrink-0`}>
                                {song.duration}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Artists */}
                      {results.artists.length > 0 && (
                        <div className="mb-2">
                          <div className={`px-4 py-2 flex items-center gap-2 ${textSecondary}`}>
                            <User className="w-4 h-4" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">
                              Artists
                            </h3>
                          </div>
                          {results.artists.map((artist) => (
                            <button
                              key={artist.id}
                              onClick={() => handleArtistClick(artist)}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 ${hoverBg} transition`}
                            >
                              <img
                                src={artist.image}
                                alt={artist.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1 text-left">
                                <p className={`text-sm font-medium ${textPrimary}`}>
                                  {artist.name}
                                </p>
                                {artist.followers && (
                                  <p className={`text-xs ${textSecondary}`}>
                                    {artist.followers} followers
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Playlists */}
                      {results.playlists.length > 0 && (
                        <div className="mb-2">
                          <div className={`px-4 py-2 flex items-center gap-2 ${textSecondary}`}>
                            <Folder className="w-4 h-4" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">
                              Playlists
                            </h3>
                          </div>
                          {results.playlists.map((playlist) => (
                            <button
                              key={playlist.id}
                              onClick={() => handlePlaylistClick(playlist)}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 ${hoverBg} transition`}
                            >
                              <img
                                src={playlist.image}
                                alt={playlist.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                              <div className="flex-1 text-left min-w-0">
                                <p className={`text-sm font-medium ${textPrimary} truncate`}>
                                  {playlist.name}
                                </p>
                                {playlist.description && (
                                  <p className={`text-xs ${textSecondary} truncate`}>
                                    {playlist.description}
                                  </p>
                                )}
                              </div>
                              {playlist.songCount !== undefined && (
                                <span className={`text-xs ${textSecondary} shrink-0`}>
                                  {playlist.songCount} songs
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Genres */}
                      {results.genres.length > 0 && (
                        <div className="mb-2">
                          <div className={`px-4 py-2 flex items-center gap-2 ${textSecondary}`}>
                            <Disc className="w-4 h-4" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">
                              Genres
                            </h3>
                          </div>
                          {results.genres.map((genre) => (
                            <button
                              key={genre.id}
                              onClick={() => handleGenreClick(genre)}
                              className={`w-full px-4 py-2.5 flex items-center gap-3 ${hoverBg} transition`}
                            >
                              {genre.image && (
                                <img
                                  src={genre.image}
                                  alt={genre.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <div className="flex-1 text-left">
                                <p className={`text-sm font-medium ${textPrimary}`}>
                                  {genre.name}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Search Button - Navigate to browse page */}
          <button
            onClick={handleMobileSearch}
            className={`md:hidden p-2.5 rounded-full ${cardBg} ${hoverBg} transition shadow-lg`}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2.5 rounded-full ${cardBg} ${hoverBg} transition shadow-lg`}
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Mobile Menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={`md:hidden p-2.5 rounded-full ${cardBg} ${hoverBg} transition`}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}