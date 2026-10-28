import { useState, useRef, useCallback, useEffect } from 'react';
import { getAyahAudioUrl } from '../services/apiService';

const DB_NAME = 'QuranAudioCache';
const DB_VERSION = 1;
const STORE_NAME = 'audio';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getCachedAudio(key) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

async function setCachedAudio(key, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(blob, key);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function cacheKey(reciter, surahNumber, ayahNumber) {
  return `${reciter.id}:${surahNumber}:${ayahNumber}`;
}

export function useQuranPlayer({ reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(startVerse);
  const [verseCount, setVerseCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [speed, setSpeedState] = useState(1);
  const [volume, setVolumeState] = useState(1);

  const audioRef = useRef(new Audio());
  const stateRef = useRef({});
  const speedRef = useRef(1);
  const playingRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const resolveCurrentPlayRef = useRef(null);

  useEffect(() => {
    stateRef.current = { reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat };
  }, [reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat]);

  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onDuration);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onDuration);
    };
  }, []);

  // Stop and reset when reciter or surah changes
  useEffect(() => {
    stopRequestedRef.current = true;
    const audio = audioRef.current;
    audio.pause();
    audio.src = '';
    if (resolveCurrentPlayRef.current) {
      resolveCurrentPlayRef.current({ type: 'stop' });
      resolveCurrentPlayRef.current = null;
    }
    playingRef.current = false;
    setIsPlaying(false);
    setCurrentVerse(startVerse);
    setProgress(0);
    setDuration(0);
    setVerseCount(0);
    setGroupCount(0);
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciter?.id, surah?.number]);

  const setSpeed = useCallback((s) => {
    speedRef.current = s;
    audioRef.current.playbackRate = s;
    setSpeedState(s);
  }, []);

  const setVolume = useCallback((v) => {
    audioRef.current.volume = v;
    setVolumeState(v);
  }, []);

  // Returns a promise that resolves when audio ends, errors, or is interrupted
  const makeDoPlay = useCallback(() => {
    return new Promise((resolve) => {
      resolveCurrentPlayRef.current = resolve;
      const audio = audioRef.current;
      const cleanup = () => {
        audio.removeEventListener('ended', onEnd);
        audio.removeEventListener('error', onErr);
        resolveCurrentPlayRef.current = null;
      };
      const onEnd = () => { cleanup(); resolve({ type: 'ended' }); };
      const onErr = () => { cleanup(); resolve({ type: 'error' }); };
      audio.addEventListener('ended', onEnd);
      audio.addEventListener('error', onErr);
    });
  }, []);

  const loadAudio = useCallback(async (reciter, surahNum, verseNum) => {
    const key = await cacheKey(reciter, surahNum, verseNum);
    const cached = await getCachedAudio(key);
    if (cached) return URL.createObjectURL(cached);
    return getAyahAudioUrl(reciter, surahNum, verseNum);
  }, []);

  const preloadVerse = useCallback(async (reciter, surahNum, verseNum) => {
    try {
      const key = await cacheKey(reciter, surahNum, verseNum);
      const existing = await getCachedAudio(key);
      if (existing) return;
      const url = getAyahAudioUrl(reciter, surahNum, verseNum);
      const res = await fetch(url);
      if (res.ok) await setCachedAudio(key, await res.blob());
    } catch {}
  }, []);

  const playSequence = useCallback(async () => {
    const { reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat } = stateRef.current;
    if (!reciter || !surah) return;

    stopRequestedRef.current = false;
    playingRef.current = true;
    setIsPlaying(true);

    const infinite = groupRepeat === 0;
    let gCount = 0;

    try {
      outer: while (infinite || gCount < groupRepeat) {
        setGroupCount(gCount);
        let v = startVerse;

        while (v <= endVerse) {
          if (stopRequestedRef.current) break outer;
          setCurrentVerse(v);

          let nextV = v + 1;

          for (let r = 0; r < verseRepeat; r++) {
            if (stopRequestedRef.current) break outer;
            setVerseCount(r);
            setLoading(true);
            setError(null);

            try {
              const src = await loadAudio(reciter, surah.number, v);
              const audio = audioRef.current;
              audio.src = src;
              audio.playbackRate = speedRef.current;
              await audio.play();
              setLoading(false);
            } catch {
              setLoading(false);
              nextV = v + 1; // skip broken verse
              break;
            }

            // Preload next verse in background
            if (v < endVerse) preloadVerse(reciter, surah.number, v + 1);

            const result = await makeDoPlay();
            if (result.type === 'stop') break outer;
            if (result.type === 'skip-next') { nextV = Math.min(v + 1, endVerse); break; }
            if (result.type === 'skip-prev') { nextV = Math.max(startVerse, v - 1); break; }
            if (result.type === 'error') { nextV = v + 1; break; }
            // 'ended' — loop continues for next repeat
          }

          if (stopRequestedRef.current) break outer;
          v = nextV;
        }

        gCount++;
        if (!infinite && gCount >= groupRepeat) break;
      }
    } catch {}

    playingRef.current = false;
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setVerseCount(0);
    setGroupCount(0);
  }, [loadAudio, makeDoPlay, preloadVerse]);

  const play = useCallback(() => {
    if (!playingRef.current) playSequence();
  }, [playSequence]);

  const pause = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  }, []);

  const stop = useCallback(() => {
    stopRequestedRef.current = true;
    audioRef.current.pause();
    audioRef.current.src = '';
    if (resolveCurrentPlayRef.current) {
      resolveCurrentPlayRef.current({ type: 'stop' });
      resolveCurrentPlayRef.current = null;
    }
    playingRef.current = false;
    setIsPlaying(false);
    setCurrentVerse(startVerse);
    setProgress(0);
    setDuration(0);
    setVerseCount(0);
    setGroupCount(0);
    setError(null);
  }, [startVerse]);

  const skipNext = useCallback(() => {
    audioRef.current.pause();
    if (resolveCurrentPlayRef.current) {
      resolveCurrentPlayRef.current({ type: 'skip-next' });
    }
  }, []);

  const skipPrev = useCallback(() => {
    audioRef.current.pause();
    if (resolveCurrentPlayRef.current) {
      resolveCurrentPlayRef.current({ type: 'skip-prev' });
    }
  }, []);

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  }, []);

  return {
    isPlaying, currentVerse, verseCount, groupCount,
    progress, duration, loading, error,
    speed, volume,
    play, pause, resume, stop,
    skipNext, skipPrev, seek,
    setSpeed, setVolume,
  };
}

export { getCachedAudio, setCachedAudio };
