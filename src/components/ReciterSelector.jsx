import { useState, useMemo } from 'react';
import {
  Box, TextField, ListItemButton,
  IconButton, Typography, Divider, CircularProgress, InputAdornment,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import SearchIcon from '@mui/icons-material/Search';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Chip } from '@mui/material';
import { QIRAA_COLORS } from '../services/apiService';

const STARRED_KEY = 'quran_starred_reciters';
const DEFAULT_QIRAA = 'حفص عن عاصم';

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
      ? reciters.filter((r) => r.name?.includes(q) || r.englishName?.toLowerCase().includes(q))
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
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.25,
          px: 1.5, py: 1, borderRadius: '14px',
          bgcolor: availableCount ? 'warning.light' : 'error.light',
          color: availableCount ? 'warning.dark' : 'error.dark',
          border: '1px solid',
          borderColor: availableCount ? 'warning.main' : 'error.main',
          opacity: 0.95,
        }}>
          <WifiOffIcon sx={{ fontSize: 18, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.98rem', fontWeight: 600, lineHeight: 1.5 }}>
            {availableCount === 0
              ? 'غير متصل · لا يوجد قارئ محفوظ'
              : availableCount === 1
              ? 'غير متصل · قارئ واحد متاح'
              : `غير متصل · ${availableCount} قراء متاحون`}
          </Typography>
        </Box>
      )}

      <TextField
        fullWidth
        placeholder="ابحث عن قارئ..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ),
        }}
        sx={{ '& input': { fontSize: '1.1rem', py: 1.75 }, '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: 'background.paper' } }}
      />

      <Box sx={{
        border: '1px solid', borderColor: 'divider', borderRadius: '20px',
        overflow: 'hidden', bgcolor: 'background.paper',
      }}>
        {starred.length > 0 && !search && (
          <Typography variant="caption" sx={{
            px: 2, py: 1, display: 'block',
            color: 'text.secondary', fontWeight: 700, fontSize: '0.9rem',
            borderBottom: '1px solid', borderColor: 'divider',
            bgcolor: 'action.hover',
          }}>
            المفضّلة
          </Typography>
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
                    py: 1.5, px: 1.5, gap: 1.25, minHeight: 68,
                    opacity: disabled ? 0.45 : 1,
                    '&.Mui-selected': { bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(77,182,172,0.14)' : 'rgba(0,105,92,0.08)') },
                    '&.Mui-selected:hover': { bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(77,182,172,0.18)' : 'rgba(0,105,92,0.12)') },
                    '&.Mui-disabled': { cursor: 'not-allowed' },
                  }}
                >
                  <IconButton
                    onClick={(e) => toggleStar(e, r.id)}
                    aria-label={isStarred ? 'إزالة من المفضّلة' : 'إضافة إلى المفضّلة'}
                    sx={{ color: isStarred ? 'warning.main' : 'text.disabled', width: 44, height: 44 }}
                  >
                    {isStarred ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                  <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{
                      fontSize: '1.12rem',
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? 'primary.main' : 'text.primary',
                      lineHeight: 1.3,
                    }}>
                      {r.name}
                    </Typography>
                    {/* Only mark the exception: nearly every reciter is Hafs */}
                    {r.qiraa && r.qiraa !== DEFAULT_QIRAA && (
                      <Chip
                        label={r.qiraa}
                        size="small"
                        color={QIRAA_COLORS[r.qiraa] || 'default'}
                        variant={QIRAA_COLORS[r.qiraa] === 'default' ? 'outlined' : 'filled'}
                        sx={{
                          height: 24, fontSize: '0.82rem', fontWeight: 600,
                          '& .MuiChip-label': { px: 0.9 },
                          ...(QIRAA_COLORS[r.qiraa] === 'default' && {
                            borderColor: 'divider',
                            color: 'text.secondary',
                          }),
                        }}
                      />
                    )}
                  </Box>
                  {isSelected && (
                    <CheckCircleIcon sx={{ fontSize: 28, color: 'primary.main', flexShrink: 0 }} />
                  )}
                  {hasCache ? (
                    <DownloadDoneIcon sx={{ fontSize: 20, color: 'success.main', opacity: 0.85, flexShrink: 0 }} />
                  ) : offline ? (
                    <CloudOffIcon sx={{ fontSize: 20, color: 'text.disabled', flexShrink: 0 }} />
                  ) : null}
                </ListItemButton>
              </Box>
            );
          })
        )}
      </Box>

    </Box>
  );
}
