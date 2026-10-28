import { useRef, useEffect, useState, useMemo } from 'react';
import { Box, Typography, ButtonBase, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// Remove diacritical marks and normalize common Arabic letter variants
function normalize(str) {
  return str
    .replace(/[ً-ٰٟ]/g, '') // strip tashkeel / harakat
    .replace(/[أإآ]/g, 'ا')               // normalize alef
    .replace(/ة/g, 'ه')                   // ta marbuta → ha
    .replace(/ى/g, 'ي');                  // alef maqsura → ya
}

export default function VerseGrid({ label, total, value, onChange, min = 1, ayahsMap = {} }) {
  const allOptions = Array.from({ length: total - min + 1 }, (_, i) => i + min);
  const [search, setSearch] = useState('');
  const selectedRef = useRef(null);

  const normalizedSearch = normalize(search.trim());

  const options = normalizedSearch
    ? allOptions.filter((v) => normalize(ayahsMap[v] || '').includes(normalizedSearch))
    : allOptions;

  // Scroll selected verse into view when opened or value changes
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [value]);

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        placeholder="ابحث في الآيات..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
        }}
        sx={{ mb: 0.5, '& input': { fontSize: '0.95rem' } }}
      />
      <Box sx={{
        maxHeight: 200, overflowY: 'auto',
        border: '1px solid', borderColor: 'divider', borderRadius: 2,
      }}>
        {options.length === 0 && (
          <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center', fontSize: '0.9rem' }}>
            لا توجد نتائج
          </Typography>
        )}
        {options.map((v) => {
          const selected = v === value;
          const text = ayahsMap[v] || '';
          const preview = text.length > 60 ? text.slice(0, 60) + '…' : text;

          return (
            <ButtonBase
              key={v}
              ref={selected ? selectedRef : null}
              onClick={() => onChange(v)}
              sx={{
                width: '100%', display: 'flex', alignItems: 'baseline',
                gap: 1.5, px: 1.5, py: 1,
                bgcolor: selected ? 'primary.main' : 'transparent',
                color: selected ? 'white' : 'text.primary',
                borderBottom: '1px solid', borderColor: selected ? 'primary.dark' : 'divider',
                '&:last-child': { borderBottom: 'none' },
                '&:hover': { bgcolor: selected ? 'primary.dark' : 'action.hover' },
                textAlign: 'right', justifyContent: 'flex-start',
                transition: 'background 0.15s',
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontSize: '0.75rem', fontWeight: 700, opacity: 0.7,
                  minWidth: 22, color: 'inherit', flexShrink: 0,
                }}
              >
                {v}
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: '"Noto Naskh Arabic", serif',
                  fontSize: '0.95rem', lineHeight: 1.6, color: 'inherit',
                  textAlign: 'right', direction: 'rtl',
                }}
              >
                {preview || '—'}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
