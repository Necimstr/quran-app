import { useState } from 'react';
import {
  Box, Button, IconButton, Typography, Stack,
  TextField, Collapse,
} from '@mui/material';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import BookmarkIcon from '@mui/icons-material/Bookmark';

const KEY = 'quran_bookmarks';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}
function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export default function BookmarkManager({ reciter, surah, startVerse, endVerse, onLoad }) {
  const [bookmarks, setBookmarks] = useState(load);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const defaultName = surah
    ? `سورة ${surah.name} (${startVerse}–${endVerse})`
    : '';

  function handleSave() {
    const bm = {
      id: Date.now(),
      name: name.trim() || defaultName,
      reciterId: reciter?.id,
      reciterName: reciter?.name,
      surahNumber: surah?.number,
      surahName: surah?.name,
      startVerse,
      endVerse,
    };
    const next = [bm, ...bookmarks];
    save(next);
    setBookmarks(next);
    setAdding(false);
    setName('');
  }

  function handleDelete(id) {
    const next = bookmarks.filter((b) => b.id !== id);
    save(next);
    setBookmarks(next);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Button
        variant="outlined"
        startIcon={<BookmarkAddIcon />}
        onClick={() => { setAdding((v) => !v); setName(''); }}
        disabled={!surah || !reciter}
        sx={{
          minHeight: 52, fontSize: '0.9rem', fontWeight: 700,
          borderWidth: 1.5, '&:hover': { borderWidth: 1.5 },
          justifyContent: 'flex-start', textAlign: 'start', px: 2,
        }}
      >
        حفظ الإعدادات الحالية
      </Button>

      <Collapse in={adding}>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={defaultName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            sx={{ '& input': { fontSize: '0.95rem' } }}
          />
          <Button variant="contained" onClick={handleSave} sx={{ whiteSpace: 'nowrap', minWidth: 64 }}>
            حفظ
          </Button>
        </Box>
      </Collapse>

      {bookmarks.length === 0 ? (
        <Typography sx={{ textAlign: 'center', py: 1.5, color: 'text.secondary', fontSize: '0.85rem', fontStyle: 'italic' }}>
          لا توجد إشارات مرجعية محفوظة
        </Typography>
      ) : (
        <Stack spacing={1}>
          {bookmarks.map((bm) => (
            <Box
              key={bm.id}
              role="button"
              tabIndex={0}
              onClick={() => onLoad(bm)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onLoad(bm)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.25,
                border: '1px solid', borderColor: 'divider',
                borderRadius: 2, p: 1.25, cursor: 'pointer',
                borderInlineStart: '3px solid transparent',
                transition: 'border-color 0.15s, background-color 0.15s, transform 0.15s',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderInlineStartColor: 'primary.main',
                },
                '&:active': { transform: 'scale(0.995)' },
              }}
            >
              <BookmarkIcon sx={{ color: 'primary.main', fontSize: 20, flexShrink: 0 }} />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {bm.name}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 500 }}>
                  {bm.reciterName}
                </Typography>
              </Box>
              <IconButton
                size="small"
                aria-label="حذف الإشارة المرجعية"
                onClick={(e) => { e.stopPropagation(); handleDelete(bm.id); }}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'error.main', bgcolor: 'error.light' },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
