import { Box, Typography, ButtonBase } from '@mui/material';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { SPEED_OPTIONS } from '../services/speedOptions';

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
  { value: 0, label: null, icon: true, ariaLabel: 'بلا نهاية' },
];

function PillRow({ options, value, onChange, ariaLabel }) {
  return (
    <Box
      role="radiogroup"
      aria-label={ariaLabel}
      sx={(theme) => ({
        display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: 0.75, p: 0.75,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,77,64,0.06)',
        borderRadius: '20px',
      })}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <ButtonBase
            key={opt.value}
            role="radio"
            aria-checked={active}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.value)}
            sx={(theme) => ({
              minHeight: opt.sub ? 64 : 56, borderRadius: '14px',
              display: 'flex', flexDirection: 'column', gap: 0.25,
              fontSize: '1.15rem', fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
              bgcolor: active ? 'primary.main' : 'transparent',
              boxShadow: active
                ? (theme.palette.mode === 'dark'
                    ? '0 4px 10px -2px rgba(0,0,0,0.5)'
                    : '0 4px 10px -2px rgba(0,77,64,0.35)')
                : 'none',
              transition: 'background-color 0.2s, color 0.2s, box-shadow 0.2s',
              '&:hover': { bgcolor: active ? 'primary.main' : 'action.hover' },
            })}
          >
            {opt.icon ? <AllInclusiveIcon sx={{ fontSize: 26 }} /> : opt.label}
            {opt.sub && (
              <Box component="span" dir="ltr" sx={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>
                {opt.sub}
              </Box>
            )}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

function Section({ title, hint, children }) {
  return (
    <Box>
      <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.4 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: '0.98rem', color: 'text.secondary', mt: 0.25, mb: 1.5, lineHeight: 1.6 }}>
        {hint}
      </Typography>
      {children}
    </Box>
  );
}

export default function RepeatSettings({
  verseRepeat, groupRepeat, onVerseRepeatChange, onGroupRepeatChange,
  speed, onSpeedChange,
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Section title="تكرار كل آية" hint="كم مرة تُعاد الآية قبل الانتقال إلى التي بعدها">
        <PillRow
          options={VERSE_OPTIONS}
          value={verseRepeat}
          onChange={onVerseRepeatChange}
          ariaLabel="تكرار كل آية"
        />
      </Section>

      <Section title="تكرار الآيات كلها" hint="كم مرة تُعاد الآيات المختارة من أولها">
        <PillRow
          options={GROUP_OPTIONS}
          value={groupRepeat}
          onChange={onGroupRepeatChange}
          ariaLabel="تكرار الآيات كلها"
        />
      </Section>

      {onSpeedChange && (
        <Section title="سرعة التلاوة" hint="اختر «بطيء» للمتابعة والحفظ بهدوء">
          <PillRow
            options={SPEED_OPTIONS}
            value={speed}
            onChange={onSpeedChange}
            ariaLabel="سرعة التلاوة"
          />
        </Section>
      )}
    </Box>
  );
}
