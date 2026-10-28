import { useState, useEffect, useCallback, useContext } from 'react';
import { ColorModeContext } from './main.jsx';
import {
  AppBar, Toolbar, Typography, Container, Box,
  CircularProgress, Alert, IconButton, Tooltip,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import MicIcon from '@mui/icons-material/Mic';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RepeatIcon from '@mui/icons-material/Repeat';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { fetchSurahs, fetchReciters, fetchSurahAyahs, surahTitle } from './services/apiService';
import { useQuranPlayer, listCachedVerses, listCachedByReciter } from './hooks/useQuranPlayer';
import ReciterSelector from './components/ReciterSelector';
import RangeSelector from './components/RangeSelector';
import RepeatSettings from './components/RepeatSettings';
import { speedLabel } from './services/speedOptions';
import SettingsList, { SettingRow } from './components/SettingsList';
import SettingsSheet from './components/SettingsSheet';
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
  const [sheet, setSheet] = useState(null); // 'reciter' | 'surah' | 'repeat' | 'saved'
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
  const [groupRepeat, setGroupRepeat] = useState(session.groupRepeat ?? 1);

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

  // Play a saved surah from the offline library through the same player
  // (same audio element, so lock-screen / background playback applies too).
  // Playback starts in an effect, after the new selection has reached the player.
  const [playRequest, setPlayRequest] = useState(0);
  const { play: playerPlay, stop: playerStop } = player;
  const handlePlayOffline = useCallback(({ reciterId, surahNumber, start, end }) => {
    const r = reciters.find((x) => x.id === reciterId);
    const s = surahs.find((x) => x.number === surahNumber);
    if (!r || !s) return;
    playerStop();
    setReciter(r);
    setSurah(s);
    setStartVerse(start);
    setEndVerse(end);
    setPlayRequest((n) => n + 1);
    setSheet(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reciters, surahs, playerStop]);

  useEffect(() => {
    if (playRequest) playerPlay();
  }, [playRequest, playerPlay]);

  const closeSheet = useCallback(() => setSheet(null), []);

  const totalAyahs = surah?.numberOfAyahs || 0;
  const wholeSurah = surah && startVerse === 1 && endVerse === totalAyahs;
  const surahSaved = surah && cachedVerses.size >= totalAyahs;
  const verseRepeatText = verseRepeat === 1 ? 'بدون تكرار' : `كل آية ×${verseRepeat}`;
  const groupRepeatText = groupRepeat === 0 ? 'بلا نهاية' : groupRepeat === 1 ? 'مرة واحدة' : `×${groupRepeat}`;

  const headerIconSx = {
    color: 'inherit', width: 48, height: 48,
    bgcolor: 'rgba(255,255,255,0.1)',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1.25, minHeight: { xs: 72 } }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            bgcolor: 'rgba(255,255,255,0.1)',
          }}>
            <MenuBookIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography component="p" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.35 }}>
              حفظ القرآن الكريم
            </Typography>
            <Typography sx={{
              fontFamily: '"Noto Naskh Arabic", serif',
              opacity: 0.85, fontSize: '0.92rem', lineHeight: 1.5,
            }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Typography>
          </Box>
          <IconButton
            onClick={colorMode.toggle}
            sx={headerIconSx}
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
            PopperProps={{ sx: { '& .MuiTooltip-tooltip': { fontSize: '0.95rem', bgcolor: 'secondary.main' }, '& .MuiTooltip-arrow': { color: 'secondary.main' } } }}
          >
            <IconButton onClick={openHelp} sx={headerIconSx} aria-label="المساعدة">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {!online && (
        <Box role="status" sx={(t) => ({
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
          mx: 2, mt: 2, px: 2, py: 1.25, borderRadius: '14px',
          fontSize: '0.98rem', fontWeight: 600, textAlign: 'center',
          bgcolor: t.palette.mode === 'dark' ? 'rgba(255,183,77,0.12)' : '#fff4e0',
          color: t.palette.mode === 'dark' ? '#ffcc80' : '#7a4300',
        })}>
          <WifiOffIcon sx={{ fontSize: 22 }} />
          غير متصل بالإنترنت · يمكنك الاستماع إلى السور المحفوظة
        </Box>
      )}

      <Container maxWidth="sm" sx={{ py: 3, px: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loadingSurahs ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress size={56} />
          </Box>
        ) : surahsError ? (
          <Alert severity="error" sx={{ mt: 4, fontSize: '1.05rem' }}>{surahsError}</Alert>
        ) : (
          <>
            <PlayerControls
              isPlaying={player.isPlaying}
              isActive={player.isActive}
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
              preparing={player.preparing}
              error={player.error}
              verseText={ayahsMap[player.currentVerse] || ''}
              reciter={reciter}
              onPlay={player.play}
              onPause={player.pause}
              onResume={player.resume}
              onStop={player.stop}
              onSkipNext={player.skipNext}
              onSkipPrev={player.skipPrev}
            />

            <SettingsList title="إعدادات التلاوة">
              <SettingRow
                icon={<MicIcon />}
                label="القارئ"
                value={reciter?.name || 'اختر القارئ'}
                detail={reciter?.qiraa ? `رواية ${reciter.qiraa}` : null}
                onClick={() => setSheet('reciter')}
              />
              <SettingRow
                icon={<MenuBookOutlinedIcon />}
                label="السورة والآيات"
                value={surah ? `سورة ${surahTitle(surah)}` : 'اختر السورة'}
                detail={surah ? (wholeSurah
                  ? `السورة كاملة · ${totalAyahs} آية`
                  : `من الآية ${startVerse} إلى الآية ${endVerse}`) : null}
                onClick={() => setSheet('surah')}
              />
              <SettingRow
                icon={<RepeatIcon />}
                label="التكرار والسرعة"
                value={verseRepeatText}
                detail={groupRepeat === 1
                  ? speedLabel(player.speed)
                  : `المجموعة ${groupRepeatText} · ${speedLabel(player.speed)}`}
                onClick={() => setSheet('repeat')}
              />
              <SettingRow
                icon={<BookmarkIcon />}
                label="المحفوظات"
                value="الإشارات والتنزيل"
                detail={surahSaved ? 'السورة الحالية محفوظة' : 'للاستماع دون إنترنت'}
                onClick={() => setSheet('saved')}
              />
            </SettingsList>
          </>
        )}
      </Container>

      <SettingsSheet open={sheet === 'reciter'} onClose={closeSheet} title="اختر القارئ" icon={<MicIcon />}>
        <ReciterSelector
          reciters={reciters}
          loading={loadingReciters}
          value={reciter}
          onChange={(r) => { setReciter(r); setTimeout(closeSheet, 250); }}
          cachedByReciter={cachedByReciter}
          offline={!online}
        />
      </SettingsSheet>

      <SettingsSheet open={sheet === 'surah'} onClose={closeSheet} title="السورة والآيات" icon={<MenuBookOutlinedIcon />}>
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
      </SettingsSheet>

      <SettingsSheet open={sheet === 'repeat'} onClose={closeSheet} title="التكرار والسرعة" icon={<RepeatIcon />}>
        <RepeatSettings
          verseRepeat={verseRepeat}
          groupRepeat={groupRepeat}
          onVerseRepeatChange={setVerseRepeat}
          onGroupRepeatChange={setGroupRepeat}
          speed={player.speed}
          onSpeedChange={player.setSpeed}
        />
      </SettingsSheet>

      <SettingsSheet open={sheet === 'saved'} onClose={closeSheet} title="المحفوظات والتنزيل" icon={<BookmarkIcon />}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box>
            <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.15rem', mb: 1.5 }}>
              الإشارات المرجعية
            </Typography>
            <BookmarkManager
              reciter={reciter}
              surah={surah}
              startVerse={startVerse}
              endVerse={endVerse}
              onLoad={(bm) => { handleLoadBookmark(bm); closeSheet(); }}
            />
          </Box>
          <Box>
            <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.15rem', mb: 0.5 }}>
              الاستماع بدون إنترنت
            </Typography>
            <Typography sx={{ fontSize: '0.98rem', color: 'text.secondary', mb: 1.5, lineHeight: 1.6 }}>
              حمّل السورة مرة واحدة، ثم استمع إليها في أي وقت دون اتصال.
            </Typography>
            <OfflineManager reciter={reciter} surah={surah} />
            <Box sx={{ mt: 2 }}>
              <OfflineLibrary
                reciters={reciters}
                surahs={surahs}
                activeKey={player.isActive && reciter && surah ? `${reciter.id}:${surah.number}` : null}
                onPlay={handlePlayOffline}
              />
            </Box>
          </Box>
        </Box>
      </SettingsSheet>

      <InstallPrompt />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  );
}
