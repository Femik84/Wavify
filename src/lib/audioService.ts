// src/lib/audioService.ts
import { useEffect, useState } from "react";
import type { Song } from "../Data";

type RepeatMode = "off" | "all" | "one";
type Subscriber = () => void;

class AudioService {
  audio: HTMLAudioElement;
  playlist: Song[] = [];
  currentIndex = 0;
  isPlaying = false;
  shuffle = false;
  repeat: RepeatMode = "off";
  volume = 0.75;
  subs = new Set<Subscriber>();

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "metadata";
    this.audio.crossOrigin = "anonymous";
    this.audio.volume = this.volume;

    this.audio.addEventListener("loadedmetadata", () => this.notify());
    this.audio.addEventListener("timeupdate", () => this.notify());
    this.audio.addEventListener("ended", () => {
      if (this.repeat === "one") {
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        this.next();
      }
      this.notify();
    });
    this.audio.addEventListener("play", () => {
      this.isPlaying = true;
      this.notify();
    });
    this.audio.addEventListener("pause", () => {
      this.isPlaying = false;
      this.notify();
    });
  }

  notify() {
    for (const s of this.subs) s();
  }

  // Return type explicitly void for the unsubscribe function
  subscribe(s: Subscriber): () => void {
    this.subs.add(s);
    // Important: don't return the boolean result of Set.delete; return a void function
    return () => {
      this.subs.delete(s);
    };
  }

  setPlaylist(list: Song[], startIndex = 0) {
    this.playlist = [...list];
    this.currentIndex = Math.min(Math.max(0, startIndex), this.playlist.length - 1);
    this.loadCurrent(false);
    this.notify();
  }

  loadCurrent(autoplay = false) {
    const track = this.playlist[this.currentIndex];
    if (!track) return;
    this.audio.src = track.audio;
    this.audio.currentTime = 0;
    this.audio.load();
    if (autoplay) {
      this.play().catch(() => {
        this.isPlaying = false;
        this.notify();
      });
    }
  }

  play() {
    this.isPlaying = true;
    this.notify();
    return this.audio.play();
  }

  pause() {
    this.isPlaying = false;
    this.audio.pause();
    this.notify();
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play().catch(() => {
      this.isPlaying = false;
      this.notify();
    });
  }

  next() {
    if (this.shuffle) {
      if (this.playlist.length <= 1) return;
      let idx = this.currentIndex;
      while (idx === this.currentIndex) {
        idx = Math.floor(Math.random() * this.playlist.length);
      }
      this.currentIndex = idx;
    } else {
      const next = this.currentIndex + 1;
      if (next >= this.playlist.length) {
        if (this.repeat === "all") this.currentIndex = 0;
        else return;
      } else this.currentIndex = next;
    }
    this.loadCurrent(true);
    this.notify();
  }

  prev() {
    if (this.shuffle) {
      if (this.playlist.length <= 1) return;
      let idx = this.currentIndex;
      while (idx === this.currentIndex) {
        idx = Math.floor(Math.random() * this.playlist.length);
      }
      this.currentIndex = idx;
    } else {
      const prevIdx = this.currentIndex - 1;
      if (prevIdx < 0) {
        if (this.repeat === "all") this.currentIndex = this.playlist.length - 1;
        else this.currentIndex = 0;
      } else this.currentIndex = prevIdx;
    }
    this.loadCurrent(true);
    this.notify();
  }

  seekTo(percent: number) {
    if (!this.audio.duration) return;
    const t = Math.max(0, Math.min(1, percent)) * this.audio.duration;
    this.audio.currentTime = t;
    this.notify();
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.audio.volume = this.volume;
    this.notify();
  }

  toggleShuffle() {
    this.shuffle = !this.shuffle;
    this.notify();
  }

  cycleRepeat() {
    this.repeat = this.repeat === "off" ? "all" : this.repeat === "all" ? "one" : "off";
    this.notify();
  }

  playTrackAtIndex(index: number) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentIndex = index;
    this.loadCurrent(true);
    this.notify();
  }

  getState() {
    return {
      playlist: this.playlist,
      currentIndex: this.currentIndex,
      isPlaying: this.isPlaying,
      shuffle: this.shuffle,
      repeat: this.repeat,
      volume: this.volume,
      currentTime: this.audio.currentTime || 0,
      duration: this.audio.duration || 0,
    };
  }
}

export const audioService = new AudioService();

export function useAudio() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = audioService.subscribe(() => setTick((t) => t + 1));
    // unsub now has type () => void, suitable as an Effect cleanup
    return unsub;
  }, []);

  const state = audioService.getState();

  return {
    state,
    play: () => audioService.play(),
    pause: () => audioService.pause(),
    togglePlay: () => audioService.togglePlay(),
    next: () => audioService.next(),
    prev: () => audioService.prev(),
    seekTo: (p: number) => audioService.seekTo(p),
    setVolume: (v: number) => audioService.setVolume(v),
    setPlaylist: (list: Song[], idx = 0) => audioService.setPlaylist(list, idx),
    toggleShuffle: () => audioService.toggleShuffle(),
    cycleRepeat: () => audioService.cycleRepeat(),
    playTrackAtIndex: (i: number) => audioService.playTrackAtIndex(i),
  };
}