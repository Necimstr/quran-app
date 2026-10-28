export const SPEED_OPTIONS = [
  { value: 0.75, label: 'بطيء', sub: '0.75×', recitation: 'تلاوة بطيئة' },
  { value: 1, label: 'عادي', sub: '1×', recitation: 'تلاوة عادية' },
  { value: 1.25, label: 'سريع', sub: '1.25×', recitation: 'تلاوة سريعة' },
];

export function speedLabel(speed) {
  return SPEED_OPTIONS.find((o) => o.value === speed)?.recitation ?? `السرعة ${speed}×`;
}
