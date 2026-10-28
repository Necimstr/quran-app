import { Box, ButtonBase, Paper, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// A large, tappable summary row: what it is, what is chosen now, and a way in.
export function SettingRow({ icon, label, value, detail, onClick }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 1.75,
        px: 2, py: 2, minHeight: 88,
        textAlign: 'start', justifyContent: 'flex-start',
        transition: 'background-color 0.2s',
        '&:hover': { bgcolor: 'action.hover' },
        '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' },
      }}
    >
      <Box sx={(t) => ({
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
        color: 'primary.main',
        bgcolor: t.palette.mode === 'dark' ? 'rgba(77,182,172,0.14)' : 'rgba(0,105,92,0.09)',
        '& svg': { fontSize: 25 },
      })}>
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.92rem', fontWeight: 600, color: 'text.secondary', lineHeight: 1.4 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '1.08rem', fontWeight: 800, lineHeight: 1.5, color: 'text.primary' }}>
          {value}
        </Typography>
        {detail && (
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 500, color: 'text.secondary', lineHeight: 1.55 }}>
            {detail}
          </Typography>
        )}
      </Box>
      <ChevronLeftIcon sx={{ fontSize: 28, color: 'text.secondary', flexShrink: 0 }} />
    </ButtonBase>
  );
}

export default function SettingsList({ title, children }) {
  return (
    <Box component="section" aria-label={title}>
      <Typography component="h2" sx={{ fontSize: '1.2rem', fontWeight: 800, px: 0.5, mb: 1.25 }}>
        {title}
      </Typography>
      <Paper elevation={1} sx={{ borderRadius: '22px', overflow: 'hidden' }}>
        {children}
      </Paper>
    </Box>
  );
}
