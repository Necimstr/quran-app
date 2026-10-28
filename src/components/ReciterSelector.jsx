import { useState, useMemo } from 'react';
import {
  Box, TextField, List, ListItemButton, ListItemText,
  IconButton, Typography, Divider, CircularProgress, InputAdornment,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import SearchIcon from '@mui/icons-material/Search';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { Chip } from '@mui/material';

const STARRED_KEY = 'quran_starred_reciters';

function getStarred() {
  try { return JSON.parse(localStorage.getItem(STARRED_KEY)) || []; }
  catch { return []; }
}
function saveStarred(ids) {
  localStorage.setItem(STARRED_KEY, JSON.stringify(ids));
}

export default function ReciterSelector({ reciters, loading, value, onChange, cachedByReciter = {}, offline = false }) {
  const [search, setSearch] = useState('');
  const [starred, setStarred] = useState(getStarred);

  function toggleStar(e, id) {
    e.stopPropagation();
    setStarred((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      saveStarred(next);
      return next;
    });
  }

  const sorted = useMemo(() => {
    if (!reciters.length) return [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? reciters.filter((r) => r.name.includes(q) || r.englishName.toLowerCase().includes(q))
      : reciters;
    const starSet = new Set(starred);
    return [
      ...filtered.filter((r) => starSet.has(r.id)),
      ...filtered.filter((r) => !starSet.has(r.id)),
    ];
  }, [reciters, search, starred]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>;
  }

  const availableCount = Object.keys(cachedByReciter).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {offline && (
        <Chip
          icon={<WifiOffIcon />}
          label={availableCount
            ? `غير متصل — ${availableCount} قارئ متاح`
            : 'غير متصل — لا يوجد أي قارئ محفوظ'}
          color={availableCount ? 'warning' : 'error'}
          sx={{ fontSize: '0.9rem', height: 36, alignSelf: 'flex-start' }}
        />
      )}

      <TextField
        fullWidth
        placeholder="ابحث عن قارئ..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ),
        }}
        sx={{ '& input': { fontSize: '1rem' } }}
      />

      <Box sx={{
        maxHeight: 280, overflowY: 'auto', border: '1px solid',
        borderColor: 'divider', borderRadius: 2,
      }}>
        {starred.length > 0 && !search && (
          <>
            <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary', bgcolor: 'grey.50' }}>
              ★ المفضّلة
            </Typography>
            <Divider />
          </>
        )}
        {sorted.length === 0 ? (
          <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
            لا توجد نتائج
          </Typography>
        ) : (
          sorted.map((r, i) => {
            const isStarred = starred.includes(r.id);
            const isSelected = value?.id === r.id;
            const prevStarred = i > 0 && starred.includes(sorted[i - 1]?.id);
            const showDivider = !search && isStarred === false && prevStarred === true;
            const cachedSurahs = cachedByReciter[r.id];
            const hasCache = !!cachedSurahs?.size;
            const disabled = offline && !hasCache;

            return (
              <Box key={r.id}>
                {showDivider && <Divider />}
                <ListItemButton
                  selected={isSelected}
                  onClick={() => onChange(r)}
                  disabled={disabled}
                  sx={{
                    py: 1.2, gap: 1,
                    opacity: disabled ? 0.45 : 1,
                    '&.Mui-disabled': { cursor: 'not-allowed' },
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => toggleStar(e, r.id)}
                    sx={{ color: isStarred ? 'warning.main' : 'action.disabled', p: 0.5 }}
                  >
                    {isStarred ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                  </IconButton>
                  <ListItemText
                    primary={r.name}
                    primaryTypographyProps={{ fontSize: '1rem', fontWeight: isSelected ? 700 : 400 }}
                  />
                  {hasCache ? (
                    <DownloadDoneIcon sx={{ fontSize: 18, color: 'success.main', opacity: 0.9 }} />
                  ) : offline ? (
                    <CloudOffIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  ) : null}
                </ListItemButton>
              </Box>
            );
          })
        )}
      </Box>

      {value && (
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
          المختار: {value.name}
        </Typography>
      )}
    </Box>
  );
}
