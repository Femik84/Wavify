import { useState, useEffect } from "react";
import { Search, Music, User, Folder, Disc, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchSongs,
  fetchArtists,
  fetchPlaylists,
  fetchGenres,
  trackRecentlyPlayed,
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

type BrowserSearchProps = {
  isDark: boolean;
};

// Utility function to safely get artist name
function getArtistName(artist: any): string {
  if (!artist) return "Unknown Artist";
  return typeof artist === "string" ? artist : artist.name || "Unknown Artist";
}

export default function BrowserSearch({ isDark }: BrowserSearchProps) {
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
  const [showResults, setShowResults] = useState(false);

  const navigate = useNavigate();
  const { setPlaylist, playTrackAtIndex } = useAudio();

  const inputBg = isDark ? "bg-gray-800/10" : "bg-white";
  const inputBorder = isDark ? "border-gray-200/50" : "border-gray-300";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const hoverBg = isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100";
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
      setShowResults(false);
      return;
    }

    setShowResults(true);
    const lowerQuery = query.toLowerCase();

    const filteredSongs = allData.songs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerQuery) ||
        getArtistName(song.artist).toLowerCase().includes(lowerQuery) ||
        song.album?.toLowerCase().includes(lowerQuery)
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
      songs: filteredSongs.slice(0, 10),
      artists: filteredArtists.slice(0, 10),
      playlists: filteredPlaylists.slice(0, 10),
      genres: filteredGenres.slice(0, 10),
    });
  }, [query, allData]);

  const handleSongClick = async (song: Song) => {
    const songIndex = results.songs.findIndex((s) => s.id === song.id);

    setPlaylist(results.songs, songIndex);
    playTrackAtIndex(songIndex);

    try {
      await trackRecentlyPlayed(song.id);
    } catch (err) {
      console.error("Failed to track play:", err);
    }

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      navigate(
        `/now-playing?track=${songIndex}&title=${encodeURIComponent(
          song.title
        )}&artist=${encodeURIComponent(getArtistName(song.artist))}`
      );
    }
  };

  const handleArtistClick = (artist: Artist) => {
    navigate(`/artist/${encodeURIComponent(artist.name)}`);
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    navigate(`/playlist/${encodeURIComponent(playlist.name)}`);
  };

  const handleGenreClick = (genre: Genre) => {
    navigate(`/genre/${encodeURIComponent(genre.name)}`);
  };

  const clearSearch = () => {
    setQuery("");
    setShowResults(false);
  };

  const hasResults =
    results.songs.length > 0 ||
    results.artists.length > 0 ||
    results.playlists.length > 0 ||
    results.genres.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums..."
          className={`w-full ${inputBg} border ${inputBorder} rounded-full py-3 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30 transition-all ${textPrimary}`}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div className={`${cardBg} rounded-2xl shadow-xl border ${borderColor} overflow-hidden`}>
          <div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                <p className={`mt-3 text-sm ${textSecondary}`}>Loading...</p>
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
                            {getArtistName(song.artist)} • {song.album}
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
  );
}