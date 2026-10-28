import { Box, IconButton, LinearProgress, Typography, CircularProgress, ButtonBase } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";

const QURAN_FONT = '"Noto Naskh Arabic", serif';

function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Faint star field + moon glow layered behind the arch content
const SKY = [
  "radial-gradient(circle at 50% 9%, rgba(255,232,178,0.28) 0%, rgba(255,232,178,0) 30%)",
  "radial-gradient(1.6px 1.6px at 18% 20%, rgba(255,255,255,0.75), transparent)",
  "radial-gradient(1.2px 1.2px at 30% 9%, rgba(255,255,255,0.55), transparent)",
  "radial-gradient(1.4px 1.4px at 74% 16%, rgba(255,255,255,0.7), transparent)",
  "radial-gradient(1.1px 1.1px at 84% 30%, rgba(255,255,255,0.5), transparent)",
  "radial-gradient(1.2px 1.2px at 12% 38%, rgba(255,255,255,0.45), transparent)",
  "radial-gradient(1.3px 1.3px at 64% 6%, rgba(255,255,255,0.6), transparent)",
];

const ARCH_RADIUS = "50% 50% 28px 28px / 132px 132px 28px 28px";
const INNER_ARCH_RADIUS = "50% 50% 20px 20px / 122px 122px 20px 20px";

function Crescent() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden
      sx={{
        width: 30,
        height: 30,
        color: "#f3d38b",
        filter: "drop-shadow(0 0 10px rgba(243,211,139,0.55))",
      }}
    >
      <path
        fill="currentColor"
        d="M15.6 3.2a8.8 8.8 0 1 0 5.2 13.9A7.4 7.4 0 0 1 15.6 3.2Z"
      />
    </Box>
  );
}

function ArchWindow({ children }) {
  return (
    <Box
      sx={(theme) => {
        const dark = theme.palette.mode === "dark";
        return {
          position: "relative",
          overflow: "hidden",
          color: "#ffffff",
          borderRadius: ARCH_RADIUS,
          minHeight: 300,
          px: { xs: 3, sm: 4 },
          pt: 10,
          pb: 3.5,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          backgroundColor: dark ? "#0d2e2a" : "#00564c",
          backgroundImage: [
            ...SKY,
            dark
              ? "linear-gradient(180deg, #082320 0%, #0f3f39 52%, #11463f 100%)"
              : "linear-gradient(180deg, #003d36 0%, #00695c 58%, #005d51 100%)",
          ].join(", "),
          boxShadow: dark
            ? "0 18px 40px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 18px 40px -14px rgba(0,61,54,0.55), inset 0 1px 0 rgba(255,255,255,0.1)",
          // Inner frame line, like a carved mihrab border
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 10,
            borderRadius: INNER_ARCH_RADIUS,
            border: "1px solid rgba(255,255,255,0.16)",
            pointerEvents: "none",
          },
        };
      }}
    >
      <Box sx={{ position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)" }}>
        <Crescent />
      </Box>
      {children}
    </Box>
  );
}

