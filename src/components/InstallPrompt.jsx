import { useEffect, useState } from 'react';
import { Snackbar, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import IosShareIcon from '@mui/icons-material/IosShare';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

const DISMISS_KEY = 'pwa_install_dismissed_at';
const DISMISS_DAYS = 7;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

function recentlyDismissed() {
  const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
  if (!t) return false;
  return (Date.now() - t) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [open, setOpen] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setOpen(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    const onInstalled = () => {
      setOpen(false);
      setDeferred(null);
      localStorage.removeItem(DISMISS_KEY);
    };
    window.addEventListener('appinstalled', onInstalled);

    if (isIos()) {
      const t = setTimeout(() => setOpen(true), 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onPrompt);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'dismissed') dismiss();
      setDeferred(null);
      setOpen(false);
    } else if (isIos()) {
      setIosOpen(true);
    }
  };

  return (
    <>
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 2 }}
      >
        <Alert
          severity="info"
          icon={<GetAppIcon />}
          sx={{
            width: '100%',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '& .MuiAlert-icon': { color: 'inherit' },
            fontFamily: 'inherit',
            fontSize: '0.95rem',
          }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={install} sx={{ color: 'inherit', fontWeight: 700 }}>
                تثبيت
              </Button>
              <Button size="small" onClick={dismiss} sx={{ color: 'inherit', opacity: 0.85 }}>
                لاحقًا
              </Button>
            </Box>
          }
        >
          ثبّت التطبيق للاستخدام بدون إنترنت
        </Alert>
      </Snackbar>

      <Dialog open={iosOpen} onClose={() => setIosOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>تثبيت التطبيق على iPhone</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>لتثبيت التطبيق على جهازك اتبع الخطوات التالية:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <IosShareIcon color="primary" />
            <Typography>اضغط على زر المشاركة في Safari</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AddBoxOutlinedIcon color="primary" />
            <Typography>اختر «إضافة إلى الشاشة الرئيسية»</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIosOpen(false)}>حسنًا</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
