import { format, differenceInDays, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: th });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: th });
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
