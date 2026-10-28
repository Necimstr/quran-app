import { useState, useEffect, useCallback, useContext } from 'react';
import { ColorModeContext } from './main.jsx';
import {
  AppBar, Toolbar, Typography, Container, Box, Paper,
  CircularProgress, Alert, Tabs, Tab, IconButton, Tooltip,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import MicIcon from '@mui/icons-material/Mic';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RepeatIcon from '@mui/icons-material/Repeat';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { fetchSurahs, fetchReciters, fetchSurahAyahs } from './services/apiService';
import { useQuranPlayer, listCachedVerses, listCachedByReciter } from './hooks/useQuranPlayer';
import ReciterSelector from './components/ReciterSelector';
import RangeSelector from './components/RangeSelector';
import RepeatSettings from './components/RepeatSettings';
import PlayerControls from './components/PlayerControls';
import OfflineManager from './components/OfflineManager';
import OfflineLibrary from './components/OfflineLibrary';
import BookmarkManager from './components/BookmarkManager';
import InstallPrompt from './components/InstallPrompt';
import HelpDialog from './components/HelpDialog';

const HELP_SEEN_KEY = 'quran_help_seen';

const SESSION_KEY = 'quran_session';

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {}; }
  catch { return {}; }
}
function saveSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export default function App() {
  const colorMode = useContext(ColorModeContext);
  const [surahs, setSurahs] = useState([]);
  const [reciters, setReciters] = useState([]);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [loadingReciters, setLoadingReciters] = useState(true);
  const [surahsError, setSurahsError] = useState(null);
  const [ayahsMap, setAyahsMap] = useState({});
  const [tab, setTab] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const [cachedVerses, setCachedVerses] = useState(new Set());
  const [cachedByReciter, setCachedByReciter] = useState({});
  const [helpOpen, setHelpOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const session = loadSession();

  const [reciter, setReciter] = useState(null);
  const [surah, setSurah] = useState(null);
  const [startVerse, setStartVerse] = useState(session.startVerse || 1);
  const [endVerse, setEndVerse] = useState(session.endVerse || 7);
  const [verseRepeat, setVerseRepeat] = useState(session.verseRepeat || 1);
  const [groupRepeat, setGroupRepeat] = useState(session.groupRepeat || 1);

  useEffect(() => {
    if (!reciter || !surah) return;
    saveSession({ reciterId: reciter.id, surahNumber: surah.number, startVerse, endVerse, verseRepeat, groupRepeat });
  }, [reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat]);

  useEffect(() => {
    fetchSurahs()
      .then((data) => {
        setSurahs(data);
        const savedSurah = session.surahNumber ? data.find((s) => s.number === session.surahNumber) : null;
        const defaultSurah = savedSurah || data[0];
        setSurah(defaultSurah);
        if (!session.endVerse) setEndVerse(defaultSurah.numberOfAyahs);
      })
      .catch(() => setSurahsError('فشل تحميل قائمة السور. تحقق من اتصالك بالإنترنت.'))
      .finally(() => setLoadingSurahs(false));

    fetchReciters()
      .then((data) => {
        setReciters(data);
        const saved = session.reciterId ? data.find((r) => r.id === session.reciterId) : null;
        setReciter(saved || data.find((r) => r.id === 'Alafasy_128kbps') || data[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingReciters(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(HELP_SEEN_KEY)) {
      const t = setTimeout(() => setHintOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const openHelp = useCallback(() => {
    setHelpOpen(true);
    setHintOpen(false);
    localStorage.setItem(HELP_SEEN_KEY, '1');
  }, []);

  const dismissHint = useCallback(() => {
    setHintOpen(false);
    localStorage.setItem(HELP_SEEN_KEY, '1');
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      listCachedVerses(reciter, surah?.number).then((s) => {
        if (!cancelled) setCachedVerses(s);
      });
      listCachedByReciter().then((m) => {
        if (!cancelled) setCachedByReciter(m);
      });
    };
    refresh();
    const onCache = () => refresh();
    window.addEventListener('quran:cache-updated', onCache);
    return () => {
      cancelled = true;
      window.removeEventListener('quran:cache-updated', onCache);
    };
  }, [reciter, surah]);

  useEffect(() => {
    if (!surah) return;
    fetchSurahAyahs(surah.number)
      .then((ayahs) => {
        const map = {};
        ayahs.forEach((a) => { map[a.number] = a.text; });
        setAyahsMap(map);
      })
      .catch(() => {});
  }, [surah?.number]);

  function handleSurahChange(s) {
    setSurah(s);
    setStartVerse(1);
    setEndVerse(s.numberOfAyahs);
  }

  function handleStartChange(v) {
    setStartVerse(v);
    if (v > endVerse) setEndVerse(v);
  }

  const player = useQuranPlayer({ reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat });

  const handleLoadBookmark = useCallback((bm) => {
    const r = reciters.find((x) => x.id === bm.reciterId);
    const s = surahs.find((x) => x.number === bm.surahNumber);
    if (r) setReciter(r);
    if (s) { setSurah(s); setStartVerse(bm.startVerse); setEndVerse(bm.endVerse); }
  }, [reciters, surahs]);

  const TABS = [
    { label: 'القارئ', icon: <MicIcon sx={{ fontSize: 20 }} /> },
    { label: 'السورة', icon: <MenuBookOutlinedIcon sx={{ fontSize: 20 }} /> },
    { label: 'التكرار', icon: <RepeatIcon sx={{ fontSize: 20 }} /> },
    { label: 'المحفوظات', icon: <BookmarkIcon sx={{ fontSize: 20 }} /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.08)',
          }}>
            <MenuBookIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.15, letterSpacing: '0.01em' }}>
              حفظ القرآن الكريم
            </Typography>
            <Typography sx={{
              fontFamily: '"Noto Naskh Arabic", serif',
              opacity: 0.72, fontSize: '0.78rem', lineHeight: 1.2,
            }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Typography>
          </Box>
          <IconButton
            onClick={colorMode.toggle}
            sx={{ color: 'inherit' }}
            aria-label={colorMode.mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {colorMode.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Tooltip
            open={hintOpen}
            onClose={dismissHint}
            title="اضغط هنا لمعرفة كيفية استخدام التطبيق"
            arrow
            placement="bottom"
            PopperProps={{ sx: { '& .MuiTooltip-tooltip': { fontSize: '0.82rem', bgcolor: 'secondary.main' }, '& .MuiTooltip-arrow': { color: 'secondary.main' } } }}
          >
            <IconButton onClick={openHelp} sx={{ color: 'inherit' }} aria-label="المساعدة">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 2, px: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loadingSurahs ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress size={56} />
          </Box>
        ) : surahsError ? (
          <Alert severity="error" sx={{ mt: 4, fontSize: '1rem' }}>{surahsError}</Alert>
        ) : (
          <>
            {/* Player — always visible */}
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <PlayerControls
                isPlaying={player.isPlaying}
                currentVerse={player.currentVerse}
                verseCount={player.verseCount}
                groupCount={player.groupCount}
                verseRepeat={verseRepeat}
                groupRepeat={groupRepeat}
                surah={surah}
                startVerse={startVerse}
                endVerse={endVerse}
                progress={player.progress}
                duration={player.duration}
                loading={player.loading}
                error={player.error}
                verseText={ayahsMap[player.currentVerse] || ''}
                speed={player.speed}
                volume={player.volume}
                onPlay={player.play}
                onPause={player.pause}
                onResume={player.resume}
                onStop={player.stop}
                onSeek={player.seek}
                reciter={reciter}
                onSkipNext={player.skipNext}
                onSkipPrev={player.skipPrev}
                onSpeedChange={player.setSpeed}
                onVolumeChange={player.setVolume}
              />
            </Paper>

            {/* Tab bar */}
            <Paper elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="fullWidth"
                sx={{
                  minHeight: 60,
                  '& .MuiTab-root': {
                    fontSize: '0.78rem',
                    minHeight: 60,
                    gap: 0.4,
                    color: 'text.secondary',
                    transition: 'color 0.2s, background-color 0.2s',
                    '&.Mui-selected': { color: 'primary.main' },
                    '&:hover:not(.Mui-selected)': { color: 'text.primary', bgcolor: 'action.hover' },
                  },
                  '& .MuiTabs-indicator': {
                    height: 3, borderRadius: '2px 2px 0 0',
                    bgcolor: 'primary.main',
                  },
                }}
              >
                {TABS.map((t, i) => (
                  <Tab key={i} label={t.label} icon={t.icon} iconPosition="top" />
                ))}
              </Tabs>
            </Paper>

            {/* Tab content */}
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              {tab === 0 && (
                <ReciterSelector
                  reciters={reciters}
                  loading={loadingReciters}
                  value={reciter}
                  onChange={setReciter}
                  cachedByReciter={cachedByReciter}
                  offline={!online}
                />
              )}
              {tab === 1 && (
                <RangeSelector
                  surahs={surahs}
                  surah={surah}
                  startVerse={startVerse}
                  endVerse={endVerse}
                  ayahsMap={ayahsMap}
                  cachedVerses={cachedVerses}
                  cachedSurahs={reciter ? cachedByReciter[reciter.id] : null}
                  offline={!online}
                  onSurahChange={handleSurahChange}
                  onStartChange={handleStartChange}
                  onEndChange={setEndVerse}
                />
              )}
              {tab === 2 && (
                <RepeatSettings
                  verseRepeat={verseRepeat}
                  groupRepeat={groupRepeat}
                  onVerseRepeatChange={setVerseRepeat}
                  onGroupRepeatChange={setGroupRepeat}
                />
              )}
              {tab === 3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <BookmarkManager
                    reciter={reciter}
                    surah={surah}
                    startVerse={startVerse}
                    endVerse={endVerse}
                    onLoad={handleLoadBookmark}
                  />
                  <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.78rem', mb: 1.5 }}>
                      الاستماع بدون إنترنت
                    </Typography>
                    <OfflineManager
                      reciter={reciter}
                      surah={surah}
                    />
                    <Box sx={{ mt: 2 }}>
                      <OfflineLibrary reciters={reciters} surahs={surahs} />
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          </>
        )}
      </Container>
      <InstallPrompt />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  );
}
