import { useEffect, useState } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, IconButton, Chip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import MicIcon from '@mui/icons-material/Mic';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { listCachedDetailed, deleteCachedSurah, deleteCachedReciter } from '../hooks/useQuranPlayer';

// First contiguous run of saved ayahs, so an incomplete surah still plays fully offline
function playableRange(set) {
  const start = Math.min(...set);
  let end = start;
  while (set.has(end + 1)) end++;
  return { start, end };
}

export default function OfflineLibrary({ reciters = [], surahs = [], activeKey = null, onPlay }) {
  const [data, setData] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      listCachedDetailed().then((m) => { if (!cancelled) setData(m); });
    };
    refresh();
    const onCache = () => refresh();
    window.addEventListener('quran:cache-updated', onCache);
    return () => {
      cancelled = true;
      window.removeEventListener('quran:cache-updated', onCache);
    };
  }, []);

  const reciterById = Object.fromEntries(reciters.map((r) => [r.id, r]));
  const surahByNumber = Object.fromEntries(surahs.map((s) => [s.number, s]));

  const entries = Object.entries(data)
    .map(([rid, surahMap]) => ({
      id: rid,
      name: reciterById[rid]?.name || rid,
      surahMap,
      surahCount: Object.keys(surahMap).length,
      ayahCount: Object.values(surahMap).reduce((n, set) => n + set.size, 0),
    }))
    .sort((a, b) => b.ayahCount - a.ayahCount);

  const handleConfirm = async () => {
    if (!confirm) return;
    if (confirm.type === 'surah') {
      await deleteCachedSurah(confirm.reciterId, confirm.surahNumber);
    } else if (confirm.type === 'reciter') {
      await deleteCachedReciter(confirm.reciterId);
    }
    setConfirm(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Button
        onClick={() => setOpen((v) => !v)}
        variant="outlined"
        endIcon={
          <ExpandMoreIcon sx={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }} />
        }
        sx={{
          justifyContent: 'space-between',
          minHeight: 58,
          fontSize: '1.05rem',
          fontWeight: 800,
          borderRadius: '14px',
          px: 2,
        }}
      >
        <Box sx={{ flexGrow: 1, textAlign: 'start', display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>التلاوات المحفوظة</span>
          {entries.length > 0 && (
            <Chip
              label={`${entries.length} قارئ`}
              size="small"
              color="primary"
              sx={{ height: 26, fontSize: '0.85rem' }}
            />
          )}
        </Box>
      </Button>

      <Collapse in={open} unmountOnExit>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          {entries.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2, fontSize: '1rem' }}>
              لا توجد ملفات محفوظة بعد
            </Typography>
          ) : entries.map((e) => (
        <Accordion
          key={e.id}
          disableGutters
          sx={{
            '&:before': { display: 'none' },
            borderRadius: '16px',
            boxShadow: 0,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: '50%',
                bgcolor: 'primary.main', color: 'primary.contrastText', flexShrink: 0,
              }}>
                <MicIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.08rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.name}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '0.92rem' }}>
                  {e.surahCount} سورة
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setConfirm({ type: 'reciter', reciterId: e.id, name: e.name });
                }}
                sx={{ color: 'error.main' }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense disablePadding>
              {Object.entries(e.surahMap)
                .map(([num, set]) => [Number(num), set])
                .sort((a, b) => a[0] - b[0])
                .map(([num, set]) => {
                  const surah = surahByNumber[num];
                  const total = surah?.numberOfAyahs ?? set.size;
                  const complete = set.size >= total;
                  const active = activeKey === `${e.id}:${num}`;
                  const canPlay = !!onPlay && !!surah && !!reciterById[e.id];
                  const label = surah?.name || `سورة ${num}`;
                  return (
                    <ListItem key={num} divider sx={{ py: 1.25, gap: 0.75, minHeight: 64 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
                              {num}. {label}
                            </Typography>
                            {active && (
                              <Chip
                                label="قيد التشغيل"
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {!complete && (
                              <Chip
                                label="غير مكتملة"
                                size="small"
                                color="warning"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <IconButton
                        disabled={!canPlay}
                        onClick={() => onPlay({ reciterId: e.id, surahNumber: num, ...playableRange(set) })}
                        aria-label={`تشغيل ${label} — ${e.name}`}
                        sx={{ color: 'primary.main', bgcolor: 'action.hover', width: 48, height: 48 }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => setConfirm({
                          type: 'surah',
                          reciterId: e.id,
                          surahNumber: num,
                          name: `${label} (${e.name})`,
                        })}
                        aria-label={`حذف ${label}`}
                        sx={{ color: 'error.main', width: 48, height: 48 }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </ListItem>
                  );
                })}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
        </Box>
      </Collapse>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>
            {confirm?.type === 'reciter'
              ? `هل تريد حذف جميع الملفات المحفوظة للقارئ «${confirm?.name}»؟`
              : `هل تريد حذف «${confirm?.name}» من الذاكرة؟`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>إلغاء</Button>
          <Button color="error" variant="contained" onClick={handleConfirm}>حذف</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
