import { Box, Typography, ButtonBase } from '@mui/material';

export default function VerseGrid({ label, total, value, onChange, min = 1 }) {
  const options = Array.from({ length: total - min + 1 }, (_, i) => i + min);

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <Box sx={{
        maxHeight: 160, overflowY: 'auto', border: '1px solid',
        borderColor: 'divider', borderRadius: 2, p: 1,
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.5,
      }}>
        {options.map((v) => {
          const selected = v === value;
          return (
            <ButtonBase
              key={v}
              onClick={() => onChange(v)}
              sx={{
                borderRadius: 1.5,
                py: 0.8,
                fontSize: '1rem',
                fontWeight: selected ? 700 : 400,
                bgcolor: selected ? 'primary.main' : 'transparent',
                color: selected ? 'white' : 'text.primary',
                '&:hover': { bgcolor: selected ? 'primary.dark' : 'action.hover' },
                transition: 'background 0.15s',
                minWidth: 0,
              }}
            >
              {v}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
