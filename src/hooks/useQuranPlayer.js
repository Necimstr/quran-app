import { useState, useRef, useCallback, useEffect } from 'react';
import { getAyahAudioUrl } from '../services/apiService';
import {
  setMediaHandlers, setMediaMetadata, setMediaPlaybackState, setMediaPosition,
} from '../services/mediaSession';

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
    req.onsuccess = () => {
      window.dispatchEvent(new CustomEvent('quran:cache-updated', { detail: { key } }));
      resolve();
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function cacheKey(reciter, surahNumber, ayahNumber) {
  return `${reciter.id}:${surahNumber}:${ayahNumber}`;
}

export async function listCachedDetailed() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => {
      const map = {};
      for (const k of req.result) {
        if (typeof k !== 'string') continue;
        const parts = k.split(':');
        if (parts.length !== 3) continue;
        const [reciterId, surahStr, ayahStr] = parts;
        const surahNum = Number(surahStr);
        const ayahNum = Number(ayahStr);
        if (!Number.isFinite(surahNum) || !Number.isFinite(ayahNum)) continue;
        if (!map[reciterId]) map[reciterId] = {};
        if (!map[reciterId][surahNum]) map[reciterId][surahNum] = new Set();
        map[reciterId][surahNum].add(ayahNum);
      }
      resolve(map);
    };
    req.onerror = () => resolve({});
  });
}

export async function deleteCachedSurah(reciterId, surahNumber) {
  const db = await openDB();
  const prefix = `${reciterId}:${surahNumber}:`;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAllKeys();
    req.onsuccess = () => {
      let removed = 0;
      for (const k of req.result) {
        if (typeof k === 'string' && k.startsWith(prefix)) {
          store.delete(k);
          removed++;
        }
      }
      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent('quran:cache-updated', { detail: { deleted: prefix } }));
        resolve(removed);
      };
    };
    req.onerror = () => resolve(0);
  });
}

export async function deleteCachedReciter(reciterId) {
  const db = await openDB();
  const prefix = `${reciterId}:`;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAllKeys();
    req.onsuccess = () => {
      let removed = 0;
      for (const k of req.result) {
        if (typeof k === 'string' && k.startsWith(prefix)) {
          store.delete(k);
          removed++;
        }
      }
      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent('quran:cache-updated', { detail: { deleted: prefix } }));
        resolve(removed);
      };
    };
    req.onerror = () => resolve(0);
  });
}

export async function listCachedByReciter() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => {
      const map = {};
      for (const k of req.result) {
        if (typeof k !== 'string') continue;
        const [reciterId, surahStr] = k.split(':');
        if (!reciterId || !surahStr) continue;
        const surahNum = Number(surahStr);
        if (!Number.isFinite(surahNum)) continue;
        if (!map[reciterId]) map[reciterId] = new Set();
        map[reciterId].add(surahNum);
      }
      resolve(map);
    };
    req.onerror = () => resolve({});
  });
}

export async function listCachedVerses(reciter, surahNumber) {
  if (!reciter || !surahNumber) return new Set();
  const db = await openDB();
  const prefix = `${reciter.id}:${surahNumber}:`;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => {
      const set = new Set();
      for (const k of req.result) {
        if (typeof k === 'string' && k.startsWith(prefix)) {
          const n = Number(k.slice(prefix.length));
          if (Number.isFinite(n)) set.add(n);
        }
      }
      resolve(set);
    };
    req.onerror = () => resolve(new Set());
  });
}

