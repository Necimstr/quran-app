import { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Box, Paper,
  CircularProgress, Alert,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { fetchSurahs, fetchReciters } from './services/apiService';
import { useQuranPlayer } from './hooks/useQuranPlayer';
import ReciterSelector from './components/ReciterSelector';
import RangeSelector from './components/RangeSelector';
import RepeatSettings from './components/RepeatSettings';
import PlayerControls from './components/PlayerControls';
import OfflineManager from './components/OfflineManager';

function SectionTitle({ children }) {
  return (
    <Typography variant="subtitle1" sx={{
      fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5,
      fontSize: '0.78rem', mb: 1,
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

  const [reciter, setReciter] = useState(null);
  const [surah, setSurah] = useState(null);
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(7);
  const [verseRepeat, setVerseRepeat] = useState(1);
  const [groupRepeat, setGroupRepeat] = useState(1);

  useEffect(() => {
    fetchSurahs()
      .then((data) => {
        setSurahs(data);
        setSurah(data[0]);
        setEndVerse(data[0].numberOfAyahs);
      })
      .catch(() => setSurahsError('فشل تحميل قائمة السور. تحقق من اتصالك بالإنترنت.'))
      .finally(() => setLoadingSurahs(false));

    fetchReciters()
      .then((data) => {
        setReciters(data);
        setReciter(data.find((r) => r.id === 'ar.alafasy') || data[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingReciters(false));
  }, []);

  function handleSurahChange(s) {
    setSurah(s);
    setStartVerse(1);
    setEndVerse(s.numberOfAyahs);
  }

  function handleStartChange(v) {
    setStartVerse(v);
    if (v > endVerse) setEndVerse(v);
  }

  const player = useQuranPlayer({
    reciter, surah, startVerse, endVerse, verseRepeat, groupRepeat,
  });

  const loading = loadingSurahs;

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
        {loading ? (
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
                onPlay={player.play}
                onPause={player.pause}
                onResume={player.resume}
                onStop={player.stop}
                onSeek={player.seek}
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
