import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const VERSE_OPTIONS = [1, 2, 3, 5, 10];
const GROUP_OPTIONS = [
  { value: 1, label: 'مرة واحدة' },
  { value: 2, label: 'مرتان' },
  { value: 3, label: '٣ مرات' },
  { value: 5, label: '٥ مرات' },
  { value: 10, label: '١٠ مرات' },
  { value: 0, label: '∞ بشكل مستمر' },
];

const VERSE_LABELS = {
  1: 'مرة واحدة',
  2: 'مرتان',
  3: '٣ مرات',
  5: '٥ مرات',
  10: '١٠ مرات',
};

export default function RepeatSettings({ verseRepeat, groupRepeat, onVerseRepeatChange, onGroupRepeatChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel sx={{ fontSize: '1.1rem' }}>تكرار كل آية</InputLabel>
        <Select
          value={verseRepeat}
          label="تكرار كل آية"
          onChange={(e) => onVerseRepeatChange(e.target.value)}
          sx={{ fontSize: '1.1rem', minHeight: 56 }}
        >
          {VERSE_OPTIONS.map((v) => (
            <MenuItem key={v} value={v} sx={{ fontSize: '1.15rem', py: 1.3 }}>
              {VERSE_LABELS[v]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel sx={{ fontSize: '1.1rem' }}>تكرار المجموعة كاملة</InputLabel>
        <Select
          value={groupRepeat}
          label="تكرار المجموعة كاملة"
          onChange={(e) => onGroupRepeatChange(e.target.value)}
          sx={{ fontSize: '1.1rem', minHeight: 56 }}
        >
          {GROUP_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '1.15rem', py: 1.3 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
