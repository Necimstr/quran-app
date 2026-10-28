import { Dialog, Box, Typography, IconButton, Button, Slide, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

// Full-screen page on phones, centered dialog on larger screens.
// One clear exit: the big "تم" button (or the close button / back gesture).
export default function SettingsSheet({ open, onClose, title, icon, children, doneLabel = 'تم' }) {
  const fullScreen = useMediaQuery((t) => t.breakpoints.down('sm'));
  const titleId = `sheet-title-${title}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      slots={{ transition: Slide }}
      slotProps={{
        transition: { direction: 'up' },
        paper: {
          sx: {
            bgcolor: 'background.default',
            ...(fullScreen ? { borderRadius: 0 } : { borderRadius: '28px', maxHeight: '88vh' }),
          },
        },
      }}
    >
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 2.5, pt: 'calc(16px + env(safe-area-inset-top))', pb: 2,
        bgcolor: 'background.paper',
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        {icon && (
          <Box sx={(t) => ({
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            color: 'primary.main',
            bgcolor: t.palette.mode === 'dark' ? 'rgba(77,182,172,0.14)' : 'rgba(0,105,92,0.09)',
            '& svg': { fontSize: 24 },
          })}>
            {icon}
          </Box>
        )}
        <Typography id={titleId} component="h2" sx={{ flexGrow: 1, fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.3 }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="إغلاق"
          sx={{ width: 48, height: 48, bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2.5, py: 3 }}>
        {children}
      </Box>

      <Box sx={{
        px: 2.5, pt: 2, pb: 'calc(16px + env(safe-area-inset-bottom))',
        bgcolor: 'background.paper',
        borderTop: '1px solid', borderColor: 'divider',
      }}>
        <Button variant="contained" size="large" fullWidth onClick={onClose} startIcon={<CheckIcon />}
          sx={{ minHeight: 58, fontSize: '1.15rem', fontWeight: 800 }}>
          {doneLabel}
        </Button>
      </Box>
    </Dialog>
  );
}
