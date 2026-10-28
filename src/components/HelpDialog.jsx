import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography,
  Accordion, AccordionSummary, AccordionDetails, Button, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MicIcon from '@mui/icons-material/Mic';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RepeatIcon from '@mui/icons-material/Repeat';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GetAppIcon from '@mui/icons-material/GetApp';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const SECTIONS = [
  {
    id: 'player',
    icon: <PlayArrowIcon />,
    title: 'المشغّل الرئيسي',
    image: '/help/player.png',
    body: [
      'يعرض البطاقة الخضراء السورة الحالية ونطاق الآيات وإعدادات التكرار والقارئ المختار.',
      'شريط التقدّم يُظهر موضع التشغيل، ويمكنك سحبه للانتقال إلى أي لحظة في الآية.',
      'الأزرار من اليمين إلى اليسار: الإيقاف الكامل، التالي، التشغيل/الإيقاف المؤقت، السابق.',
      'أزرار السرعة (×0.5 إلى ×1.5) تضبط سرعة التلاوة فورًا.',
      'شريط الصوت أسفل الشاشة يتحكّم في مستوى الصوت.',
    ],
  },
  {
    id: 'reciter',
    icon: <MicIcon />,
    title: 'اختيار القارئ',
    image: '/help/reciter.png',
    body: [
      'افتح تبويب «القارئ» لاستعراض قائمة القرّاء.',
      'استخدم مربع البحث للعثور على قارئ بالاسم.',
      'اضغط على النجمة ⭐ لإضافة قارئ إلى المفضّلة لظهوره في الأعلى.',
      'اضغط على اسم القارئ لاختياره — يظهر القارئ الحالي في أسفل القائمة.',
    ],
  },
  {
    id: 'surah',
    icon: <MenuBookOutlinedIcon />,
    title: 'اختيار السورة ونطاق الآيات',
    image: '/help/surah.png',
    body: [
      'من تبويب «السورة» اختر السورة من القائمة المنسدلة.',
      'حدّد «من الآية» و«إلى الآية» لاختيار نطاق التلاوة.',
      'يمكنك البحث داخل الآيات بكتابة جزء من النص.',
      'العلامة ✓ الخضراء بجانب الآية تعني أنها محفوظة للاستماع بدون إنترنت بالقارئ الحالي.',
    ],
  },
  {
    id: 'repeat',
    icon: <RepeatIcon />,
    title: 'إعدادات التكرار',
    image: '/help/repeat.png',
    body: [
      '«تكرار كل آية»: عدد مرات تكرار الآية الواحدة قبل الانتقال إلى التي تليها — مفيد للحفظ.',
      '«تكرار المجموعة كاملة»: عدد مرات إعادة النطاق المختار بالكامل من البداية إلى النهاية.',
      'اختر «∞» لتكرار المجموعة بلا نهاية حتى الإيقاف اليدوي.',
    ],
  },
  {
    id: 'bookmarks',
    icon: <BookmarkIcon />,
    title: 'المحفوظات والتحميل بدون إنترنت',
    image: '/help/bookmarks.png',
    body: [
      'اضغط «حفظ الإعدادات الحالية كإشارة مرجعية» لحفظ القارئ والسورة والنطاق للعودة إليها لاحقًا بضغطة.',
      'يظهر زر «تحميل كامل السورة» لحفظ تلاوة السورة كاملةً بالقارئ الحالي في جهازك.',
      'بعد التحميل، يمكنك الاستماع كاملًا بدون أي اتصال بالإنترنت.',
      'للحذف اضغط على أيقونة سلة المهملات بجانب الإشارة المرجعية.',
    ],
  },
  {
    id: 'offline',
    icon: <WifiOffIcon />,
    title: 'الوضع بدون إنترنت',
    body: [
      'عند انقطاع الاتصال يظهر تنبيه في تبويب «السورة» يُبيّن عدد الآيات المحفوظة.',
      'الآيات غير المحفوظة تظهر باهتة ولا يمكن اختيارها.',
      'إذا وصل التشغيل إلى آية غير محفوظة فسيتوقف تلقائيًا بدلًا من تخطّيها.',
      'لضمان الاستماع الكامل بدون إنترنت، حمّل السورة من تبويب «المحفوظات» قبل انقطاع الاتصال.',
    ],
  },
  {
    id: 'install',
    icon: <GetAppIcon />,
    title: 'تثبيت التطبيق على الجهاز',
    body: [
      'يمكن تثبيت التطبيق كأيقونة على شاشة جهازك للاستخدام السريع كأي تطبيق عادي.',
      'على أندرويد: يظهر إشعار «تثبيت التطبيق» في أسفل الشاشة — اضغط «تثبيت».',
      'على iPhone: افتح التطبيق في Safari، اضغط زر المشاركة ، ثم «إضافة إلى الشاشة الرئيسية».',
      'بعد التثبيت يعمل التطبيق بدون متصفح ويتم تحديثه تلقائيًا عند توفّر إصدار جديد.',
    ],
  },
];

