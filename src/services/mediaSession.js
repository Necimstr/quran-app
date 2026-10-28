// Thin, feature-detected wrapper around navigator.mediaSession (lock screen,
// notification panel, headset/Bluetooth controls). Every call is a no-op where unsupported.

const supported = typeof navigator !== 'undefined' && 'mediaSession' in navigator;

const ACTIONS = [
  'play', 'pause', 'stop',
  'previoustrack', 'nexttrack',
  'seekbackward', 'seekforward', 'seekto',
];

const base = import.meta.env.BASE_URL;
const ARTWORK = [
  { src: `${base}pwa-192x192.png`, sizes: '192x192', type: 'image/png' },
  { src: `${base}pwa-512x512.png`, sizes: '512x512', type: 'image/png' },
];

// Registers handlers and returns a cleanup that unregisters them.
export function setMediaHandlers(handlers) {
  if (!supported) return () => {};
  for (const action of ACTIONS) {
    try { navigator.mediaSession.setActionHandler(action, handlers[action] || null); } catch { /* unsupported by this browser */ }
  }
  return () => {
    for (const action of ACTIONS) {
      try { navigator.mediaSession.setActionHandler(action, null); } catch { /* unsupported by this browser */ }
    }
  };
}

export function setMediaMetadata(track) {
  if (!supported) return;
  if (!track || !('MediaMetadata' in window)) {
    navigator.mediaSession.metadata = null;
    return;
  }
  navigator.mediaSession.metadata = new window.MediaMetadata({
    title: `${track.surahName} · الآية ${track.verse}`,
    artist: track.reciterName,
    album: 'حفظ القرآن الكريم',
    artwork: ARTWORK,
  });
}

export function setMediaPlaybackState(state) {
  if (!supported) return;
  try { navigator.mediaSession.playbackState = state; } catch { /* unsupported by this browser */ }
}

export function setMediaPosition(audio) {
  if (!supported || !navigator.mediaSession.setPositionState) return;
  const { duration, currentTime, playbackRate } = audio;
  if (!Number.isFinite(duration) || duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate,
      position: Math.min(currentTime, duration),
    });
  } catch { /* unsupported by this browser */ }
}