export function useQuranPlayer({ reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(startVerse);
  const [verseCount, setVerseCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [speed, setSpeedState] = useState(1);
  const [volume, setVolumeState] = useState(1);

  // Single persistent audio element for the whole app (also drives the lock screen)
  const audioRef = useRef(null);
  if (audioRef.current === null) {
    audioRef.current = new Audio();
  }
  const stateRef = useRef({});
  const speedRef = useRef(1);
  const playingRef = useRef(false); // a sequence is active (playing or paused)
  const pausedRef = useRef(false); // user/system asked to pause mid-sequence
  const transitionRef = useRef(false); // our own src swap/skip — ignore its 'pause' event
  const stopRequestedRef = useRef(false);
  const runIdRef = useRef(0);
  const resolveCurrentPlayRef = useRef(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    stateRef.current = { reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat };
  }, [reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat]);

  const setActive = useCallback((active) => {
    playingRef.current = active;
    setIsActive(active);
  }, []);

  // Swaps the element source and revokes the previous blob URL
  const swapSrc = useCallback((audio, src) => {
    const prev = objectUrlRef.current;
    objectUrlRef.current = src && src.startsWith('blob:') ? src : null;
    if (src) {
      audio.src = src;
    } else {
      audio.removeAttribute('src');
      audio.load();
    }
    if (prev && prev !== src) URL.revokeObjectURL(prev);
  }, []);

  // Playing/paused state comes from the element itself, so OS-initiated pauses
  // (calls, headset unplugged, lock-screen controls) stay in sync with the UI.
  useEffect(() => {
    const audio = audioRef.current;
    audio.preload = 'auto';
    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onDuration = () => {
      setDuration(audio.duration);
      setMediaPosition(audio);
    };
    const onPosition = () => setMediaPosition(audio);
    const onPlay = () => {
      setIsPlaying(true);
      setMediaPlaybackState('playing');
    };
    const onPause = () => {
      if (audio.ended || transitionRef.current || !playingRef.current) return;
      setIsPlaying(false);
      setMediaPlaybackState('paused');
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onDuration);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('ratechange', onPosition);
    audio.addEventListener('seeked', onPosition);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onDuration);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('ratechange', onPosition);
      audio.removeEventListener('seeked', onPosition);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const stop = useCallback(() => {
    stopRequestedRef.current = true;
    pausedRef.current = false;
    transitionRef.current = false;
    const audio = audioRef.current;
    audio.pause();
    swapSrc(audio, '');
    resolveCurrentPlayRef.current?.({ type: 'stop' });
    setActive(false);
    setIsPlaying(false);
    setMediaPlaybackState('none');
    setCurrentVerse(stateRef.current.startVerse);
    setProgress(0);
    setDuration(0);
    setVerseCount(0);
    setGroupCount(0);
    setLoading(false);
    setError(null);
  }, [swapSrc, setActive]);

  // Stop and reset when reciter or surah changes
  useEffect(() => {
    stop();
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
      const audio = audioRef.current;
      const finish = (result) => {
        audio.removeEventListener('ended', onEnd);
        audio.removeEventListener('error', onErr);
        if (resolveCurrentPlayRef.current === finish) resolveCurrentPlayRef.current = null;
        resolve(result);
      };
      const onEnd = () => finish({ type: 'ended' });
      const onErr = () => finish({ type: 'error' });
      audio.addEventListener('ended', onEnd);
      audio.addEventListener('error', onErr);
      resolveCurrentPlayRef.current = finish;
    });
  }, []);

  const loadAudio = useCallback(async (reciter, surahNum, verseNum) => {
    const key = await cacheKey(reciter, surahNum, verseNum);
    const cached = await getCachedAudio(key);
    if (cached) return { src: URL.createObjectURL(cached), cached: true };
    if (!navigator.onLine) return { src: null, cached: false, offlineMiss: true };
    return { src: getAyahAudioUrl(reciter, surahNum, verseNum), cached: false };
  }, []);

  const preloadVerse = useCallback(async (reciter, surahNum, verseNum) => {
    if (!navigator.onLine) return;
    try {
      const key = await cacheKey(reciter, surahNum, verseNum);
      const existing = await getCachedAudio(key);
      if (existing) return;
      const url = getAyahAudioUrl(reciter, surahNum, verseNum);
      const res = await fetch(url);
      if (res.ok) await setCachedAudio(key, await res.blob());
    } catch { /* best-effort prefetch */ }
  }, []);

  const playSequence = useCallback(async () => {
    const { reciter, surah } = stateRef.current;
    if (!reciter || !surah) return;

    const runId = ++runIdRef.current;
    const cancelled = () => stopRequestedRef.current || runIdRef.current !== runId;

    stopRequestedRef.current = false;
    pausedRef.current = false;
    transitionRef.current = false;
    setActive(true);
    setError(null);

    let gCount = 0;
    let consecutiveFailures = 0;

    // Returns true when the sequence must stop, false to skip to the next verse
    const handleFailure = (v) => {
      if (!navigator.onLine) {
        setError(`فقدان الاتصال — توقف التشغيل عند الآية ${v}`);
        return true;
      }
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        setError('تعذّر تحميل التلاوة — تحقق من الاتصال ثم أعد المحاولة');
        return true;
      }
      setError(`تعذّر تحميل الآية ${v} — تم تخطيها`);
      return false;
    };

    try {
      outer: while (true) {
        const { groupRepeat } = stateRef.current;
        const infinite = groupRepeat === 0;
        if (!infinite && gCount >= groupRepeat) break;

        setGroupCount(gCount);
        let v = stateRef.current.startVerse;

        while (v <= stateRef.current.endVerse) {
          if (cancelled()) break outer;
          setCurrentVerse(v);

          let nextV = v + 1;
          let loaded = false; // the element already holds verse v
          const { verseRepeat } = stateRef.current;

          for (let r = 0; r < verseRepeat; r++) {
            if (cancelled()) break outer;
            setVerseCount(r);
            if (!loaded) setLoading(true);
            const audio = audioRef.current;
            transitionRef.current = true;

            try {
              if (loaded) {
                // Repeating the same verse: rewind instead of swapping src
                audio.currentTime = 0;
              } else {
                const result = await loadAudio(reciter, surah.number, v);
                if (cancelled()) {
                  if (result.src?.startsWith('blob:')) URL.revokeObjectURL(result.src);
                  break outer;
                }
                if (result.offlineMiss) {
                  setError(`الآية ${v} غير محفوظة — توقف التشغيل (لا يوجد اتصال بالإنترنت)`);
                  break outer;
                }
                swapSrc(audio, result.src);
                loaded = true;
              }
              audio.playbackRate = speedRef.current;
              // Paused while loading: keep the verse ready, resume() will start it
              if (!pausedRef.current) await audio.play();
              consecutiveFailures = 0;
            } catch (err) {
              if (cancelled()) break outer;
              if (err?.name === 'NotAllowedError') {
                // Browser/OS refused to start playback (e.g. iOS in background).
                // Hold position; resume() — in-app or from the lock screen — continues.
                pausedRef.current = true;
                setIsPlaying(false);
                setMediaPlaybackState('paused');
                setError('أوقف النظام التشغيل مؤقتًا — اضغط تشغيل للمتابعة');
              } else if (!(err?.name === 'AbortError' && pausedRef.current)) {
                if (handleFailure(v)) break outer;
                nextV = v + 1;
                break;
              }
            } finally {
              transitionRef.current = false;
              setLoading(false);
            }

            // Preload next verse in background
            if (r === 0 && v < stateRef.current.endVerse) preloadVerse(reciter, surah.number, v + 1);

            const result = await makeDoPlay();
            if (result.type === 'stop' || cancelled()) break outer;
            if (result.type === 'skip-next') { nextV = Math.min(v + 1, stateRef.current.endVerse); break; }
            if (result.type === 'skip-prev') { nextV = Math.max(stateRef.current.startVerse, v - 1); break; }
            if (result.type === 'error') {
              if (handleFailure(v)) break outer;
              nextV = v + 1;
              break;
            }
            // 'ended' — loop continues for next repeat
          }

          if (cancelled()) break outer;
          v = nextV;
        }

        gCount++;
        if (!infinite && gCount >= groupRepeat) break;
      }
    } catch { /* sequence aborted */ }

    // A newer sequence (or stop()) already owns the state
    if (runIdRef.current !== runId) return;
    stopRequestedRef.current = true;
    pausedRef.current = false;
    transitionRef.current = false;
    setActive(false);
    setIsPlaying(false);
    setMediaPlaybackState('none');
    setLoading(false);
    setProgress(0);
    setDuration(0);
    setVerseCount(0);
    setGroupCount(0);
  }, [loadAudio, makeDoPlay, preloadVerse, swapSrc, setActive]);

  const play = useCallback(() => {
    if (!playingRef.current) playSequence();
  }, [playSequence]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    transitionRef.current = false;
    audioRef.current.pause();
    setIsPlaying(false);
    setMediaPlaybackState('paused');
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setError(null);
    audioRef.current.play().catch(() => {});
  }, []);

  const skipNext = useCallback(() => {
    if (!resolveCurrentPlayRef.current) return;
    pausedRef.current = false;
    transitionRef.current = true;
    audioRef.current.pause();
    resolveCurrentPlayRef.current({ type: 'skip-next' });
  }, []);

  const skipPrev = useCallback(() => {
    if (!resolveCurrentPlayRef.current) return;
    pausedRef.current = false;
    transitionRef.current = true;
    audioRef.current.pause();
    resolveCurrentPlayRef.current({ type: 'skip-prev' });
  }, []);

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  }, []);

  const seekBy = useCallback((delta) => {
    const audio = audioRef.current;
    if (!Number.isFinite(audio.duration)) return;
    seek(Math.min(Math.max(0, audio.currentTime + delta), audio.duration));
  }, [seek]);

  // Lock-screen / headset controls always call the latest commands
  const commandsRef = useRef({});
  useEffect(() => {
    commandsRef.current = { play, pause, resume, stop, skipNext, skipPrev, seek, seekBy };
  });

  useEffect(() => setMediaHandlers({
    play: () => (playingRef.current ? commandsRef.current.resume() : commandsRef.current.play()),
    pause: () => commandsRef.current.pause(),
    stop: () => commandsRef.current.stop(),
    previoustrack: () => commandsRef.current.skipPrev(),
    nexttrack: () => commandsRef.current.skipNext(),
    seekbackward: (d) => commandsRef.current.seekBy(-(d.seekOffset ?? 10)),
    seekforward: (d) => commandsRef.current.seekBy(d.seekOffset ?? 10),
    seekto: (d) => { if (Number.isFinite(d.seekTime)) commandsRef.current.seek(d.seekTime); },
  }), []);

  useEffect(() => {
    setMediaMetadata(isActive && surah && reciter
      ? { surahName: surah.name, reciterName: reciter.name, verse: currentVerse }
      : null);
  }, [isActive, surah, reciter, currentVerse]);

  return {
    isPlaying, isActive, currentVerse, verseCount, groupCount,
    progress, duration, loading, error,
    speed, volume,
    play, pause, resume, stop,
    skipNext, skipPrev, seek,
    setSpeed, setVolume,
  };
}

export { getCachedAudio, setCachedAudio };
