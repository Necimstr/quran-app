import { useState } from 'react';
import {
  Box, Button, IconButton, Typography, Chip, Stack,
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
        sx={{ minHeight: 48, fontSize: '0.95rem' }}
      >
        حفظ الإعدادات الحالية كإشارة مرجعية
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
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
          لا توجد إشارات مرجعية محفوظة
        </Typography>
      ) : (
        <Stack spacing={1}>
          {bookmarks.map((bm) => (
            <Box
              key={bm.id}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                border: '1px solid', borderColor: 'divider',
                borderRadius: 2, p: 1.2, cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={() => onLoad(bm)}
            >
              <BookmarkIcon sx={{ color: 'primary.main', fontSize: 20, flexShrink: 0 }} />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                  {bm.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {bm.reciterName}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleDelete(bm.id); }}
                sx={{ color: 'error.main' }}
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
