import { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Container, Box, Paper,
  Divider, CircularProgress, Alert,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { fetchSurahs, RECITERS } from './services/apiService';
import { useQuranPlayer } from './hooks/useQuranPlayer';
import ReciterSelector from './components/ReciterSelector';
import RangeSelector from './components/RangeSelector';
import RepeatSettings from './components/RepeatSettings';
import PlayerControls from './components/PlayerControls';
import OfflineManager from './components/OfflineManager';

function SectionTitle({ children }) {
  return (
    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.8rem', mb: 1 }}>
      {children}
    </Typography>
  );
}

export default function App() {
  const [surahs, setSurahs] = useState([]);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [surahsError, setSurahsError] = useState(null);

  const [reciter, setReciter] = useState(RECITERS[0]);
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
      .catch(() => setSurahsError('Failed to load Surah list. Check your connection.'))
      .finally(() => setLoadingSurahs(false));
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <MenuBookIcon sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1, letterSpacing: 0.5 }}>
            Quran Memorization
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, fontFamily: 'serif', fontSize: '1rem' }}>
            القرآن الكريم
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

            {/* Player Controls — always on top for quick access */}
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>Player</SectionTitle>
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

            {/* Reciter */}
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>Reciter</SectionTitle>
              <ReciterSelector value={reciter} onChange={setReciter} />
            </Paper>

            {/* Surah & Verse Range */}
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>Surah & Verse Range</SectionTitle>
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

            {/* Repetition */}
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>Repetition</SectionTitle>
              <RepeatSettings
                verseRepeat={verseRepeat}
                groupRepeat={groupRepeat}
                onVerseRepeatChange={setVerseRepeat}
                onGroupRepeatChange={setGroupRepeat}
              />
            </Paper>

            {/* Offline */}
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
              <SectionTitle>Offline Access</SectionTitle>
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
