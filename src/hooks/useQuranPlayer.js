import { useState, useRef, useCallback, useEffect } from 'react';
import { getAyahAudioUrl } from '../services/apiService';

const DB_NAME = 'QuranAudioCache';
const DB_VERSION = 1;
const STORE_NAME = 'audio';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
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

  const audioRef = useRef(new Audio());
  const stateRef = useRef({});
  const playingRef = useRef(false);
  const stopRequestedRef = useRef(false);

  // Keep stateRef in sync for use inside async callbacks
  useEffect(() => {
    stateRef.current = { reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat };
  }, [reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat]);

  // Stop and reset when reciter or surah changes
  useEffect(() => {
    stopRequestedRef.current = true;
    audioRef.current.pause();
    audioRef.current.src = '';
    playingRef.current = false;
    setIsPlaying(false);
    setCurrentVerse(startVerse);
    setProgress(0);
    setDuration(0);
    setVerseCount(0);
    setGroupCount(0);
    setError(null);
  }, [reciter?.id, surah?.number]);

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

  const loadAndPlay = useCallback(async (reciter, surahNum, verseNum) => {
    const audio = audioRef.current;
    setLoading(true);
    setError(null);
    try {
      const key = await cacheKey(reciter, surahNum, verseNum);
      let src;
      const cached = await getCachedAudio(key);
      if (cached) {
        src = URL.createObjectURL(cached);
      } else {
        src = getAyahAudioUrl(reciter, surahNum, verseNum);
      }
      audio.src = src;
      await audio.play();
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setError('تعذّر تحميل الصوت. تحقق من اتصالك بالإنترنت.');
    }
  }, []);

  const playSequence = useCallback(async () => {
    const { reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat } = stateRef.current;
    if (!reciter || !surah) return;

    stopRequestedRef.current = false;
    playingRef.current = true;
    setIsPlaying(true);

    const infinite = groupRepeat === 0;
    let gCount = 0;

    const doPlay = () => new Promise((resolve, reject) => {
      const audio = audioRef.current;
      const onEnd = () => { audio.removeEventListener('ended', onEnd); resolve(); };
      const onError = () => { audio.removeEventListener('error', onError); reject(new Error('Audio error')); };
      audio.addEventListener('ended', onEnd);
      audio.addEventListener('error', onError);
    });

    try {
      outer: while (infinite || gCount < groupRepeat) {
        setGroupCount(gCount);
        for (let v = startVerse; v <= endVerse; v++) {
          if (stopRequestedRef.current) break outer;
          setCurrentVerse(v);
          for (let r = 0; r < verseRepeat; r++) {
            if (stopRequestedRef.current) break outer;
            setVerseCount(r);
            await loadAndPlay(reciter, surah.number, v);
            await doPlay();
          }
        }
        gCount++;
        if (!infinite && gCount >= groupRepeat) break;
      }
    } catch (e) {
      if (!stopRequestedRef.current) setError('Playback error occurred.');
    }

    playingRef.current = false;
    setIsPlaying(false);
    setProgress(0);
    setVerseCount(0);
    setGroupCount(0);
  }, [loadAndPlay]);

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
    playingRef.current = false;
    setIsPlaying(false);
    setCurrentVerse(startVerse);
    setProgress(0);
    setVerseCount(0);
    setGroupCount(0);
  }, [startVerse]);

  const seek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  }, []);

  return {
    isPlaying,
    currentVerse,
    verseCount,
    groupCount,
    progress,
    duration,
    loading,
    error,
    play,
    pause,
    resume,
    stop,
    seek,
    getCachedAudio,
    setCachedAudio,
  };
}

export { getCachedAudio, setCachedAudio };
