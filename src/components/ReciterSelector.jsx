import { FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { RECITERS } from '../services/apiService';

export default function ReciterSelector({ value, onChange }) {
  return (
    <FormControl fullWidth size="medium">
      <InputLabel sx={{ fontSize: '1.1rem' }}>Reciter</InputLabel>
      <Select
        value={value?.id || ''}
        label="Reciter"
        onChange={(e) => {
          const r = RECITERS.find((r) => r.id === e.target.value);
          onChange(r);
        }}
        sx={{ fontSize: '1.1rem', minHeight: 56 }}
      >
        {RECITERS.map((r) => (
          <MenuItem key={r.id} value={r.id} sx={{ fontSize: '1.05rem', py: 1.5 }}>
            {r.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