function InstallSection() {
  const { canInstall, installed, ios, promptInstall } = useInstallPrompt();

  if (installed) {
    return (
      <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 1 }}>
        التطبيق مُثبَّت بالفعل على جهازك.
      </Alert>
    );
  }

  if (canInstall) {
    return (
      <Button
        variant="contained"
        size="large"
        startIcon={<GetAppIcon />}
        onClick={() => promptInstall()}
        sx={{ mt: 1, minHeight: 52, fontSize: '1rem', fontWeight: 700 }}
        fullWidth
      >
        تثبيت التطبيق الآن
      </Button>
    );
  }

  if (ios) {
    return (
      <Alert severity="info" sx={{ mt: 1, fontSize: '0.9rem' }}>
        على iPhone/iPad: افتح هذه الصفحة في Safari، ثم اضغط زر «المشاركة» واختر «إضافة إلى الشاشة الرئيسية».
      </Alert>
    );
  }

  return (
    <Alert severity="info" sx={{ mt: 1, fontSize: '0.9rem' }}>
      إذا لم يظهر زر التثبيت، افتح قائمة المتصفح (⋮) واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».
    </Alert>
  );
}

export default function HelpDialog({ open, onClose }) {
  const [expanded, setExpanded] = useState('player');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 }, maxHeight: { xs: '100%', sm: '90vh' } } }}
      fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
    >
      <DialogTitle sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: 'primary.main', color: 'primary.contrastText', py: 1.5,
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>دليل الاستخدام</Typography>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: 'background.default' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
            هذا التطبيق مُصمَّم لمساعدتك على حفظ القرآن الكريم من خلال تكرار الآيات والاستماع بأصوات نخبة من القرّاء، مع إمكانية التحميل للاستخدام بدون إنترنت.
          </Typography>

          {SECTIONS.map((s) => (
            <Accordion
              key={s.id}
              expanded={expanded === s.id}
              onChange={() => setExpanded(expanded === s.id ? '' : s.id)}
              sx={{
                '&:before': { display: 'none' },
                borderRadius: 2,
                mb: 1,
                boxShadow: 1,
                '&.Mui-expanded': { mb: 1.5 },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36, borderRadius: '50%',
                    bgcolor: 'primary.main', color: 'primary.contrastText',
                  }}>
                    {s.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{s.title}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {s.image && (
                  <Box sx={{
                    display: 'flex', justifyContent: 'center', mb: 2,
                    bgcolor: 'action.hover', borderRadius: 2, p: 1.5,
                  }}>
                    <Box
                      component="img"
                      src={s.image}
                      alt={s.title}
                      sx={{
                        maxWidth: '100%', maxHeight: 360,
                        borderRadius: 1.5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    />
                  </Box>
                )}
                <Box component="ul" sx={{ pr: 2, m: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {s.body.map((line, i) => (
                    <Typography
                      key={i}
                      component="li"
                      sx={{ fontSize: '0.95rem', lineHeight: 1.9, color: 'text.primary' }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Box>
                {s.id === 'install' && <InstallSection />}
              </AccordionDetails>
            </Accordion>
          ))}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3, mb: 1 }}>
            تقبّل الله منّا ومنكم صالح الأعمال
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
