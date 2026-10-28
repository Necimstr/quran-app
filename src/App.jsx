import { useState, useEffect, useCallback } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Box, Paper,
  CircularProgress, Alert,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { fetchSurahs, fetchReciters, fetchSurahAyahs, RECITERS } from './services/apiService';
import { useQuranPlayer } from './hooks/useQuranPlayer';
import ReciterSelector from './components/ReciterSelector';
import RangeSelector from './components/RangeSelector';
import RepeatSettings from './components/RepeatSettings';
import PlayerControls from './components/PlayerControls';
import OfflineManager from './components/OfflineManager';
import BookmarkManager from './components/BookmarkManager';
import SleepTimer from './components/SleepTimer';

const SESSION_KEY = 'quran_session';

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {}; }
  catch { return {}; }
}
function saveSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function SectionTitle({ children }) {
  return (
    <Typography variant="subtitle1" sx={{
      fontWeight: 700, color: 'text.secondary',
      fontSize: '0.78rem', mb: 1, letterSpacing: 0.3,
    }}>
      {children}
    </Typography>
  );
}

export default function App() {
  const [surahs, setSurahs] = useState([]);
  const [reciters, setReciters] = useState([]);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [loadingReciters, setLoadingReciters] = useState(true);
  const [surahsError, setSurahsError] = useState(null);
  const [ayahsMap, setAyahsMap] = useState({});

  const session = loadSession();

  const [reciter, setReciter] = useState(null);
  const [surah, setSurah] = useState(null);
  const [startVerse, setStartVerse] = useState(session.startVerse || 1);
  const [endVerse, setEndVerse] = useState(session.endVerse || 7);
  const [verseRepeat, setVerseRepeat] = useState(session.verseRepeat || 1);
  const [groupRepeat, setGroupRepeat] = useState(session.groupRepeat || 1);

  // Persist session on every setting change
  useEffect(() => {
    if (!reciter || !surah) return;
    saveSession({ reciterId: reciter.id, surahNumber: surah.number, startVerse, endVerse, verseRepeat, groupRepeat });
  }, [reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat]);

  // Fetch surahs and reciters on mount
  useEffect(() => {
    fetchSurahs()
      .then((data) => {
        setSurahs(data);
        const savedSurah = session.surahNumber
          ? data.find((s) => s.number === session.surahNumber)
          : null;
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

  // Fetch Arabic verse texts when surah changes
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

  // Load a bookmark
  const handleLoadBookmark = useCallback((bm) => {
    const r = reciters.find((x) => x.id === bm.reciterId);
    const s = surahs.find((x) => x.number === bm.surahNumber);
    if (r) setReciter(r);
    if (s) {
      setSurah(s);
      setStartVerse(bm.startVerse);
      setEndVerse(bm.endVerse);
    }
  }, [reciters, surahs]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <MenuBookIcon sx={{ ml: 1.5, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1, letterSpacing: 0.5 }}>
            حفظ القرآن الكريم
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, fontFamily: '"Noto Naskh Arabic", serif', fontSize: '1.1rem' }}>
            بِسْمِ اللَّهِ
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, px: 2 }}>
        {loadingSurahs ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress size={56} />
          </Box>
        ) : surahsError ? (
          <Alert severity="error" sx={{ mt: 4, fontSize: '1rem' }}>{surahsError}</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>مشغّل الصوت</SectionTitle>
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
                onSkipNext={player.skipNext}
                onSkipPrev={player.skipPrev}
                onSpeedChange={player.setSpeed}
                onVolumeChange={player.setVolume}
              />
            </Paper>

            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>القارئ</SectionTitle>
              <ReciterSelector
                reciters={reciters}
                loading={loadingReciters}
                value={reciter}
                onChange={setReciter}
              />
            </Paper>

            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>السورة ونطاق الآيات</SectionTitle>
              <RangeSelector
                surahs={surahs}
                surah={surah}
                startVerse={startVerse}
                endVerse={endVerse}
                onSurahChange={handleSurahChange}
                onStartChange={handleStartChange}
                onEndChange={setEndVerse}
              />
            </Paper>

            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>إعدادات التكرار</SectionTitle>
              <RepeatSettings
                verseRepeat={verseRepeat}
                groupRepeat={groupRepeat}
                onVerseRepeatChange={setVerseRepeat}
                onGroupRepeatChange={setGroupRepeat}
              />
            </Paper>

            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>مؤقت النوم</SectionTitle>
              <SleepTimer onExpire={player.stop} />
            </Paper>

            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>الإشارات المرجعية</SectionTitle>
              <BookmarkManager
                reciter={reciter}
                surah={surah}
                startVerse={startVerse}
                endVerse={endVerse}
                onLoad={handleLoadBookmark}
              />
            </Paper>

            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>الاستماع بدون إنترنت</SectionTitle>
              <OfflineManager
                reciter={reciter}
                surah={surah}
                startVerse={startVerse}
                endVerse={endVerse}
              />
            </Paper>

          </Box>
        )}
      </Container>
    </Box>
  );
}
