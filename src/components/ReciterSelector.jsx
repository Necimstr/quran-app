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
import { Chip } from '@mui/material';
import { QIRAA_COLORS } from '../services/apiService';

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
          px: 1.5, py: 1, borderRadius: 2,
          bgcolor: availableCount ? 'warning.light' : 'error.light',
          color: availableCount ? 'warning.dark' : 'error.dark',
          border: '1px solid',
          borderColor: availableCount ? 'warning.main' : 'error.main',
          opacity: 0.95,
        }}>
          <WifiOffIcon sx={{ fontSize: 18, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3 }}>
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
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ),
        }}
        sx={{ '& input': { fontSize: '1rem' } }}
      />

      <Box sx={{
        maxHeight: 320, overflowY: 'auto', border: '1px solid',
        borderColor: 'divider', borderRadius: 2,
        bgcolor: 'background.paper',
      }}>
        {starred.length > 0 && !search && (
          <Typography variant="caption" sx={{
            px: 2, py: 0.75, display: 'block',
            color: 'text.secondary', fontWeight: 700, fontSize: '0.68rem',
            letterSpacing: '0.08em', textTransform: 'uppercase',
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
                    py: 1.1, gap: 1,
                    opacity: disabled ? 0.45 : 1,
                    borderInlineStart: '3px solid transparent',
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                      borderInlineStartColor: 'primary.main',
                    },
                    '&.Mui-selected:hover': { bgcolor: 'action.selected' },
                    '&.Mui-disabled': { cursor: 'not-allowed' },
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => toggleStar(e, r.id)}
                    aria-label={isStarred ? 'إزالة من المفضّلة' : 'إضافة إلى المفضّلة'}
                    sx={{ color: isStarred ? 'warning.main' : 'action.disabled', p: 0.5 }}
                  >
                    {isStarred ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                  </IconButton>
                  <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{
                      fontSize: '0.98rem',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'primary.main' : 'text.primary',
                      lineHeight: 1.3,
                    }}>
                      {r.name}
                    </Typography>
                    {r.qiraa && (
                      <Chip
                        label={r.qiraa}
                        size="small"
                        color={QIRAA_COLORS[r.qiraa] || 'default'}
                        variant={QIRAA_COLORS[r.qiraa] === 'default' ? 'outlined' : 'filled'}
                        sx={{
                          height: 18, fontSize: '0.65rem', fontWeight: 500,
                          '& .MuiChip-label': { px: 0.9 },
                          ...(QIRAA_COLORS[r.qiraa] === 'default' && {
                            borderColor: 'divider',
                            color: 'text.secondary',
                          }),
                        }}
                      />
                    )}
                  </Box>
                  {hasCache ? (
                    <DownloadDoneIcon sx={{ fontSize: 17, color: 'success.main', opacity: 0.85, flexShrink: 0 }} />
                  ) : offline ? (
                    <CloudOffIcon sx={{ fontSize: 17, color: 'text.disabled', flexShrink: 0 }} />
                  ) : null}
                </ListItemButton>
              </Box>
            );
          })
        )}
      </Box>

      {value && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
          px: 1.25, py: 0.75, borderRadius: 2,
          bgcolor: 'action.hover',
        }}>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 500 }}>
            المختار
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'primary.main' }}>
            {value.name}
          </Typography>
          {value.qiraa && (
            <Chip
              label={value.qiraa}
              size="small"
              color={QIRAA_COLORS[value.qiraa] || 'default'}
              variant={QIRAA_COLORS[value.qiraa] === 'default' ? 'outlined' : 'filled'}
              sx={{
                height: 18, fontSize: '0.65rem',
                '& .MuiChip-label': { px: 0.9 },
                ...(QIRAA_COLORS[value.qiraa] === 'default' && {
                  borderColor: 'divider',
                  color: 'text.secondary',
                }),
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
