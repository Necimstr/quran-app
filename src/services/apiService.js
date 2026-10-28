const ALQURAN_BASE = 'https://api.alquran.cloud/v1';
const EVERYAYAH_BASE = 'https://everyayah.com/data';

export const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', everyayah: 'Alafasy_128kbps' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)', everyayah: 'Abdul_Basit_Murattal_192kbps' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', everyayah: 'Husary_128kbps' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq El-Minshawi', everyayah: 'Minshawy_Murattal_128kbps' },
  { id: 'ar.muhammadayyoub', name: 'Muhammad Ayyoub', everyayah: 'Muhammad_Ayyoub_128kbps' },
  { id: 'ar.saoodshuraym', name: 'Saood bin Ebrahim Al-Shuraym', everyayah: 'Saood_ash-Shuraym_128kbps' },
];

export async function fetchSurahs() {
  const res = await fetch(`${ALQURAN_BASE}/surah`);
  if (!res.ok) throw new Error('Failed to fetch Surahs');
  const data = await res.json();
  return data.data;
}

export function getAyahAudioUrl(reciter, surahNumber, ayahNumber) {
  const surah = String(surahNumber).padStart(3, '0');
  const ayah = String(ayahNumber).padStart(3, '0');
  return `${EVERYAYAH_BASE}/${reciter.everyayah}/${surah}${ayah}.mp3`;
}

export async function fetchSurahInfo(surahNumber) {
  const res = await fetch(`${ALQURAN_BASE}/surah/${surahNumber}`);
  if (!res.ok) throw new Error('Failed to fetch Surah info');
  const data = await res.json();
  return data.data;
}
