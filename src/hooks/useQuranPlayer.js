import { useState, useRef, useCallback, useEffect } from 'react';
import { getAyahAudioUrl } from '../services/apiService';
import { buildProgram, nextStart, ProgramError } from '../services/recitationProgram';
import { parseMp3 } from '../services/mp3';
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

// silent: skip the per-ayah change event (the player sends one after a whole batch)
async function setCachedAudio(key, blob, { silent = false } = {}) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(blob, key);
    req.onsuccess = () => {
      if (!silent) window.dispatchEvent(new CustomEvent('quran:cache-updated', { detail: { key } }));
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
  const [preparing, setPreparing] = useState(null); // { done, total } while building a program
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
  const playingRef = useRef(false); // a session is active (playing, paused or preparing)
  const pausedRef = useRef(false); // the user paused; don't auto-start a freshly built program
  const transitionRef = useRef(false); // our own src swap — ignore its 'pause' event
  const runIdRef = useRef(0); // bumps on every build/stop; stale builds check it and bail
  const programRef = useRef(null); // { url, segments, duration, pass, loopsPass }
  const posRef = useRef({ seg: 0, lastT: 0, pass: 0 });
  const parsedRef = useRef(new Map()); // verse audio parsed this session, for quick rebuilds
  const newlyCachedRef = useRef(false);

  useEffect(() => {
    stateRef.current = { reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat };
  }, [reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat]);

  const setActive = useCallback((active) => {
    playingRef.current = active;
    setIsActive(active);
  }, []);

  // Swaps the element source and revokes the previous program's blob URL
  const swapSrc = useCallback((audio, src) => {
    const prev = programRef.current?.url;
    if (src) {
      audio.src = src;
    } else {
      audio.removeAttribute('src');
      audio.load();
    }
    if (prev && prev !== src) URL.revokeObjectURL(prev);
  }, []);

  const updateLoop = useCallback(() => {
    const program = programRef.current;
    const { groupRepeat } = stateRef.current;
    audioRef.current.loop = !!program?.loopsPass &&
      (groupRepeat === 0 || posRef.current.pass < groupRepeat - 1);
  }, []);

  const applySegment = useCallback((idx) => {
    const program = programRef.current;
    const seg = program.segments[idx];
    posRef.current.seg = idx;
    setCurrentVerse(seg.verse);
    setVerseCount(seg.rep);
    setDuration(seg.end - seg.start);
    setMediaPosition(audioRef.current, program.duration);
  }, []);

  // Fully ends the session; `message` is shown to the user when set
  const reset = useCallback((message = null) => {
    runIdRef.current++;
    pausedRef.current = false;
    transitionRef.current = false;
    const audio = audioRef.current;
    audio.pause();
    audio.loop = false;
    swapSrc(audio, '');
    programRef.current = null;
    parsedRef.current = new Map();
    setActive(false);
    setIsPlaying(false);
    setMediaPlaybackState('none');
    setCurrentVerse(stateRef.current.startVerse);
    setProgress(0);
    setDuration(0);
    setVerseCount(0);
    setGroupCount(0);
    setLoading(false);
    setPreparing(null);
    setError(message);
  }, [swapSrc, setActive]);

  const stop = useCallback(() => reset(), [reset]);

  // Stop and reset when reciter or surah changes
  useEffect(() => {
    stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciter?.id, surah?.number]);

  const setSpeed = useCallback((s) => {
    speedRef.current = s;
    audioRef.current.defaultPlaybackRate = s;
    audioRef.current.playbackRate = s;
    setSpeedState(s);
  }, []);

  const setVolume = useCallback((v) => {
    audioRef.current.volume = v;
    setVolumeState(v);
  }, []);

  // Fetches (or reads from the device) and parses one ayah, memoised for the session
  const getVerse = useCallback((reciter, surahNum, verseNum) => {
    const key = `${reciter.id}:${surahNum}:${verseNum}`;
    const memo = parsedRef.current.get(key);
    if (memo) return memo;
    const load = (async () => {
      let blob = await getCachedAudio(key);
      if (!blob) {
        if (!navigator.onLine) {
          throw new ProgramError(`الآية ${verseNum} غير محفوظة — لا يوجد اتصال بالإنترنت`);
        }
        let res;
        try {
          res = await fetch(getAyahAudioUrl(reciter, surahNum, verseNum));
        } catch {
          throw new ProgramError(`تعذّر تحميل الآية ${verseNum} — تحقق من الاتصال ثم أعد المحاولة`);
        }
        if (!res.ok) throw new ProgramError(`تعذّر تحميل الآية ${verseNum} — حاول مرة أخرى`);
        blob = await res.blob();
        setCachedAudio(key, blob, { silent: true }).then(() => { newlyCachedRef.current = true; }, () => {});
      }
      const parsed = parseMp3(await blob.arrayBuffer());
      if (!parsed) throw new ProgramError(`تعذّر قراءة ملف الآية ${verseNum}`);
      return parsed;
    })();
    parsedRef.current.set(key, load);
    load.catch(() => parsedRef.current.delete(key));
    return load;
  }, []);

  const startProgram = useCallback(async (program, autoplay) => {
    const audio = audioRef.current;
    transitionRef.current = true;
    swapSrc(audio, program.url);
    programRef.current = program;
    posRef.current = { seg: 0, lastT: 0, pass: program.pass };
    audio.defaultPlaybackRate = speedRef.current;
    audio.playbackRate = speedRef.current;
    updateLoop();
    applySegment(0);
    setGroupCount(program.pass);
    setProgress(0);
    setPreparing(null);
    setLoading(false);
    if (!autoplay || pausedRef.current) {
      transitionRef.current = false;
      setIsPlaying(false);
      setMediaPlaybackState('paused');
      return;
    }
    try {
      await audio.play();
    } catch (err) {
      if (err?.name === 'NotAllowedError') {
        // The system refused to start audio without a tap. The program is ready, so one tap resumes.
        pausedRef.current = true;
        setIsPlaying(false);
        setMediaPlaybackState('paused');
        setError('التلاوة جاهزة — اضغط «متابعة» للاستماع');
      }
    } finally {
      transitionRef.current = false;
    }
  }, [swapSrc, updateLoop, applySegment]);

  // Builds the program that starts at `from` and plays it
  const continueAt = useCallback(async (from, autoplay) => {
    const { reciter, surah, startVerse, endVerse, verseRepeat } = stateRef.current;
    if (!reciter || !surah) return;
    const runId = ++runIdRef.current;
    const cancelled = () => runIdRef.current !== runId;
    setLoading(true);
    newlyCachedRef.current = false;
    try {
      const program = await buildProgram({
        from,
        plan: { start: startVerse, end: endVerse, verseRepeat },
        getVerse: (v) => getVerse(reciter, surah.number, v),
        onProgress: (done, total) => { if (!cancelled()) setPreparing({ done, total }); },
        isCancelled: cancelled,
      });
      if (!program) return;
      if (cancelled()) { URL.revokeObjectURL(program.url); return; }
      await startProgram(program, autoplay);
    } catch (err) {
      if (cancelled()) return;
      reset(err instanceof ProgramError ? err.message : 'تعذّر تجهيز التلاوة — حاول مرة أخرى');
    } finally {
      if (newlyCachedRef.current) {
        newlyCachedRef.current = false;
        window.dispatchEvent(new CustomEvent('quran:cache-updated'));
      }
    }
  }, [getVerse, startProgram, reset]);

  // Playback state, ayah tracking and pass counting all come from the element itself
  useEffect(() => {
    const audio = audioRef.current;
    audio.preload = 'auto';
    const onTimeUpdate = () => {
      const program = programRef.current;
      if (!program) return;
      const t = audio.currentTime;
      const pos = posRef.current;
      let idx = pos.seg;
      let wrapped = false;
      if (program.loopsPass && t + 1 < pos.lastT) {
        // audio.loop jumped back to the start: a new pass of the range began
        pos.pass++;
        idx = 0;
        wrapped = true;
        setGroupCount(pos.pass);
        updateLoop();
      }
      pos.lastT = t;
      const segs = program.segments;
      while (idx + 1 < segs.length && t >= segs[idx + 1].start) idx++;
      if (idx !== pos.seg || wrapped) applySegment(idx);
      setProgress(Math.max(0, t - segs[idx].start));
    };
    const onEnded = () => {
      const program = programRef.current;
      if (!program) return;
      const { startVerse, endVerse, verseRepeat, groupRepeat } = stateRef.current;
      const next = nextStart(program, posRef.current.pass, { start: startVerse, end: endVerse, verseRepeat }, groupRepeat);
      if (next) continueAt(next, true);
      else reset();
    };
    const onError = () => {
      if (programRef.current && audio.getAttribute('src')) reset('تعذّر تشغيل التلاوة — حاول مرة أخرى');
    };
    const onPlay = () => {
      setIsPlaying(true);
      setMediaPlaybackState('playing');
    };
    const onPause = () => {
      if (audio.ended || transitionRef.current || !playingRef.current) return;
      setIsPlaying(false);
      setMediaPlaybackState('paused');
    };
    const onRate = () => { if (programRef.current) setMediaPosition(audio, programRef.current.duration); };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ratechange', onRate);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ratechange', onRate);
    };
  }, [applySegment, updateLoop, continueAt, reset]);

  const play = useCallback(() => {
    if (playingRef.current) return;
    pausedRef.current = false;
    setActive(true);
    setError(null);
    setGroupCount(0);
    continueAt({ pass: 0, verse: stateRef.current.startVerse }, true);
  }, [setActive, continueAt]);

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
    // Still building: the program starts on its own when ready
    if (programRef.current) audioRef.current.play().catch(() => {});
  }, []);

  // Next/previous rebuild the program from the target ayah instead of seeking
  const skipTo = useCallback((delta) => {
    const program = programRef.current;
    if (!playingRef.current || !program) return;
    const { startVerse, endVerse } = stateRef.current;
    const current = program.segments[posRef.current.seg]?.verse ?? startVerse;
    const verse = Math.min(endVerse, Math.max(startVerse, current + delta));
    pausedRef.current = false;
    continueAt({ pass: posRef.current.pass, verse }, true);
  }, [continueAt]);

  const skipNext = useCallback(() => skipTo(1), [skipTo]);
  const skipPrev = useCallback(() => skipTo(-1), [skipTo]);

  // Range or ayah-repeat changed mid-session: rebuild from the current ayah.
  // Debounced so tapping through options rebuilds once.
  useEffect(() => {
    if (!playingRef.current || !programRef.current) return;
    const t = setTimeout(() => {
      const program = programRef.current;
      if (!playingRef.current || !program) return;
      const { startVerse, endVerse } = stateRef.current;
      const current = program.segments[posRef.current.seg]?.verse ?? startVerse;
      const verse = current >= startVerse && current <= endVerse ? current : startVerse;
      continueAt({ pass: posRef.current.pass, verse }, !audioRef.current.paused);
    }, 400);
    return () => clearTimeout(t);
  }, [startVerse, endVerse, verseRepeat, continueAt]);

  // Group repeat changed: only whether the file keeps looping changes
  useEffect(() => { updateLoop(); }, [groupRepeat, updateLoop]);

  // Lock-screen / headset controls always call the latest commands
  const commandsRef = useRef({});
  useEffect(() => {
    commandsRef.current = { play, pause, resume, stop, skipNext, skipPrev };
  });

  useEffect(() => setMediaHandlers({
    play: () => (playingRef.current ? commandsRef.current.resume() : commandsRef.current.play()),
    pause: () => commandsRef.current.pause(),
    stop: () => commandsRef.current.stop(),
    previoustrack: () => commandsRef.current.skipPrev(),
    nexttrack: () => commandsRef.current.skipNext(),
  }), []);

  useEffect(() => {
    setMediaMetadata(isActive && surah && reciter
      ? { surahName: surah.name, reciterName: reciter.name, verse: currentVerse }
      : null);
  }, [isActive, surah, reciter, currentVerse]);

  return {
    isPlaying, isActive, currentVerse, verseCount, groupCount,
    progress, duration, loading, preparing, error,
    speed, volume,
    play, pause, resume, stop,
    skipNext, skipPrev,
    setSpeed, setVolume,
  };
}

export { getCachedAudio, setCachedAudio };
