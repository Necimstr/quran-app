import { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Button,
} from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import DownloadDoneIcon from "@mui/icons-material/DownloadDone";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import VerseGrid from "./VerseGrid";

export default function RangeSelector({
  surahs,
  surah,
  startVerse,
  endVerse,
  onSurahChange,
  onStartChange,
  onEndChange,
  ayahsMap = {},
  cachedVerses,
  cachedSurahs,
  offline = false,
}) {
  const totalVerses = surah?.numberOfAyahs || 1;
  const [step, setStep] = useState('idle'); // 'idle' | 'start' | 'end'
  const [pendingStart, setPendingStart] = useState(startVerse);
  const [pendingEnd, setPendingEnd] = useState(endVerse);

  // Reset wizard when surah changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep('idle');
    setPendingStart(startVerse);
    setPendingEnd(endVerse);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah?.number]);

  function beginEdit() {
    setPendingStart(startVerse);
    setPendingEnd(endVerse);
    setStep('start');
  }

  function confirmStart() {
    const newEnd = pendingEnd < pendingStart ? pendingStart : pendingEnd;
    setPendingEnd(newEnd);
    setStep('end');
  }

  function confirmEnd() {
    onStartChange(pendingStart);
    onEndChange(pendingEnd);
    setStep('idle');
  }

  function cancelEdit() {
    setStep('idle');
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {offline && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.25,
          px: 1.5, py: 1, borderRadius: '14px',
          bgcolor: cachedSurahs?.size ? 'warning.light' : 'error.light',
          color: cachedSurahs?.size ? 'warning.dark' : 'error.dark',
          border: '1px solid',
          borderColor: cachedSurahs?.size ? 'warning.main' : 'error.main',
          opacity: 0.95,
        }}>
          <WifiOffIcon sx={{ fontSize: 18, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.98rem', fontWeight: 600, lineHeight: 1.5 }}>
            {!cachedSurahs?.size
              ? 'غير متصل · لا توجد سور محفوظة لهذا القارئ'
              : cachedSurahs.size === 1
              ? 'غير متصل · سورة واحدة محفوظة'
              : `غير متصل · ${cachedSurahs.size} سور محفوظة`}
          </Typography>
        </Box>
      )}

      <FormControl fullWidth>
        <InputLabel sx={{ fontSize: "1.15rem" }}>السورة</InputLabel>
        <Select
          value={surah?.number || ""}
          label="السورة"
          onChange={(e) => {
            const s = surahs.find((s) => s.number === e.target.value);
            onSurahChange(s);
          }}
          sx={{ fontSize: "1.2rem", fontWeight: 700, minHeight: 64, borderRadius: '14px', bgcolor: "background.paper" }}
          MenuProps={{ slotProps: { paper: { sx: { maxHeight: "60vh" } } } }}
        >
          {surahs.map((s) => {
            const isCached = cachedSurahs?.has(s.number);
            const disabled = offline && !isCached;
            return (
              <MenuItem
                key={s.number}
                value={s.number}
                disabled={disabled}
                sx={{ fontSize: "1.05rem", py: 1.5, opacity: disabled ? 0.5 : 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
                  <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                    {s.number}. {s.name}
                  </Typography>
                  {isCached ? (
                    <DownloadDoneIcon sx={{ fontSize: 20, color: "success.main" }} />
                  ) : offline ? (
                    <CloudOffIcon sx={{ fontSize: 20, color: "text.disabled" }} />
                  ) : null}
                  <Typography sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
                    {s.englishName}
                  </Typography>
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {step === 'idle' ? (
        <RangeSummary
          startVerse={startVerse}
          endVerse={endVerse}
          startText={ayahsMap[startVerse]}
          endText={ayahsMap[endVerse]}
          onEdit={beginEdit}
          isWhole={startVerse === 1 && endVerse === totalVerses}
          onWhole={() => { onStartChange(1); onEndChange(totalVerses); }}
        />
      ) : (
        <WizardPanel
          step={step}
          pendingStart={pendingStart}
          pendingEnd={pendingEnd}
          onBack={step === 'end' ? () => setStep('start') : cancelEdit}
        >
          {step === 'start' ? (
            <VerseGrid
              label="اختر الآية الأولى"
              total={totalVerses}
              value={pendingStart}
              ayahsMap={ayahsMap}
              cachedVerses={cachedVerses}
              disableUncached={offline}
              onChange={setPendingStart}
            />
          ) : (
            <VerseGrid
              label="اختر الآية الأخيرة"
              total={totalVerses}
              value={pendingEnd}
              min={pendingStart}
              ayahsMap={ayahsMap}
              cachedVerses={cachedVerses}
              disableUncached={offline}
              onChange={setPendingEnd}
            />
          )}

          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Button
              variant="outlined"
              onClick={step === 'end' ? () => setStep('start') : cancelEdit}
              startIcon={<ArrowBackIcon sx={{ transform: 'scaleX(-1)' }} />}
              size="large"
              sx={{ fontWeight: 700, px: 2.5 }}
            >
              {step === 'end' ? 'رجوع' : 'إلغاء'}
            </Button>
            <Button
              variant="contained"
              onClick={step === 'start' ? confirmStart : confirmEnd}
              endIcon={<CheckIcon />}
              fullWidth
              size="large"
              sx={{ fontWeight: 800 }}
            >
              {step === 'start' ? 'التالي: آية النهاية' : 'تأكيد الآيات'}
            </Button>
          </Box>
        </WizardPanel>
      )}
    </Box>
  );
}

function RangeSummary({ startVerse, endVerse, startText, endText, onEdit, isWhole, onWhole }) {
  const preview = (t) => t && t.length > 55 ? t.slice(0, 55) + '…' : t;
  return (
    <Box sx={{
      border: '1px solid', borderColor: 'divider', borderRadius: '20px',
      overflow: 'hidden', bgcolor: 'background.paper',
    }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1.25,
        bgcolor: 'action.hover',
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <Typography sx={{
          fontSize: '1.02rem', fontWeight: 800,
          color: 'text.primary',
        }}>
          الآيات المختارة
        </Typography>
        <Button
          variant="outlined"
          onClick={onEdit}
          startIcon={<EditOutlinedIcon />}
          sx={{ fontSize: '1rem', fontWeight: 800, minHeight: 44, borderRadius: 999, px: 2 }}
        >
          تغيير
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
        <RangeEnd label="من الآية" number={startVerse} text={preview(startText)} />
        <Box sx={{
          width: 1, height: '70%',
          bgcolor: 'divider',
        }} />
        <RangeEnd label="إلى الآية" number={endVerse} text={preview(endText)} />
      </Box>
      {!isWhole && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Button fullWidth onClick={onWhole} sx={{ bgcolor: 'action.hover', fontSize: '1rem' }}>
            اختيار السورة كاملة
          </Button>
        </Box>
      )}
    </Box>
  );
}

function RangeEnd({ label, number, text }) {
  return (
    <Box sx={{ p: 2, textAlign: 'center', minWidth: 0 }}>
      <Typography sx={{
        fontSize: '0.95rem', fontWeight: 700,
        color: 'text.secondary', mb: 0.75,
      }}>
        {label}
      </Typography>
      <Typography sx={{
        fontSize: '2.2rem', fontWeight: 800, color: 'primary.main',
        lineHeight: 1, fontVariantNumeric: 'tabular-nums',
      }}>
        {number}
      </Typography>
      {text && (
        <Typography sx={{
          fontFamily: '"Noto Naskh Arabic", serif',
          fontSize: '1rem', lineHeight: 1.75, color: 'text.secondary',
          mt: 1, overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {text}
        </Typography>
      )}
    </Box>
  );
}

function WizardPanel({ step, pendingStart, children }) {
  return (
    <Box sx={{
      border: '1px solid', borderColor: 'primary.main', borderRadius: '20px',
      p: 2,
      bgcolor: 'background.paper',
      position: 'relative',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <StepDot active label="1" />
        <Box sx={{ height: 2, flexGrow: 1, bgcolor: step === 'end' ? 'primary.main' : 'divider', borderRadius: 1 }} />
        <StepDot active={step === 'end'} label="2" />
        <Box sx={{ ms: 'auto' }} />
        <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary', fontWeight: 700, ml: 'auto' }}>
          {step === 'start'
            ? 'الخطوة 1 من 2'
            : `الخطوة 2 من 2 · البداية: الآية ${pendingStart}`}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

function StepDot({ active, label }) {
  return (
    <Box sx={{
      width: 30, height: 30, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: active ? 'primary.main' : 'action.hover',
      color: active ? 'primary.contrastText' : 'text.secondary',
      fontSize: '0.95rem', fontWeight: 800,
      border: '1px solid', borderColor: active ? 'primary.main' : 'divider',
      flexShrink: 0,
    }}>
      {label}
    </Box>
  );
}
