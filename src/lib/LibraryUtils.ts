// src/utils/LibraryUtils.ts

import type { Song, Artist } from "../Data";

export interface LibraryCache {
  timestamp: number;
  likedSongs: Song[];
  favoriteArtists: Artist[];
  recentlyPlayed: Song[];
}

const LIBRARY_CACHE_KEY = 'music_library_data';
const LIBRARY_CACHE_TTL = 5 * 60 * 1000;

/**
 * Save library data to localStorage
 */
export const saveLibraryCache = (data: Omit<LibraryCache, 'timestamp'>): void => {
  try {
    const cache: LibraryCache = { 
      ...data, 
      timestamp: Date.now() 
    };
    localStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to save library cache:', error);
  }
};

/**
 * Load library data from localStorage
 * Returns null if cache doesn't exist or has expired
 */
export const loadLibraryCache = (): LibraryCache | null => {
  try {
    const cached = localStorage.getItem(LIBRARY_CACHE_KEY);
    if (!cached) return null;
    
    const data: LibraryCache = JSON.parse(cached);
    
    // Check if cache is still valid
    if (Date.now() - data.timestamp > LIBRARY_CACHE_TTL) {
      localStorage.removeItem(LIBRARY_CACHE_KEY);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to load library cache:', error);
    return null;
  }
};

/**
 * Clear library cache from localStorage
 */
export const clearLibraryCache = (): void => {
  try {
    localStorage.removeItem(LIBRARY_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear library cache:', error);
  }
};