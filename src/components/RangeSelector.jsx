import { FormControl, InputLabel, Select, MenuItem, Box, Typography, Chip } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import VerseGrid from './VerseGrid';

export default function RangeSelector({ surahs, surah, startVerse, endVerse, onSurahChange, onStartChange, onEndChange, ayahsMap = {}, cachedVerses, offline = false }) {
  const totalVerses = surah?.numberOfAyahs || 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {offline && (
        <Chip
          icon={<WifiOffIcon />}
          label={cachedVerses?.size
            ? `غير متصل — ${cachedVerses.size} آية محفوظة متاحة`
            : 'غير متصل — لا توجد آيات محفوظة لهذه السورة'}
          color={cachedVerses?.size ? 'warning' : 'error'}
          sx={{ fontSize: '0.9rem', height: 36, alignSelf: 'flex-start' }}
        />
      )}

      <FormControl fullWidth>
        <InputLabel sx={{ fontSize: '1.1rem' }}>السورة</InputLabel>
        <Select
          value={surah?.number || ''}
          label="السورة"
          onChange={(e) => {
            const s = surahs.find((s) => s.number === e.target.value);
            onSurahChange(s);
          }}
          sx={{ fontSize: '1.1rem', minHeight: 56 }}
        >
          {surahs.map((s) => (
            <MenuItem key={s.number} value={s.number} sx={{ fontSize: '1rem', py: 1.2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{s.number}. {s.name}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', alignSelf: 'center' }}>{s.englishName}</Typography>
              </Box>
            </MenuItem>
          ))}
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
