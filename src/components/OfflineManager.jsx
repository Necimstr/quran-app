import { useState, useEffect } from 'react';
import { Box, Button, LinearProgress, Typography, Chip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getAyahAudioUrl } from '../services/apiService';
import { cacheKey, getCachedAudio, setCachedAudio, listCachedVerses } from '../hooks/useQuranPlayer';

export default function OfflineManager({ reciter, surah }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);
  const [error, setError] = useState(null);

  const ready = reciter && surah;
  const total = ready ? surah.numberOfAyahs : 0;
  const done = ready && cachedCount >= total;
  const partial = cachedCount > 0 && !done;

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (!reciter || !surah) {
        setCachedCount(0);
        return;
      }
      listCachedVerses(reciter, surah.number).then((s) => {
        if (!cancelled) setCachedCount(s.size);
      });
    };
    refresh();
    const onCache = () => refresh();
    window.addEventListener('quran:cache-updated', onCache);
    return () => {
      cancelled = true;
      window.removeEventListener('quran:cache-updated', onCache);
    };
  }, [reciter, surah]);

  async function handleCache() {
    if (!ready || done) return;
    setDownloading(true);
    setError(null);
    setProgress(0);

    let completed = 0;
    for (let v = 1; v <= total; v++) {
      try {
        const key = await cacheKey(reciter, surah.number, v);
        const existing = await getCachedAudio(key);
        if (!existing) {
          const url = getAyahAudioUrl(reciter, surah.number, v);
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          await setCachedAudio(key, blob);
        }
        completed++;
        setProgress(Math.round((completed / total) * 100));
      } catch (e) {
        setError(`فشل تحميل الآية ${v}: ${e.message}`);
        setDownloading(false);
        return;
      }
    }

    setDownloading(false);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Button
        variant={done ? 'contained' : 'outlined'}
        size="large"
        startIcon={done ? <CheckCircleIcon /> : <DownloadIcon />}
        onClick={handleCache}
        disabled={!ready || downloading || done}
        color={done ? 'success' : 'primary'}
        sx={{ minHeight: 56, fontSize: '1rem', fontWeight: 600 }}
      >
        {done
          ? `تم حفظ السورة كاملة (${total} آية)`
          : downloading
          ? `جارٍ التحميل... ${progress}%`
          : partial
          ? `إكمال التحميل (${cachedCount}/${total} آية محفوظة)`
          : ready
          ? `تحميل كامل السورة (${total} آية) للاستماع بدون إنترنت`
          : 'تحميل السورة للاستماع بدون إنترنت'}
      </Button>

      {downloading && (
        <Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
            {Math.round(progress * total / 100)} / {total} آيات محفوظة
          </Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" variant="body2">{error}</Typography>
      )}

      {!navigator.onLine && (
        <Chip
          icon={<WifiOffIcon />}
          label="غير متصل — يتم تشغيل الصوت المحفوظ"
          color="warning"
          sx={{ fontSize: '0.9rem', height: 36 }}
        />
      )}
    </Box>
  );
}
