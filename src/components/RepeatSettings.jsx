import { Box, Typography, ButtonBase } from '@mui/material';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';

const VERSE_OPTIONS = [
  { value: 1, label: '×1' },
  { value: 2, label: '×2' },
  { value: 3, label: '×3' },
  { value: 5, label: '×5' },
  { value: 10, label: '×10' },
];

const GROUP_OPTIONS = [
  { value: 1, label: '×1' },
  { value: 2, label: '×2' },
  { value: 3, label: '×3' },
  { value: 5, label: '×5' },
  { value: 10, label: '×10' },
  { value: 0, label: null, icon: true },
];

function PillRow({ options, value, onChange, ariaLabel }) {
  return (
    <Box
      role="radiogroup"
      aria-label={ariaLabel}
      sx={(theme) => ({
        display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: 0.5, p: 0.5,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        borderRadius: 999,
      })}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <ButtonBase
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            sx={(theme) => ({
              minHeight: 42, borderRadius: 999,
              fontSize: '0.9rem', fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: active ? theme.palette.primary.contrastText : theme.palette.text.secondary,
              bgcolor: active ? 'primary.main' : 'transparent',
              boxShadow: active
                ? (theme.palette.mode === 'dark'
                    ? '0 2px 6px rgba(0,0,0,0.4)'
                    : '0 2px 6px rgba(0,77,64,0.22)')
                : 'none',
              transition: 'background-color 0.2s, color 0.2s, box-shadow 0.2s',
              '&:hover': { color: active ? 'inherit' : theme.palette.text.primary },
            })}
          >
            {opt.icon ? <AllInclusiveIcon sx={{ fontSize: 20 }} /> : opt.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

export default function RepeatSettings({ verseRepeat, groupRepeat, onVerseRepeatChange, onGroupRepeatChange }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
            تكرار كل آية
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
            عدد مرات إعادة الآية الواحدة قبل الانتقال
          </Typography>
        </Box>
        <PillRow
          options={VERSE_OPTIONS}
          value={verseRepeat}
          onChange={onVerseRepeatChange}
          ariaLabel="تكرار كل آية"
        />
      </Box>

      <Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
            تكرار المجموعة
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
            النطاق كاملاً من البداية
          </Typography>
        </Box>
        <PillRow
          options={GROUP_OPTIONS}
          value={groupRepeat}
          onChange={onGroupRepeatChange}
          ariaLabel="تكرار المجموعة"
        />
      </Box>
    </Box>
  );
}
