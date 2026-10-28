import { FormControl, InputLabel, Select, MenuItem, Grid, Typography, Box } from '@mui/material';

export default function RangeSelector({ surahs, surah, startVerse, endVerse, onSurahChange, onStartChange, onEndChange }) {
  const totalVerses = surah?.numberOfAyahs || 1;
  const verseOptions = Array.from({ length: totalVerses }, (_, i) => i + 1);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel sx={{ fontSize: '1.1rem' }}>Surah</InputLabel>
        <Select
          value={surah?.number || ''}
          label="Surah"
          onChange={(e) => {
            const s = surahs.find((s) => s.number === e.target.value);
            onSurahChange(s);
          }}
          sx={{ fontSize: '1.1rem', minHeight: 56 }}
        >
          {surahs.map((s) => (
            <MenuItem key={s.number} value={s.number} sx={{ fontSize: '1rem', py: 1.2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{s.number}. {s.englishName}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', alignSelf: 'center' }}>{s.name}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontSize: '1.1rem' }}>Start Verse</InputLabel>
            <Select
              value={startVerse}
              label="Start Verse"
              onChange={(e) => onStartChange(e.target.value)}
              sx={{ fontSize: '1.1rem', minHeight: 56 }}
            >
              {verseOptions.map((v) => (
                <MenuItem key={v} value={v} sx={{ fontSize: '1.1rem', py: 1.2 }}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontSize: '1.1rem' }}>End Verse</InputLabel>
            <Select
              value={endVerse}
              label="End Verse"
              onChange={(e) => onEndChange(e.target.value)}
              sx={{ fontSize: '1.1rem', minHeight: 56 }}
            >
              {verseOptions.filter((v) => v >= startVerse).map((v) => (
                <MenuItem key={v} value={v} sx={{ fontSize: '1.1rem', py: 1.2 }}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
}
