import { useState, useEffect } from 'react';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Button
        variant={done ? 'contained' : 'outlined'}
        size="large"
        startIcon={done ? <CheckCircleIcon /> : <DownloadIcon />}
        onClick={handleCache}
        disabled={!ready || downloading || done}
        color={done ? 'success' : 'primary'}
        sx={{
          minHeight: 56, fontSize: '0.95rem', fontWeight: 700,
          borderWidth: done ? 0 : 1.5,
          '&:hover': { borderWidth: done ? 0 : 1.5 },
          textAlign: 'start',
          justifyContent: 'flex-start',
          px: 2,
        }}
      >
        {done
          ? `تم حفظ السورة كاملةً (${total} آية)`
          : downloading
          ? `جارٍ التحميل · ${progress}%`
          : partial
          ? `إكمال التحميل · ${cachedCount}/${total} آية`
          : ready
          ? `تحميل السورة كاملةً (${total} آية)`
          : 'تحميل السورة للاستماع بدون إنترنت'}
      </Button>

      {downloading && (
        <Box sx={{ px: 0.5 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6, borderRadius: 999,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { borderRadius: 999 },
            }}
          />
          <Typography sx={{
            mt: 0.5, textAlign: 'center',
            fontSize: '0.75rem', fontWeight: 500,
            color: 'text.secondary', fontVariantNumeric: 'tabular-nums',
          }}>
            {Math.round(progress * total / 100)} / {total} آية
          </Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" variant="body2" sx={{ fontSize: '0.85rem' }}>{error}</Typography>
      )}

      {!navigator.onLine && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1.5, py: 0.9, borderRadius: 2,
          bgcolor: 'warning.light', color: 'warning.dark',
          border: '1px solid', borderColor: 'warning.main',
        }}>
          <WifiOffIcon sx={{ fontSize: 17 }} />
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
            غير متصل · يتم تشغيل الصوت المحفوظ
          </Typography>
        </Box>
      )}
    </Box>
  );
}
