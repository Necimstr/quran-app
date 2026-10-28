import {
  Box,
  IconButton,
  Slider,
  Typography,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];
const SPEED_LABELS = {
  0.5: "0.5×",
  0.75: "0.75×",
  1: "1×",
  1.25: "1.25×",
  1.5: "1.5×",
};

function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function PlayerControls({
  isPlaying,
  isActive,
  currentVerse,
  verseCount,
  groupCount,
  verseRepeat,
  groupRepeat,
  surah,
  startVerse,
  endVerse,
  progress,
  duration,
  loading,
  error,
  verseText,
  speed,
  volume,
  reciter,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSeek,
  onSkipNext,
  onSkipPrev,
  onSpeedChange,
  onVolumeChange,
}) {
  const ready = !!surah;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Verse display card */}
      <Box
        sx={(theme) => ({
          position: "relative",
          overflow: "hidden",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #0e3833 0%, #10514a 60%, #0b2b27 100%)"
              : "linear-gradient(135deg, #005047 0%, #00695c 55%, #004d40 100%)",
          color: "#ffffff",
          borderRadius: 3,
          px: 2.5,
          py: 2.75,
          textAlign: "center",
          minHeight: 110,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.25,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
              : "0 8px 24px rgba(0,77,64,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 85% 15%, rgba(255,255,255,0.08) 0%, transparent 50%)",
          },
        })}
      >
        {isActive || loading ? (
          <>
            <Typography
              sx={{
                opacity: 0.78,
                fontSize: "0.78rem",
                letterSpacing: "0.02em",
                fontWeight: 500,
              }}
            >
              سورة {surah?.name} · الآية {currentVerse}
            </Typography>
            {verseText ? (
              <Typography
                sx={{
                  fontFamily: '"Noto Naskh Arabic", serif',
                  fontSize: "1.35rem",
                  lineHeight: 2,
                  fontWeight: 600,
                  textWrap: "balance",
                }}
              >
                {verseText}
              </Typography>
            ) : null}
            <Stack
              direction="row"
              spacing={0.75}
              flexWrap="wrap"
              justifyContent="center"
              sx={{ mt: 0.25 }}
            >
              {!isPlaying && !loading && (
                <Chip
                  icon={<PauseIcon sx={{ fontSize: 14, color: "inherit !important" }} />}
                  label="متوقف مؤقتًا"
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.24)",
                    color: "inherit",
                    fontSize: "0.72rem",
                    height: 22,
                    fontFamily: "inherit",
                    backdropFilter: "blur(4px)",
                  }}
                />
              )}
              <Chip
                label={`الآية ${verseCount + 1}/${verseRepeat}`}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.14)",
                  color: "inherit",
                  fontSize: "0.72rem",
                  height: 22,
                  fontFamily: "inherit",
                  backdropFilter: "blur(4px)",
                }}
              />
              <Chip
                label={
                  groupRepeat === 0
                    ? "التكرار: ∞"
                    : `المجموعة ${groupCount + 1}/${groupRepeat}`
                }
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.14)",
                  color: "inherit",
                  fontSize: "0.72rem",
                  height: 22,
                  fontFamily: "inherit",
                  backdropFilter: "blur(4px)",
                }}
              />
            </Stack>
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.9,
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1.3rem",
                lineHeight: 1.3,
                fontFamily: '"Noto Naskh Arabic", serif',
              }}
            >
              {ready ? `سورة ${surah.name}` : "اختر السورة للبدء"}
            </Typography>
            {ready && (
              <>
                <Typography
                  sx={{ opacity: 0.8, fontSize: "0.82rem", fontWeight: 500 }}
                >
                  الآيات {startVerse} – {endVerse}
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.75}
                  flexWrap="wrap"
                  justifyContent="center"
                  sx={{ mt: 0.5 }}
                >
                  {reciter && (
                    <Chip
                      label={reciter.name}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.14)",
                        color: "inherit",
                        fontSize: "0.72rem",
                        height: 22,
                        backdropFilter: "blur(4px)",
                      }}
                    />
                  )}
                  <Chip
                    label={`تكرار الآية ×${verseRepeat}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.14)",
                      color: "inherit",
                      fontSize: "0.72rem",
                      height: 22,
                      backdropFilter: "blur(4px)",
                    }}
                  />
                  <Chip
                    label={
                      groupRepeat === 0
                        ? "التكرار ∞"
                        : `المجموعة ×${groupRepeat}`
                    }
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.14)",
                      color: "inherit",
                      fontSize: "0.72rem",
                      height: 22,
                      backdropFilter: "blur(4px)",
                    }}
                  />
                </Stack>
              </>
            )}
          </Box>
        )}
      </Box>

      {error && (
        <Typography
          color="error"
          sx={{ textAlign: "center", fontSize: "0.9rem" }}
        >
          {error}
        </Typography>
      )}

      {/* Progress slider */}
      <Box sx={{ px: 0.5 }}>
        <Slider
          value={progress}
          max={duration || 1}
          onChange={(_, v) => onSeek(v)}
          disabled={!isActive}
          sx={{ display: "block" }}
        />
        <Box
          dir="ltr"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: -0.25,
            px: 0.5,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontVariantNumeric: "tabular-nums", fontSize: "0.75rem" }}
          >
            {formatTime(progress)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontVariantNumeric: "tabular-nums", fontSize: "0.75rem" }}
          >
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>

      {/* Speed buttons */}
      <Box
        sx={(theme) => ({
          display: "flex",
          justifyContent: "center",
          gap: 0.5,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,0,0,0.03)",
          borderRadius: 999,
          p: 0.5,
          mx: "auto",
        })}
      >
        {SPEEDS.map((s) => {
          const active = speed === s;
          return (
            <Box
              key={s}
              component="button"
              onClick={() => onSpeedChange(s)}
              sx={(theme) => ({
                border: "none",
                cursor: "pointer",
                minWidth: 44,
                px: 1.25,
                py: 0.6,
                borderRadius: 999,
                fontSize: "0.82rem",
                fontWeight: 700,
                fontFamily: "inherit",
                fontVariantNumeric: "tabular-nums",
                color: active
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.secondary,
                bgcolor: active ? "primary.main" : "transparent",
                boxShadow: active
                  ? theme.palette.mode === "dark"
                    ? "0 2px 6px rgba(0,0,0,0.4)"
                    : "0 2px 6px rgba(0,77,64,0.25)"
                  : "none",
                transition:
                  "background-color 0.2s, color 0.2s, box-shadow 0.2s",
                "&:hover": {
                  color: active ? "inherit" : theme.palette.text.primary,
                },
              })}
            >
              {SPEED_LABELS[s]}
            </Box>
          );
        })}
      </Box>

      {/* Main controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1.75,
        }}
      >
        <IconButton
          onClick={onStop}
          disabled={!isActive}
          aria-label="إيقاف"
          sx={{
            bgcolor: "action.selected",
            width: 48,
            height: 48,
            color: "text.secondary",
            "&:hover": {
              bgcolor: "action.disabledBackground",
              color: "text.primary",
            },
            "&.Mui-disabled": { opacity: 0.4 },
          }}
        >
          <StopIcon sx={{ fontSize: 22 }} />
        </IconButton>

        <IconButton
          onClick={onSkipPrev}
          disabled={!isActive}
          aria-label="السابق"
          sx={{
            bgcolor: "action.hover",
            width: 56,
            height: 56,
            color: "text.primary",
            "&:hover": { bgcolor: "action.selected" },
          }}
        >
          <SkipNextIcon sx={{ fontSize: 28 }} />
        </IconButton>

        {loading ? (
          <Box
            sx={{
              width: 76,
              height: 76,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : (
          <IconButton
            onClick={isPlaying ? onPause : isActive ? onResume : onPlay}
            disabled={!ready}
            aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
            sx={(theme) => ({
              background:
                theme.palette.mode === "dark"
                  ? "linear-gradient(145deg, #4db6ac 0%, #26a69a 100%)"
                  : "linear-gradient(145deg, #00796b 0%, #004d40 100%)",
              color: "#ffffff",
              width: 76,
              height: 76,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 6px 18px rgba(77,182,172,0.35), inset 0 1px 0 rgba(255,255,255,0.12)"
                  : "0 6px 18px rgba(0,77,64,0.35), inset 0 1px 0 rgba(255,255,255,0.14)",
              transition: "transform 0.15s, box-shadow 0.2s",
              "&:hover": {
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 8px 22px rgba(77,182,172,0.45), inset 0 1px 0 rgba(255,255,255,0.14)"
                    : "0 8px 22px rgba(0,77,64,0.45), inset 0 1px 0 rgba(255,255,255,0.16)",
                transform: "translateY(-1px)",
              },
              "&:active": { transform: "translateY(0)" },
              "&.Mui-disabled": {
                background: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
                boxShadow: "none",
              },
            })}
          >
            {isPlaying ? (
              <PauseIcon sx={{ fontSize: 38 }} />
            ) : (
              <PlayArrowIcon sx={{ fontSize: 38 }} />
            )}
          </IconButton>
        )}

        <IconButton
          onClick={onSkipNext}
          disabled={!isActive}
          aria-label="التالي"
          sx={{
            bgcolor: "action.hover",
            width: 56,
            height: 56,
            color: "text.primary",
            "&:hover": { bgcolor: "action.selected" },
          }}
        >
          <SkipPreviousIcon sx={{ fontSize: 28 }} />
        </IconButton>

        <Box sx={{ width: 48 }} aria-hidden />
      </Box>

      {/* Volume */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1, mt: 0.5 }}
      >
        <Typography
          sx={{
            minWidth: 36,
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "text.secondary",
            fontVariantNumeric: "tabular-nums",
            textAlign: "start",
          }}
        >
          {Math.round(volume * 100)}%
        </Typography>
        <Slider
          value={volume}
          min={0}
          max={1}
          step={0.05}
          onChange={(_, v) => onVolumeChange(v)}
          aria-label="مستوى الصوت"
        />
        <VolumeUpIcon sx={{ color: "text.secondary", fontSize: 20 }} />
      </Box>
    </Box>
  );
}
