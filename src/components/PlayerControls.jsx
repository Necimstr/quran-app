import { Box, IconButton, Slider, Typography, CircularProgress, Chip, Stack, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];
const SPEED_LABELS = { 0.5: '0.5×', 0.75: '0.75×', 1: '1×', 1.25: '1.25×', 1.5: '1.5×' };

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function PlayerControls({
  isPlaying, currentVerse, verseCount, groupCount,
  verseRepeat, groupRepeat, surah, startVerse, endVerse,
  progress, duration, loading, error, verseText,
  speed, volume, reciter,
  onPlay, onPause, onResume, onStop, onSeek,
  onSkipNext, onSkipPrev, onSpeedChange, onVolumeChange,
}) {
  const ready = !!surah;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Verse display card */}
      <Box sx={{
        bgcolor: 'primary.main', color: 'primary.contrastText',
        borderRadius: 3, p: 2.5, textAlign: 'center',
        minHeight: 90, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 1,
      }}>
        {isPlaying || loading ? (
          <>
            <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
              سورة {surah?.name} — الآية {currentVerse}
            </Typography>
            {verseText ? (
              <Typography sx={{
                fontFamily: '"Noto Naskh Arabic", serif',
                fontSize: '1.3rem', lineHeight: 2, fontWeight: 600,
              }}>
                {verseText}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
              <Chip
                label={`تكرار الآية: ${verseCount + 1}/${verseRepeat}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'inherit', fontSize: '0.8rem', fontFamily: 'inherit' }}
              />
              <Chip
                label={groupRepeat === 0 ? 'تكرار: ∞' : `تكرار المجموعة: ${groupCount + 1}/${groupRepeat}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'inherit', fontSize: '0.8rem', fontFamily: 'inherit' }}
              />
            </Stack>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
              {ready ? `سورة ${surah.name}` : 'اختر السورة للبدء'}
            </Typography>
            {ready && (
              <>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  الآيات {startVerse} – {endVerse}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ mt: 0.5 }}>
                  {reciter && (
                    <Chip
                      label={reciter.name}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'inherit', fontSize: '0.78rem' }}
                    />
                  )}
                  <Chip
                    label={`تكرار الآية: ${verseRepeat}×`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'inherit', fontSize: '0.78rem' }}
                  />
                  <Chip
                    label={groupRepeat === 0 ? 'تكرار المجموعة: ∞' : `تكرار المجموعة: ${groupRepeat}×`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'inherit', fontSize: '0.78rem' }}
                  />
                </Stack>
              </>
            )}
          </Box>
        )}
      </Box>

      {error && (
        <Typography color="error" sx={{ textAlign: 'center', fontSize: '0.9rem' }}>{error}</Typography>
      )}

      {/* Progress slider */}
      <Box>
        <Slider
          value={progress}
          max={duration || 1}
          onChange={(_, v) => onSeek(v)}
          disabled={!isPlaying && !progress}
          sx={{ height: 6, '& .MuiSlider-thumb': { width: 20, height: 20 }, display: 'block' }}
        />
        <Box dir="ltr" sx={{ display: 'flex', justifyContent: 'space-between', mt: -0.5, px: '10px' }}>
          <Typography variant="caption" color="text.secondary">{formatTime(progress)}</Typography>
          <Typography variant="caption" color="text.secondary">{formatTime(duration)}</Typography>
        </Box>
      </Box>

      {/* Speed buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
        {SPEEDS.map((s) => (
          <Chip
            key={s}
            label={SPEED_LABELS[s]}
            onClick={() => onSpeedChange(s)}
            variant={speed === s ? 'filled' : 'outlined'}
            color={speed === s ? 'primary' : 'default'}
            sx={{ fontSize: '0.9rem', fontWeight: 600, minWidth: 52 }}
          />
        ))}
      </Box>

      {/* Main controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
        <IconButton
          onClick={onStop}
          disabled={!isPlaying && !progress}
          sx={{ bgcolor: 'grey.200', width: 52, height: 52, '&:hover': { bgcolor: 'grey.300' } }}
        >
          <StopIcon sx={{ fontSize: 26 }} />
        </IconButton>

        <IconButton
          onClick={onSkipPrev}
          disabled={!isPlaying}
          sx={{ bgcolor: 'grey.100', width: 56, height: 56, '&:hover': { bgcolor: 'grey.200' } }}
        >
          <SkipNextIcon sx={{ fontSize: 30 }} />
        </IconButton>

        {loading ? (
          <CircularProgress size={72} thickness={4} />
        ) : (
          <IconButton
            onClick={isPlaying ? onPause : (progress > 0 ? onResume : onPlay)}
            disabled={!ready}
            sx={{
              bgcolor: 'primary.main', color: 'white', width: 76, height: 76,
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'grey.300' },
            }}
          >
            {isPlaying ? <PauseIcon sx={{ fontSize: 42 }} /> : <PlayArrowIcon sx={{ fontSize: 42 }} />}
          </IconButton>
        )}

        <IconButton
          onClick={onSkipNext}
          disabled={!isPlaying}
          sx={{ bgcolor: 'grey.100', width: 56, height: 56, '&:hover': { bgcolor: 'grey.200' } }}
        >
          <SkipPreviousIcon sx={{ fontSize: 30 }} />
        </IconButton>

        <Box sx={{ width: 52 }} />
      </Box>

      {/* Volume */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
        <VolumeUpIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
        <Slider
          value={volume}
          min={0}
          max={1}
          step={0.05}
          onChange={(_, v) => onVolumeChange(v)}
          sx={{ height: 6, '& .MuiSlider-thumb': { width: 18, height: 18 } }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 32 }}>
          {Math.round(volume * 100)}%
        </Typography>
      </Box>

    </Box>
  );
}
