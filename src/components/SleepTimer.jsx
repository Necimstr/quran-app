import { useState, useEffect, useRef } from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem,
  Typography, LinearProgress,
} from '@mui/material';
import BedtimeIcon from '@mui/icons-material/Bedtime';

const OPTIONS = [
  { value: 0, label: 'إيقاف' },
  { value: 15, label: '15 دقيقة' },
  { value: 30, label: '30 دقيقة' },
  { value: 60, label: '60 دقيقة' },
  { value: 90, label: '90 دقيقة' },
];

function fmt(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SleepTimer({ onExpire }) {
  const [selected, setSelected] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!selected) {
      setRemaining(0);
      endTimeRef.current = null;
      return;
    }

    endTimeRef.current = Date.now() + selected * 60 * 1000;
    setRemaining(selected * 60 * 1000);

    intervalRef.current = setInterval(() => {
      const left = Math.max(0, endTimeRef.current - Date.now());
      setRemaining(left);
      if (left === 0) {
        clearInterval(intervalRef.current);
        setSelected(0);
        onExpire();
      }
    }, 500);

    return () => clearInterval(intervalRef.current);
  }, [selected, onExpire]);

  const totalMs = selected * 60 * 1000;
  const pct = totalMs > 0 ? ((totalMs - remaining) / totalMs) * 100 : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <FormControl fullWidth>
        <InputLabel sx={{ fontSize: '1rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BedtimeIcon sx={{ fontSize: 16 }} /> مؤقت النوم
          </Box>
        </InputLabel>
        <Select
          value={selected}
          label="مؤقت النوم  "
          onChange={(e) => setSelected(e.target.value)}
          sx={{ fontSize: '1rem', minHeight: 52 }}
        >
          {OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value} sx={{ fontSize: '1rem', py: 1.2 }}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selected > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">إيقاف تلقائي بعد</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {fmt(remaining)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200' }}
          />
        </Box>
      )}
    </Box>
  );
}
