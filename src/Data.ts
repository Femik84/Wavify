import apiInstance from "../src/utils/axios";

// ========================
// TYPE DEFINITIONS
// ========================

export type NavItem = {
  name: string;
  href: string;
};

export type Artist = {
  id: number;
  name: string;
  image: string;
  followers?: string;
  isFavorite: boolean;
};

export type Playlist = {
  id: number;
  name: string;
  description?: string;
  image: string;
  songCount?: number;
  isHeroSlide: boolean;
  isFeatured: boolean;
  isProfile: boolean;
};

export type PlaylistRef = {
  id: number;
  name: string;
  description?: string;
  image: string;
  isHeroSlide: boolean;
  isFeatured: boolean;
  isProfile: boolean;
};

export type Genre = {
  id: number;
  name: string;
  image?: string;
};

export type Song = {
  id: number;
  title: string;
  artist: Artist;
  album: string;
  duration: string;
  cover: string;
  audio: string;
  playlist: PlaylistRef;
  genre: Genre;
  isLiked: boolean;
  isRecentlyPlayed: boolean;
  isTrending: boolean;
  isNewRelease: boolean;
  isTopChart: boolean;
  lastPlayedAt?: string | null;
};

// ========================
// BACKEND RESPONSE TYPES
// ========================

type BackendArtist = {
  id: number;
  name: string;
  image: string;
  followers: number;
  is_favorite: boolean;
};

type BackendGenre = {
  id: number;
  name: string;
  image: string;
};

type BackendPlaylist = {
  id: number;
  name: string;
  description: string;
  image: string;
  is_hero_slide: boolean;
  is_featured: boolean;
  is_profile: boolean;
};

type BackendSong = {
  id: number;
  title: string;
  album: string;
  duration: number;
  cover: string;
  audio: string;
  artist: BackendArtist;
  genre: BackendGenre;
  playlist: BackendPlaylist;
  is_trending: boolean;
  is_new_release: boolean;
  is_top_chart: boolean;
  is_liked: boolean;
  is_recently_played: boolean;
  last_played_at: string | null;
};

// ========================
// HELPER FUNCTIONS
// ========================

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const transformArtist = (artist: BackendArtist): Artist => ({
  id: artist.id,
  name: artist.name,
  image: artist.image,
  followers: artist.followers ? `${artist.followers}M` : undefined,
  isFavorite: artist.is_favorite,
});

const transformGenre = (genre: BackendGenre): Genre => ({
  id: genre.id,
  name: genre.name,
  image: genre.image,
});

const transformPlaylistRef = (playlist: BackendPlaylist): PlaylistRef => ({
  id: playlist.id,
  name: playlist.name,
  description: playlist.description,
  image: playlist.image,
  isHeroSlide: playlist.is_hero_slide,
  isFeatured: playlist.is_featured,
  isProfile: playlist.is_profile,
});

const transformPlaylist = (
  playlist: BackendPlaylist,
  songCount: number = 0
): Playlist => ({
  id: playlist.id,
  name: playlist.name,
  description: playlist.description,
  image: playlist.image,
  songCount,
  isHeroSlide: playlist.is_hero_slide,
  isFeatured: playlist.is_featured,
  isProfile: playlist.is_profile,
});

const transformSong = (song: BackendSong): Song => ({
  id: song.id,
  title: song.title,
  artist: transformArtist(song.artist),
  album: song.album,
  duration: formatDuration(song.duration),
  cover: song.cover,
  audio: song.audio,
  playlist: transformPlaylistRef(song.playlist),
  genre: transformGenre(song.genre),
  isLiked: song.is_liked,
  isRecentlyPlayed: song.is_recently_played,
  isTrending: song.is_trending,
  isNewRelease: song.is_new_release,
  isTopChart: song.is_top_chart,
  lastPlayedAt: song.last_played_at,
});

