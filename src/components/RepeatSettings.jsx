import { Box, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';

const VERSE_OPTIONS = [1, 2, 3, 5, 10];
const GROUP_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 0, label: '∞ Continuous' },
];

export default function RepeatSettings({ verseRepeat, groupRepeat, onVerseRepeatChange, onGroupRepeatChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel sx={{ fontSize: '1.1rem' }}>Repeat each verse</InputLabel>
        <Select
          value={verseRepeat}
          label="Repeat each verse"
          onChange={(e) => onVerseRepeatChange(e.target.value)}
          sx={{ fontSize: '1.1rem', minHeight: 56 }}
        >
          {VERSE_OPTIONS.map((v) => (
            <MenuItem key={v} value={v} sx={{ fontSize: '1.15rem', py: 1.3 }}>
              {v} {v === 1 ? 'time' : 'times'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel sx={{ fontSize: '1.1rem' }}>Repeat whole group</InputLabel>
        <Select
          value={groupRepeat}
          label="Repeat whole group"
          onChange={(e) => onGroupRepeatChange(e.target.value)}
          sx={{ fontSize: '1.1rem', minHeight: 56 }}
        >
          {GROUP_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '1.15rem', py: 1.3 }}>
              {opt.label} {opt.value === 1 ? 'time' : opt.value === 0 ? '' : 'times'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
