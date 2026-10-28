import { useEffect, useState } from 'react';

let deferredEvent = null;
const listeners = new Set();

function notify() {
  for (const fn of listeners) fn(deferredEvent);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredEvent = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredEvent = null;
    notify();
  });
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

export function isIos() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

export function useInstallPrompt() {
  const [evt, setEvt] = useState(deferredEvent);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const fn = (e) => setEvt(e);
    listeners.add(fn);
    const onInstalled = () => setInstalled(true);
    window.addEventListener('appinstalled', onInstalled);
    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = () => setInstalled(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => {
      listeners.delete(fn);
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener?.('change', onChange);
    };
  }, []);

  const promptInstall = async () => {
    if (!evt) return 'unavailable';
    evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === 'accepted') {
      deferredEvent = null;
      notify();
    }
    return outcome;
  };

  return {
    canInstall: !!evt && !installed,
    installed,
    ios: isIos(),
    promptInstall,
  };
}
