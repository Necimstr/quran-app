import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import DownloadDoneIcon from "@mui/icons-material/DownloadDone";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import VerseGrid from "./VerseGrid";

export default function RangeSelector({
  surahs,
  surah,
  startVerse,
  endVerse,
  onSurahChange,
  onStartChange,
  onEndChange,
  ayahsMap = {},
  cachedVerses,
  cachedSurahs,
  offline = false,
}) {
  const totalVerses = surah?.numberOfAyahs || 1;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {offline && (
        <Chip
          icon={<WifiOffIcon />}
          label={
            cachedSurahs?.size
              ? `غير متصل — ${cachedSurahs.size} سورة محفوظة متاحة`
              : "غير متصل — لا توجد آيات محفوظة لهذه السورة"
          }
          color={cachedVerses?.size ? "warning" : "error"}
          sx={{ fontSize: "0.9rem", height: 36, alignSelf: "flex-start" }}
        />
      )}

      <FormControl fullWidth>
        <InputLabel sx={{ fontSize: "1.1rem" }}>السورة</InputLabel>
        <Select
          value={surah?.number || ""}
          label="السورة"
          onChange={(e) => {
            const s = surahs.find((s) => s.number === e.target.value);
            onSurahChange(s);
          }}
          sx={{ fontSize: "1.1rem", minHeight: 56 }}
        >
          {surahs.map((s) => {
            const isCached = cachedSurahs?.has(s.number);
            const disabled = offline && !isCached;
            return (
              <MenuItem
                key={s.number}
                value={s.number}
                disabled={disabled}
                sx={{ fontSize: "1rem", py: 1.2, opacity: disabled ? 0.5 : 1 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                    {s.number}. {s.name}
                  </Typography>
                  {isCached ? (
                    <DownloadDoneIcon
                      sx={{ fontSize: 16, color: "success.main" }}
                    />
                  ) : offline ? (
                    <CloudOffIcon
                      sx={{ fontSize: 16, color: "text.disabled" }}
                    />
                  ) : null}
                  <Typography
                    sx={{ color: "text.secondary", fontSize: "0.9rem" }}
                  >
                    {s.englishName}
                  </Typography>
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <VerseGrid
        label="من الآية"
        total={totalVerses}
        value={startVerse}
        ayahsMap={ayahsMap}
        cachedVerses={cachedVerses}
        disableUncached={offline}
        onChange={(v) => {
          onStartChange(v);
          if (v > endVerse) onEndChange(v);
        }}
      />

      <VerseGrid
        label="إلى الآية"
        total={totalVerses}
        value={endVerse}
        min={startVerse}
        ayahsMap={ayahsMap}
        cachedVerses={cachedVerses}
        disableUncached={offline}
        onChange={onEndChange}
      />
    </Box>
  );
}
