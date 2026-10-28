const ALQURAN_BASE = 'https://api.alquran.cloud/v1';
const EVERYAYAH_BASE = 'https://everyayah.com/data';

export const RECITERS = [
  { id: 'Alafasy_128kbps',                      name: 'مشاري راشد العفاسي' },
  { id: 'Abdul_Basit_Murattal_192kbps',          name: 'عبد الباسط عبد الصمد (مرتّل)' },
  { id: 'Abdul_Basit_Mujawwad_128kbps',          name: 'عبد الباسط عبد الصمد (مجوّد)' },
  { id: 'Husary_128kbps',                        name: 'محمود خليل الحصري' },
  { id: 'Husary_Mujawwad_128kbps',               name: 'محمود خليل الحصري (مجوّد)' },
  { id: 'Minshawy_Murattal_128kbps',             name: 'محمد صديق المنشاوي (مرتّل)' },
  { id: 'Minshawy_Mujawwad_128kbps',             name: 'محمد صديق المنشاوي (مجوّد)' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps',        name: 'عبد الرحمن السديس' },
  { id: 'Saood_ash-Shuraym_128kbps',             name: 'سعود الشريم' },
  { id: 'Maher_AlMuaiqly_128kbps',               name: 'ماهر المعيقلي' },
  { id: 'Muhammad_Ayyoub_128kbps',               name: 'محمد أيوب' },
  { id: 'Muhammad_Jibreel_128kbps',              name: 'محمد جبريل' },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps',         name: 'أبو بكر الشاطري' },
  { id: 'Hani_Rifai_192kbps',                    name: 'هاني الرفاعي' },
  { id: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketabook', name: 'أحمد العجمي' },
  { id: 'Nasser_Alqatami_128kbps',               name: 'ناصر القطامي' },
  { id: 'Ibrahim_Akhdar_128kbps',                name: 'إبراهيم الأخضر' },
  { id: 'Mohammad_al_Tablaway_128kbps',          name: 'محمد الطبلاوي' },
  { id: 'Wadee_Hammadi_Al_Yamani_128kbps',       name: 'وديع حمادي اليماني' },
  { id: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps', name: 'خالد عبدالله القحطاني' },
  { id: 'Yasser_Ad-Dussary_128kbps',             name: 'ياسر الدوسري' },
  { id: 'Sahl_Yassin_128kbps',                   name: 'سهل ياسين' },
];

export function fetchReciters() {
  return Promise.resolve(RECITERS);
}

export async function fetchSurahs() {
  const res = await fetch(`${ALQURAN_BASE}/surah`);
  if (!res.ok) throw new Error('Failed to fetch Surahs');
  const data = await res.json();
  return data.data;
}

export function getAyahAudioUrl(reciter, surahNumber, ayahNumber) {
  const surah = String(surahNumber).padStart(3, '0');
  const ayah = String(ayahNumber).padStart(3, '0');
  return `${EVERYAYAH_BASE}/${reciter.id}/${surah}${ayah}.mp3`;
}

// kept for OfflineManager compatibility — not needed with EveryAyah
export function getGlobalAyahNumber() { return null; }
