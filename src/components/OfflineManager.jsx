import { useState } from 'react';
import { Box, Button, LinearProgress, Typography, Chip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getAyahAudioUrl } from '../services/apiService';
import { cacheKey, getCachedAudio, setCachedAudio } from '../hooks/useQuranPlayer';

export default function OfflineManager({ reciter, surah, startVerse, endVerse }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const ready = reciter && surah;
  const total = ready ? endVerse - startVerse + 1 : 0;

  async function handleCache() {
    if (!ready) return;
    setDownloading(true);
    setDone(false);
    setError(null);
    setProgress(0);

    let completed = 0;
    for (let v = startVerse; v <= endVerse; v++) {
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
        setError(`Failed at verse ${v}: ${e.message}`);
        setDownloading(false);
        return;
      }
    }

    setDownloading(false);
    setDone(true);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Button
        variant="outlined"
        size="large"
        startIcon={done ? <CheckCircleIcon /> : <DownloadIcon />}
        onClick={handleCache}
        disabled={!ready || downloading}
        color={done ? 'success' : 'primary'}
        sx={{ minHeight: 56, fontSize: '1rem', fontWeight: 600 }}
      >
        {done
          ? 'Cached for Offline Use'
          : downloading
          ? `Downloading... ${progress}%`
          : 'Download / Cache Surah Audio'}
      </Button>

      {downloading && (
        <Box>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
            {Math.round(progress * total / 100)} / {total} verses cached
          </Typography>
        </Box>
      )}

      {error && (
        <Typography color="error" variant="body2">{error}</Typography>
      )}

      {!navigator.onLine && (
        <Chip
          icon={<WifiOffIcon />}
          label="Offline — using cached audio"
          color="warning"
          sx={{ fontSize: '0.9rem', height: 36 }}
        />
      )}
    </Box>
  );
}
