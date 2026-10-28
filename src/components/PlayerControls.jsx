import { Box, IconButton, Slider, Typography, CircularProgress, Chip, Stack } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function PlayerControls({
  isPlaying, currentVerse, verseCount, groupCount,
  verseRepeat, groupRepeat, surah, startVerse, endVerse,
  progress, duration, loading, error,
  onPlay, onPause, onResume, onStop, onSeek,
}) {
  const ready = !!surah;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Current verse indicator */}
      <Box sx={{
        bgcolor: 'primary.main', color: 'primary.contrastText',
        borderRadius: 3, p: 2.5, textAlign: 'center',
        minHeight: 80, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {isPlaying || loading ? (
          <>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {surah?.englishName} — Verse {currentVerse}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" justifyContent="center">
              <Chip
                label={`Verse rep: ${verseCount + 1}/${verseRepeat}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'inherit', fontSize: '0.85rem' }}
              />
              <Chip
                label={groupRepeat === 0 ? 'Group: ∞' : `Group: ${groupCount + 1}/${groupRepeat}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'inherit', fontSize: '0.85rem' }}
              />
            </Stack>
          </>
        ) : (
          <Typography variant="h6" sx={{ opacity: 0.8 }}>
            {ready ? `${surah.englishName} · Verses ${startVerse}–${endVerse}` : 'Select Surah to begin'}
          </Typography>
        )}
      </Box>

      {error && (
        <Typography color="error" sx={{ textAlign: 'center', fontSize: '0.95rem' }}>{error}</Typography>
      )}

      {/* Progress slider */}
      <Box sx={{ px: 1 }}>
        <Slider
          value={progress}
          max={duration || 1}
          onChange={(_, v) => onSeek(v)}
          disabled={!isPlaying && !progress}
          sx={{ height: 6, '& .MuiSlider-thumb': { width: 20, height: 20 } }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">{formatTime(progress)}</Typography>
          <Typography variant="body2" color="text.secondary">{formatTime(duration)}</Typography>
        </Box>
      </Box>

      {/* Control buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center' }}>
        <IconButton
          onClick={onStop}
          disabled={!isPlaying && !progress}
          sx={{ bgcolor: 'grey.200', width: 64, height: 64, '&:hover': { bgcolor: 'grey.300' } }}
        >
          <StopIcon sx={{ fontSize: 32 }} />
        </IconButton>

        {loading ? (
          <CircularProgress size={72} thickness={4} />
        ) : (
          <IconButton
            onClick={isPlaying ? onPause : (progress > 0 ? onResume : onPlay)}
            disabled={!ready}
            sx={{
              bgcolor: 'primary.main', color: 'white', width: 80, height: 80,
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'grey.300' },
            }}
          >
            {isPlaying ? <PauseIcon sx={{ fontSize: 44 }} /> : <PlayArrowIcon sx={{ fontSize: 44 }} />}
          </IconButton>
        )}

        <Box sx={{ width: 64 }} /> {/* spacer to center play button */}
      </Box>
    </Box>
  );
}