function ControlButton({ label, onClick, disabled, size = 64, primary = false, loading = false, children }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Box sx={{ position: "relative", display: "flex" }}>
        <IconButton
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          sx={(theme) => {
            const dark = theme.palette.mode === "dark";
            return primary
              ? {
                  width: size,
                  height: size,
                  color: "#ffffff",
                  background: dark
                    ? "linear-gradient(160deg, #4db6ac 0%, #1f8f84 100%)"
                    : "linear-gradient(160deg, #00897b 0%, #004d40 100%)",
                  boxShadow: dark
                    ? "0 10px 24px -6px rgba(77,182,172,0.45), inset 0 1px 0 rgba(255,255,255,0.18)"
                    : "0 10px 24px -6px rgba(0,77,64,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
                  transition: "transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s",
                  "&:hover": { transform: "translateY(-1px)" },
                  "&:active": { transform: "scale(0.97)" },
                  "&.Mui-disabled": {
                    background: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                    boxShadow: "none",
                  },
                }
              : {
                  width: size,
                  height: size,
                  color: "text.primary",
                  bgcolor: dark ? "rgba(255,255,255,0.07)" : "rgba(0,77,64,0.07)",
                  border: "1px solid",
                  borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,77,64,0.1)",
                  "&:hover": { bgcolor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,77,64,0.12)" },
                  "&.Mui-disabled": { opacity: 0.38, color: "text.primary" },
                };
          }}
        >
          {children}
        </IconButton>
        {loading && (
          <CircularProgress
            size={size + 12}
            thickness={2.5}
            aria-hidden
            sx={{ position: "absolute", top: -6, left: -6, color: "primary.main", pointerEvents: "none" }}
          />
        )}
      </Box>
      <Typography
        aria-hidden
        sx={{
          fontSize: "0.9rem",
          fontWeight: 700,
          color: disabled ? "text.disabled" : "text.secondary",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
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
  preparing,
  error,
  verseText,
  reciter,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSkipNext,
  onSkipPrev,
}) {
  const ready = !!surah;
  const showing = isActive || loading;
  const paused = isActive && !isPlaying && !loading;
  const total = endVerse - startVerse + 1;

  const mainLabel = loading ? "جارٍ التجهيز" : isPlaying ? "إيقاف مؤقت" : isActive ? "متابعة" : "ابدأ التلاوة";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.75 }}>
      <ArchWindow>
        {showing ? (
          <>
            <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>
              <Box component="span" sx={{ fontFamily: QURAN_FONT }}>{surah?.name}</Box>
              {" · "}الآية {currentVerse}
            </Typography>
            {verseText ? (
              <Typography
                lang="ar"
                sx={{
                  fontFamily: QURAN_FONT,
                  fontSize: { xs: "1.55rem", sm: "1.75rem" },
                  lineHeight: 2.05,
                  fontWeight: 600,
                  textWrap: "balance",
                  maxHeight: "12.3em",
                  overflowY: "auto",
                  px: 0.5,
                  scrollbarColor: "rgba(255,255,255,0.3) transparent",
                }}
              >
                {verseText}
              </Typography>
            ) : null}
            {preparing && (
              <Box sx={{ width: "100%", maxWidth: 260, mt: 0.5 }} role="status">
                <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.92)", mb: 1 }}>
                  جارٍ تجهيز التلاوة · {preparing.done} من {preparing.total}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(preparing.done / preparing.total) * 100}
                  aria-label="تجهيز التلاوة"
                  sx={{
                    height: 6, borderRadius: 999, bgcolor: "rgba(255,255,255,0.18)",
                    "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#f3d38b" },
                  }}
                />
              </Box>
            )}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: 1,
                mt: 0.5,
                fontSize: "0.92rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.86)",
              }}
            >
              {paused && (
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.25,
                    py: 0.25,
                    borderRadius: 999,
                    bgcolor: "rgba(255,255,255,0.18)",
                    color: "#ffffff",
                    fontWeight: 700,
                  }}
                >
                  <PauseIcon sx={{ fontSize: 18 }} />
                  متوقف مؤقتًا
                </Box>
              )}
              {verseRepeat > 1 && (
                <span>التكرار {verseCount + 1} من {verseRepeat}</span>
              )}
              {verseRepeat > 1 && groupRepeat !== 1 && <span aria-hidden>·</span>}
              {groupRepeat === 0 ? (
                <span>المجموعة تتكرر بلا نهاية</span>
              ) : groupRepeat > 1 ? (
                <span>المجموعة {groupCount + 1} من {groupRepeat}</span>
              ) : null}
            </Box>
          </>
        ) : (
          <>
            <Typography
              component="h1"
              sx={{
                fontFamily: QURAN_FONT,
                fontWeight: 700,
                fontSize: { xs: "2.1rem", sm: "2.4rem" },
                lineHeight: 1.5,
              }}
            >
              {ready ? surah.name : "اختر السورة للبدء"}
            </Typography>
            {ready && (
              <>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
                  {total === surah.numberOfAyahs
                    ? `السورة كاملة · ${total} آية`
                    : `من الآية ${startVerse} إلى الآية ${endVerse}`}
                </Typography>
                {reciter && (
                  <Typography sx={{ fontSize: "1rem", fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
                    بصوت {reciter.name}
                  </Typography>
                )}
              </>
            )}
          </>
        )}
      </ArchWindow>

      {error && (
        <Box
          role="alert"
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.25,
            px: 2,
            py: 1.5,
            borderRadius: '16px',
            bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(244,67,54,0.12)" : "#fdecea"),
            color: (t) => (t.palette.mode === "dark" ? "#ffb4ab" : "#8c1d18"),
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 24, mt: 0.1, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "1rem", fontWeight: 600, lineHeight: 1.6 }}>{error}</Typography>
        </Box>
      )}

      {isActive && !preparing && (
        <Box sx={{ px: 0.5 }}>
          {/* Display only: the joined recitation file can't be seeked reliably */}
          <LinearProgress
            variant="determinate"
            value={duration ? Math.min(100, (progress / duration) * 100) : 0}
            aria-label="تقدّم الآية"
            sx={{ height: 6, borderRadius: 999, mb: 1.25, "& .MuiLinearProgress-bar": { borderRadius: 999 } }}
          />
          <Box
            dir="ltr"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              px: 0.5,
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "text.secondary",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "start",
          justifyItems: "center",
          px: 1,
        }}
      >
        <ControlButton label="السابق" onClick={onSkipPrev} disabled={!isActive}>
          <SkipNextIcon sx={{ fontSize: 32 }} />
        </ControlButton>

        <ControlButton
          primary
          size={96}
          label={mainLabel}
          loading={loading}
          disabled={!ready}
          onClick={isPlaying ? onPause : isActive ? onResume : onPlay}
        >
          {isPlaying ? <PauseIcon sx={{ fontSize: 46 }} /> : <PlayArrowIcon sx={{ fontSize: 50 }} />}
        </ControlButton>

        <ControlButton label="التالي" onClick={onSkipNext} disabled={!isActive}>
          <SkipPreviousIcon sx={{ fontSize: 32 }} />
        </ControlButton>
      </Box>

      {isActive && (
        <ButtonBase
          onClick={onStop}
          sx={{
            alignSelf: "center",
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 2.5,
            minHeight: 48,
            borderRadius: 999,
            fontSize: "1rem",
            fontWeight: 700,
            color: "text.secondary",
            "&:hover": { bgcolor: "action.hover", color: "text.primary" },
          }}
        >
          <StopIcon sx={{ fontSize: 22 }} />
          إنهاء التلاوة
        </ButtonBase>
      )}
    </Box>
  );
}
