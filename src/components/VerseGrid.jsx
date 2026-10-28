import { useRef, useEffect, useState } from 'react';
import { Box, Typography, ButtonBase, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloudOffIcon from '@mui/icons-material/CloudOff';

// Remove diacritical marks and normalize common Arabic letter variants
function normalize(str) {
  return str
    .replace(/[ً-ٰٟ]/g, '') // strip tashkeel / harakat
    .replace(/[أإآ]/g, 'ا')               // normalize alef
    .replace(/ة/g, 'ه')                   // ta marbuta → ha
    .replace(/ى/g, 'ي');                  // alef maqsura → ya
}

export default function VerseGrid({ label, total, value, onChange, min = 1, ayahsMap = {}, cachedVerses, disableUncached = false }) {
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
      <Typography sx={{
        color: 'text.secondary', fontWeight: 700, mb: 0.75,
        display: 'block', fontSize: '0.7rem',
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
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
        sx={{ mb: 0.75, '& input': { fontSize: '0.92rem' } }}
      />
      <Box sx={{
        maxHeight: 220, overflowY: 'auto',
        border: '1px solid', borderColor: 'divider', borderRadius: 2,
        bgcolor: 'background.paper',
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
          const isCached = cachedVerses?.has(v);
          const disabled = disableUncached && !isCached;

          return (
            <ButtonBase
              key={v}
              ref={selected ? selectedRef : null}
              onClick={() => onChange(v)}
              disabled={disabled}
              sx={{
                width: '100%', display: 'flex', alignItems: 'baseline',
                gap: 1.25, px: 1.5, py: 1,
                bgcolor: selected ? 'primary.main' : 'transparent',
                color: selected ? 'primary.contrastText' : 'text.primary',
                opacity: disabled ? 0.4 : 1,
                borderBottom: '1px solid', borderColor: selected ? 'primary.dark' : 'divider',
                borderInlineStart: '3px solid transparent',
                borderInlineStartColor: selected ? 'primary.dark' : 'transparent',
                '&:last-child': { borderBottom: 'none' },
                '&:hover': { bgcolor: selected ? 'primary.dark' : 'action.hover' },
                '&.Mui-disabled': { cursor: 'not-allowed' },
                textAlign: 'right', justifyContent: 'flex-start',
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontSize: '0.72rem', fontWeight: 700,
                  opacity: selected ? 0.9 : 0.55,
                  minWidth: 22, color: 'inherit', flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {v}
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: '"Noto Naskh Arabic", serif',
                  fontSize: '0.95rem', lineHeight: 1.65, color: 'inherit',
                  textAlign: 'right', direction: 'rtl',
                  flexGrow: 1,
                }}
              >
                {preview || '—'}
              </Typography>
              {cachedVerses && !isCached && disableUncached && (
                <CloudOffIcon sx={{ fontSize: 15, color: 'inherit', opacity: 0.5, flexShrink: 0 }} />
              )}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
