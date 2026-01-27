import { format, differenceInDays, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

// แปลง UTC เป็นเวลาไทย (+7 ชั่วโมง)
const toThaiTime = (date) => {
  if (!date) return null;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  // เพิ่ม 7 ชั่วโมงสำหรับ timezone ไทย
  return new Date(dateObj.getTime() + (7 * 60 * 60 * 1000));
};

export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: th });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const thaiDate = toThaiTime(date);
  return format(thaiDate, 'dd/MM/yyyy HH:mm', { locale: th });
};

export const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return differenceInDays(end, start) + 1; // +1 เพราะนับวันแรกด้วย
};

export const formatThaiDate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd MMMM yyyy', { locale: th });
};