// ========================
// LOCALSTORAGE HELPER
// ========================

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const STORAGE_KEYS = {
  SONGS: 'music_app_songs',
  ARTISTS: 'music_app_artists',
  GENRES: 'music_app_genres',
  PLAYLISTS: 'music_app_playlists',
  RECENTLY_PLAYED: 'music_app_recently_played',
};

// Helper to save data to localStorage
function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
}

// Helper to load data from localStorage
function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const entry: CacheEntry<T> = JSON.parse(item);
    return entry.data;
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return null;
  }
}

// Helper to clear specific cache
function clearLocalStorageKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing localStorage (${key}):`, error);
  }
}

// Clear all music app caches (call on logout)
export function clearAllMusicCaches(): void {
  Object.values(STORAGE_KEYS).forEach(key => clearLocalStorageKey(key));
}

// ========================
// CACHE / DEDUPE CONFIG
// ========================

type FetchOptions = {
  force?: boolean;
  signal?: AbortSignal;
};

const DEFAULT_TTL_MS = 60 * 1000; // 60s cache TTL

let songsCache: { ts: number; data: Song[] } | null = null;
let songsPromise: Promise<Song[]> | null = null;

let artistsCache: { ts: number; data: Artist[] } | null = null;
let artistsPromise: Promise<Artist[]> | null = null;

let genresCache: { ts: number; data: Genre[] } | null = null;
let genresPromise: Promise<Genre[]> | null = null;

let playlistsCache: { ts: number; data: Playlist[] } | null = null;
let playlistsPromise: Promise<Playlist[]> | null = null;

const isCacheValid = (cacheTimestamp: number, ttl = DEFAULT_TTL_MS) =>
  Date.now() - cacheTimestamp < ttl;

// ========================
// API CALLS (with localStorage + memory cache)
// ========================

export const fetchSongs = async (opts: FetchOptions = {}): Promise<Song[]> => {
  const { force = false, signal } = opts;

  // Check memory cache first
  if (!force && songsCache && isCacheValid(songsCache.ts)) {
    return songsCache.data;
  }

  // Check localStorage cache
  if (!force) {
    const cachedData = loadFromLocalStorage<Song[]>(STORAGE_KEYS.SONGS);
    if (cachedData && cachedData.length > 0) {
      // Populate memory cache
      songsCache = { ts: Date.now(), data: cachedData };
      return cachedData;
    }
  }

  // If already fetching, return the existing promise
  if (songsPromise && !force) {
    return songsPromise;
  }

  songsPromise = apiInstance
    .get<BackendSong[]>("songs/", { signal })
    .then((response) => {
      const mapped = response.data.map(transformSong);
      
      // Save to memory cache
      songsCache = { ts: Date.now(), data: mapped };
      
      // Save to localStorage
      saveToLocalStorage(STORAGE_KEYS.SONGS, mapped);
      
      songsPromise = null;
      return mapped;
    })
    .catch((err) => {
      songsPromise = null;
      if ((err as any)?.name === "CanceledError" || (err as any)?.name === "AbortError") {
        throw err;
      }
      console.error("Error fetching songs:", err);
      
      // Fallback to localStorage if API fails
      const cachedData = loadFromLocalStorage<Song[]>(STORAGE_KEYS.SONGS);
      return cachedData || [];
    });

  return songsPromise;
};

export const invalidateSongsCache = () => {
  songsCache = null;
  songsPromise = null;
  clearLocalStorageKey(STORAGE_KEYS.SONGS);
};

export const fetchArtists = async (opts: FetchOptions = {}): Promise<Artist[]> => {
  const { force = false, signal } = opts;

  if (!force && artistsCache && isCacheValid(artistsCache.ts)) {
    return artistsCache.data;
  }

  if (!force) {
    const cachedData = loadFromLocalStorage<Artist[]>(STORAGE_KEYS.ARTISTS);
    if (cachedData && cachedData.length > 0) {
      artistsCache = { ts: Date.now(), data: cachedData };
      return cachedData;
    }
  }

  if (artistsPromise && !force) {
    return artistsPromise;
  }

  artistsPromise = apiInstance
    .get<BackendArtist[]>("artists/", { signal })
    .then((response) => {
      const mapped = response.data.map(transformArtist);
      artistsCache = { ts: Date.now(), data: mapped };
      saveToLocalStorage(STORAGE_KEYS.ARTISTS, mapped);
      artistsPromise = null;
      return mapped;
    })
    .catch((err) => {
      artistsPromise = null;
      if ((err as any)?.name === "CanceledError" || (err as any)?.name === "AbortError") {
        throw err;
      }
      console.error("Error fetching artists:", err);
      const cachedData = loadFromLocalStorage<Artist[]>(STORAGE_KEYS.ARTISTS);
      return cachedData || [];
    });

  return artistsPromise;
};

export const invalidateArtistsCache = () => {
  artistsCache = null;
  artistsPromise = null;
  clearLocalStorageKey(STORAGE_KEYS.ARTISTS);
};

export const fetchGenres = async (opts: FetchOptions = {}): Promise<Genre[]> => {
  const { force = false, signal } = opts;

  if (!force && genresCache && isCacheValid(genresCache.ts)) {
    return genresCache.data;
  }

  if (!force) {
    const cachedData = loadFromLocalStorage<Genre[]>(STORAGE_KEYS.GENRES);
    if (cachedData && cachedData.length > 0) {
      genresCache = { ts: Date.now(), data: cachedData };
      return cachedData;
    }
  }

  if (genresPromise && !force) {
    return genresPromise;
  }

  genresPromise = apiInstance
    .get<BackendGenre[]>("genres/", { signal })
    .then((response) => {
      const mapped = response.data.map(transformGenre);
      genresCache = { ts: Date.now(), data: mapped };
      saveToLocalStorage(STORAGE_KEYS.GENRES, mapped);
      genresPromise = null;
      return mapped;
    })
    .catch((err) => {
      genresPromise = null;
      if ((err as any)?.name === "CanceledError" || (err as any)?.name === "AbortError") {
        throw err;
      }
      console.error("Error fetching genres:", err);
      const cachedData = loadFromLocalStorage<Genre[]>(STORAGE_KEYS.GENRES);
      return cachedData || [];
    });

  return genresPromise;
};

export const invalidateGenresCache = () => {
  genresCache = null;
  genresPromise = null;
  clearLocalStorageKey(STORAGE_KEYS.GENRES);
};

export const fetchPlaylists = async (opts: FetchOptions = {}): Promise<Playlist[]> => {
  const { force = false, signal } = opts;

  if (!force && playlistsCache && isCacheValid(playlistsCache.ts)) {
    return playlistsCache.data;
  }

  if (!force) {
    const cachedData = loadFromLocalStorage<Playlist[]>(STORAGE_KEYS.PLAYLISTS);
    if (cachedData && cachedData.length > 0) {
      playlistsCache = { ts: Date.now(), data: cachedData };
      return cachedData;
    }
  }

  if (playlistsPromise && !force) {
    return playlistsPromise;
  }

  playlistsPromise = apiInstance
    .get<BackendPlaylist[]>("playlists/", { signal })
    .then(async (response) => {
      const songs = await fetchSongs({ force: false, signal }).catch((e) => {
        if ((e as any)?.name === "CanceledError" || (e as any)?.name === "AbortError") {
          throw e;
        }
        return [] as Song[];
      });

      const mapped = response.data.map((playlist) => {
        const songCount = songs.filter((song) => song.playlist.id === playlist.id).length;
        return transformPlaylist(playlist, songCount);
      });

      playlistsCache = { ts: Date.now(), data: mapped };
      saveToLocalStorage(STORAGE_KEYS.PLAYLISTS, mapped);
      playlistsPromise = null;
      return mapped;
    })
    .catch((err) => {
      playlistsPromise = null;
      if ((err as any)?.name === "CanceledError" || (err as any)?.name === "AbortError") {
        throw err;
      }
      console.error("Error fetching playlists:", err);
      const cachedData = loadFromLocalStorage<Playlist[]>(STORAGE_KEYS.PLAYLISTS);
      return cachedData || [];
    });

  return playlistsPromise;
};

export const invalidatePlaylistsCache = () => {
  playlistsCache = null;
  playlistsPromise = null;
  clearLocalStorageKey(STORAGE_KEYS.PLAYLISTS);
};

// ========================
// FILTERED DATA FUNCTIONS
// ========================

export const getLikedSongs = async (opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.isLiked);
};

export const getRecentlyPlayed = async (
  opts: FetchOptions = {}
): Promise<Song[]> => {
  // Check localStorage first
  if (!opts.force) {
    const cachedData = loadFromLocalStorage<Song[]>(STORAGE_KEYS.RECENTLY_PLAYED);
    if (cachedData && cachedData.length > 0) {
      return cachedData;
    }
  }

  const response = await apiInstance.get<BackendSong[]>(
    "songs/recently-played/",
    { signal: opts.signal }
  );

  const mapped = response.data.map(transformSong);
  saveToLocalStorage(STORAGE_KEYS.RECENTLY_PLAYED, mapped);
  
  return mapped;
};

export const trackRecentlyPlayed = async (songId: number): Promise<boolean> => {
  try {
    await apiInstance.post(`songs/${songId}/play/`);
    invalidateSongsCache();
    clearLocalStorageKey(STORAGE_KEYS.RECENTLY_PLAYED);
    return true;
  } catch (error) {
    console.error("Error tracking recently played:", error);
    return false;
  }
};

export const getTrendingSongs = async (opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.isTrending);
};

export const getNewReleases = async (opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.isNewRelease);
};

export const getTopCharts = async (opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.isTopChart);
};

export const getFavoriteArtists = async (opts: FetchOptions = {}): Promise<Artist[]> => {
  const artists = await fetchArtists(opts);
  return artists.filter((artist) => artist.isFavorite);
};

export const getFavoriteArtistSongs = async (opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.artist.isFavorite);
};

export const getSongsByPlaylistId = async (playlistId: number, opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.playlist.id === playlistId);
};

export const getSongsByPlaylist = async (playlistName: string, opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.playlist.name.toLowerCase() === playlistName.toLowerCase());
};

export const getSongsByArtistId = async (artistId: number, opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.artist.id === artistId);
};

export const getSongsByArtist = async (artistName: string, opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.artist.name.toLowerCase() === artistName.toLowerCase());
};

export const getSongsByGenre = async (genreName: string, opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.genre.name.toLowerCase() === genreName.toLowerCase());
};

export const getSongsByGenreId = async (genreId: number, opts: FetchOptions = {}): Promise<Song[]> => {
  const songs = await fetchSongs(opts);
  return songs.filter((song) => song.genre.id === genreId);
};

// ========================
// STATIC NAV ITEMS
// ========================

export const navItems: NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Browse", href: "/browse" },
  { name: "Library", href: "/library" },
  { name: "Profile", href: "/profile" },
];

// ========================
// ACTIONS (UPDATE DATA)
// ========================

export const toggleSongLike = async (songId: number): Promise<boolean> => {
  try {
    await apiInstance.patch(`songs/${songId}/`, { is_liked: true });
    invalidateSongsCache();
    return true;
  } catch (error) {
    console.error("Error toggling song like:", error);
    return false;
  }
};

export const markAsRecentlyPlayed = async (songId: number): Promise<boolean> => {
  try {
    await apiInstance.patch(`songs/${songId}/`, { is_recently_played: true });
    invalidateSongsCache();
    return true;
  } catch (error) {
    console.error("Error marking song as recently played:", error);
    return false;
  }
};

export const toggleArtistFavorite = async (artistId: number): Promise<boolean> => {
  try {
    await apiInstance.patch(`artist/${artistId}/`, { is_favorite: true });
    invalidateArtistsCache();
    return true;
  } catch (error) {
    console.error("Error toggling artist favorite:", error);
    return false;
  }
};