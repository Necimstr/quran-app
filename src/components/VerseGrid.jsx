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
        color: 'text.primary', fontWeight: 800, mb: 1,
        display: 'block', fontSize: '1.1rem',
      }}>
        {label}
      </Typography>
      <TextField
        fullWidth
        placeholder="ابحث بكلمة من الآية..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
        }}
        sx={{ mb: 1, '& input': { fontSize: '1.05rem' }, '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
      />
      <Box sx={{
        maxHeight: '46vh', overflowY: 'auto',
        border: '1px solid', borderColor: 'divider', borderRadius: '16px',
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
                gap: 1.5, px: 2, py: 1.5, minHeight: 56,
                bgcolor: selected ? 'primary.main' : 'transparent',
                color: selected ? 'primary.contrastText' : 'text.primary',
                opacity: disabled ? 0.4 : 1,
                borderBottom: '1px solid', borderColor: selected ? 'primary.dark' : 'divider',
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
                  fontSize: '1rem', fontWeight: 800,
                  opacity: selected ? 0.95 : 0.65,
                  minWidth: 30, color: 'inherit', flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {v}
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: '"Noto Naskh Arabic", serif',
                  fontSize: '1.15rem', lineHeight: 1.85, color: 'inherit',
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
