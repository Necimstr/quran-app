const ALQURAN_BASE = 'https://api.alquran.cloud/v1';
const EVERYAYAH_BASE = 'https://everyayah.com/data';

const HAFS = 'حفص عن عاصم';
const QALUN = 'قالون عن نافع';
const WARSH = 'ورش عن نافع';

export const RECITERS = [
  { id: 'Alafasy_128kbps',                      name: 'مشاري راشد العفاسي',           qiraa: HAFS },
  { id: 'Abdul_Basit_Murattal_192kbps',          name: 'عبد الباسط عبد الصمد (مرتّل)', qiraa: HAFS },
  { id: 'Abdul_Basit_Mujawwad_128kbps',          name: 'عبد الباسط عبد الصمد (مجوّد)', qiraa: HAFS },
  { id: 'Husary_128kbps',                        name: 'محمود خليل الحصري',            qiraa: HAFS },
  { id: 'Husary_Mujawwad_128kbps',               name: 'محمود خليل الحصري (مجوّد)',    qiraa: HAFS },
  { id: 'Minshawy_Murattal_128kbps',             name: 'محمد صديق المنشاوي (مرتّل)',   qiraa: HAFS },
  { id: 'Minshawy_Mujawwad_128kbps',             name: 'محمد صديق المنشاوي (مجوّد)',   qiraa: HAFS },
  { id: 'Abdurrahmaan_As-Sudais_192kbps',        name: 'عبد الرحمن السديس',            qiraa: HAFS },
  { id: 'Saood_ash-Shuraym_128kbps',             name: 'سعود الشريم',                  qiraa: HAFS },
  { id: 'Maher_AlMuaiqly_128kbps',               name: 'ماهر المعيقلي',                qiraa: HAFS },
  { id: 'Muhammad_Ayyoub_128kbps',               name: 'محمد أيوب',                    qiraa: HAFS },
  { id: 'Muhammad_Jibreel_128kbps',              name: 'محمد جبريل',                   qiraa: HAFS },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps',         name: 'أبو بكر الشاطري',              qiraa: HAFS },
  { id: 'Hani_Rifai_192kbps',                    name: 'هاني الرفاعي',                 qiraa: HAFS },
  { id: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketabook', name: 'أحمد العجمي',                 qiraa: HAFS },
  { id: 'Nasser_Alqatami_128kbps',               name: 'ناصر القطامي',                 qiraa: HAFS },
  { id: 'Ibrahim_Akhdar_128kbps',                name: 'إبراهيم الأخضر',               qiraa: HAFS },
  { id: 'Mohammad_al_Tablaway_128kbps',          name: 'محمد الطبلاوي',                qiraa: HAFS },
  { id: 'Wadee_Hammadi_Al_Yamani_128kbps',       name: 'وديع حمادي اليماني',           qiraa: HAFS },
  { id: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps', name: 'خالد عبدالله القحطاني',       qiraa: HAFS },
  { id: 'Yasser_Ad-Dussary_128kbps',             name: 'ياسر الدوسري',                 qiraa: HAFS },
  { id: 'Sahl_Yassin_128kbps',                   name: 'سهل ياسين',                    qiraa: HAFS },
  { id: 'Ali_Jaber_64kbps',                      name: 'علي جابر',                     qiraa: HAFS },
  { id: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps', name: 'عبد الله عواد الجهني',          qiraa: HAFS },
  { id: 'Salah_Al_Budair_128kbps',               name: 'صلاح البدير',                   qiraa: HAFS },
  { id: 'Hudhaify_128kbps',                      name: 'علي الحذيفي',                   qiraa: HAFS },
  { id: 'Muhsin_Al_Qasim_192kbps',               name: 'محسن القاسم',                   qiraa: HAFS },
  { id: 'Ayman_Sowaid_64kbps',                   name: 'أيمن سويد',                     qiraa: HAFS },
  { id: 'Husary_Muallim_128kbps',                name: 'محمود خليل الحصري (معلّم)',     qiraa: HAFS },

  { id: 'warsh/warsh_ibrahim_aldosary_128kbps',  name: 'إبراهيم الدوسري',              qiraa: WARSH },
  { id: 'warsh/warsh_Abdul_Basit_128kbps',       name: 'عبد الباسط عبد الصمد',         qiraa: WARSH },
];

export const QIRAA_COLORS = {
  [HAFS]: 'default',
  [QALUN]: 'secondary',
  [WARSH]: 'info',
};

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

export async function fetchSurahAyahs(surahNumber) {
  const res = await fetch(`${ALQURAN_BASE}/surah/${surahNumber}`);
  if (!res.ok) throw new Error('Failed to fetch surah text');
  const data = await res.json();
  return data.data.ayahs.map((a) => ({ number: a.numberInSurah, text: a.text }));
}
