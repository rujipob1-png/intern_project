import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { isThaiHoliday, getHolidayInfo, getHolidaysInMonth } from '../../utils/thaiHolidays';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const LEAVE_COLORS = {
  SICK: { bg: 'bg-rose-100', border: 'border-rose-300', dot: 'bg-rose-500', text: 'text-rose-700', label: 'ลาป่วย' },
  VACATION: { bg: 'bg-sky-100', border: 'border-sky-300', dot: 'bg-sky-500', text: 'text-sky-700', label: 'ลาพักผ่อน' },
  PERSONAL: { bg: 'bg-amber-100', border: 'border-amber-300', dot: 'bg-amber-500', text: 'text-amber-700', label: 'ลากิจ' },
  MATERNITY: { bg: 'bg-pink-100', border: 'border-pink-300', dot: 'bg-pink-500', text: 'text-pink-700', label: 'ลาคลอด' },
  ORDINATION: { bg: 'bg-purple-100', border: 'border-purple-300', dot: 'bg-purple-500', text: 'text-purple-700', label: 'ลาบวช' },
  MILITARY: { bg: 'bg-emerald-100', border: 'border-emerald-300', dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'ลาทหาร' },
};

const STATUS_STYLE = {
  approved_final: { opacity: '', label: 'อนุมัติ' },
  approved: { opacity: '', label: 'อนุมัติ' },
  pending: { opacity: 'opacity-60', label: 'รอพิจารณา' },
  approved_level1: { opacity: 'opacity-60', label: 'รอพิจารณา' },
  approved_level2: { opacity: 'opacity-60', label: 'รอพิจารณา' },
  approved_level3: { opacity: 'opacity-60', label: 'รอพิจารณา' },
  rejected: { opacity: 'opacity-30 line-through', label: 'ไม่อนุมัติ' },
  cancelled: { opacity: 'opacity-30 line-through', label: 'ยกเลิก' },
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const DashboardCalendar = ({ leaves = [] }) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const thaiYear = year + 543;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(null);
  };

  // Build a map: dateString -> [{ leaveTypeCode, status, ... }]
  const leaveDayMap = useMemo(() => {
    const map = {};
    leaves.forEach(leave => {
      const typeCode = leave.leaveTypeCode || leave.leave_type_code || '';
      const status = leave.status || '';

      // Skip cancelled/rejected for display unless we want to show them
      if (status === 'cancelled' || status === 'rejected') return;

      // Use selected_dates if available (array of date strings)
      const dates = leave.selectedDates || leave.selected_dates || [];
      if (dates.length > 0) {
        dates.forEach(d => {
          const key = typeof d === 'string' ? d.split('T')[0] : d;
          if (!map[key]) map[key] = [];
          map[key].push({ typeCode, status, leave });
        });
      } else {
        // Fallback: expand start_date to end_date
        const start = new Date(leave.startDate || leave.start_date);
        const end = new Date(leave.endDate || leave.end_date);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().split('T')[0];
          if (!map[key]) map[key] = [];
          map[key].push({ typeCode, status, leave });
        }
      }
    });
    return map;
  }, [leaves]);

  // Types present in this month for legend
  const monthLeaveTypes = useMemo(() => {
    const types = new Set();
    Object.entries(leaveDayMap).forEach(([dateStr, entries]) => {
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month) {
        entries.forEach(e => types.add(e.typeCode));
      }
    });
    return [...types];
  }, [leaveDayMap, year, month]);

  // Calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const calendarDays = useMemo(() => {
    const days = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({ day: prevDay, isCurrentMonth: false, date: dateStr });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: true, date: dateStr });
    }

    // Next month leading days
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      for (let d = 1; d <= remaining; d++) {
        const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ day: d, isCurrentMonth: false, date: dateStr });
      }
    }

    return days;
  }, [year, month, daysInMonth, firstDay, prevMonthDays]);

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  };

  const isWeekend = (dayIndex) => dayIndex % 7 === 0 || dayIndex % 7 === 6;

  // Details for selected day
  const selectedDayLeaves = selectedDay ? (leaveDayMap[selectedDay] || []) : [];

  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-sm font-medium text-slate-800">ปฏิทินการลา</h3>
          </div>
          <button
            onClick={goToday}
            className="text-[10px] text-slate-500 hover:text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
          >
            วันนี้
          </button>
        </div>
      </div>

      <div className="px-3 py-2">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <h4 className="text-xs font-semibold text-slate-600">
            {THAI_MONTHS[month]} {thaiYear}
          </h4>
          <button
            onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-0.5">
          {THAI_DAYS.map((day, i) => (
            <div
              key={day}
              className={`text-center text-[10px] font-medium py-1 ${
                i === 0 || i === 6 ? 'text-red-400' : 'text-slate-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((cell, index) => {
            const leaveEntries = cell.date ? (leaveDayMap[cell.date] || []) : [];
            const hasLeave = leaveEntries.length > 0 && cell.isCurrentMonth;
            const primaryLeave = hasLeave ? leaveEntries[0] : null;
            const colors = primaryLeave ? (LEAVE_COLORS[primaryLeave.typeCode] || LEAVE_COLORS.PERSONAL) : null;
            const statusStyle = primaryLeave ? (STATUS_STYLE[primaryLeave.status] || STATUS_STYLE.pending) : null;
            const todayCell = isToday(cell.date);
            const weekend = isWeekend(index);
            const holiday = cell.isCurrentMonth ? getHolidayInfo(cell.date) : null;
            const isSelected = selectedDay === cell.date && cell.isCurrentMonth;

            return (
              <button
                key={index}
                onClick={() => cell.isCurrentMonth && cell.date && setSelectedDay(isSelected ? null : cell.date)}
                disabled={!cell.isCurrentMonth}
                className={`
                  relative h-8 flex flex-col items-center justify-center rounded text-xs transition-all
                  ${!cell.isCurrentMonth ? 'text-slate-200 cursor-default' : 'cursor-pointer hover:bg-slate-50'}
                  ${todayCell && !hasLeave ? 'ring-1.5 ring-indigo-400 ring-inset font-bold text-indigo-600' : ''}
                  ${isSelected ? 'ring-1.5 ring-slate-400 ring-inset bg-slate-50' : ''}
                  ${weekend && cell.isCurrentMonth && !hasLeave && !holiday ? 'text-red-400' : ''}
                  ${holiday && !hasLeave ? 'bg-green-50 border border-green-200 text-green-700' : ''}
                  ${hasLeave && cell.isCurrentMonth ? `${colors.bg} ${statusStyle.opacity} border ${colors.border}` : ''}
                  ${!hasLeave && !holiday && cell.isCurrentMonth && !todayCell ? 'text-slate-600' : ''}
                `}
              >
                <span className={`${todayCell ? 'font-bold' : ''} leading-none`}>{cell.day}</span>
                {hasLeave && cell.isCurrentMonth && (
                  <div className="flex gap-px mt-px">
                    {leaveEntries.slice(0, 3).map((entry, i) => {
                      const c = LEAVE_COLORS[entry.typeCode] || LEAVE_COLORS.PERSONAL;
                      return <span key={i} className={`w-1 h-1 rounded-full ${c.dot}`} />;
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        {monthLeaveTypes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {monthLeaveTypes.map(typeCode => {
                const colors = LEAVE_COLORS[typeCode] || LEAVE_COLORS.PERSONAL;
                return (
                  <div key={typeCode} className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    <span className="text-[10px] text-slate-500">{colors.label}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-500">วันหยุด</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] text-slate-500">วันนี้</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Day Detail */}
        {selectedDay && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-[10px] font-medium text-slate-500 mb-1.5">
              📅 {formatThaiDate(selectedDay)}
            </p>
            {(() => {
              const holidayInfo = getHolidayInfo(selectedDay);
              return (
                <div className="space-y-1">
                  {holidayInfo && (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-green-50 border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-medium text-green-700">🏛️ {holidayInfo.name}</span>
                    </div>
                  )}
                  {selectedDayLeaves.length > 0 ? (
                    selectedDayLeaves.map((entry, i) => {
                      const colors = LEAVE_COLORS[entry.typeCode] || LEAVE_COLORS.PERSONAL;
                      const statusInfo = STATUS_STYLE[entry.status] || STATUS_STYLE.pending;
                      return (
                        <div key={i} className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${colors.bg} border ${colors.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                          <span className={`text-[10px] font-medium ${colors.text}`}>{colors.label}</span>
                          <span className="text-[10px] text-slate-400 ml-auto">{statusInfo.label}</span>
                        </div>
                      );
                    })
                  ) : !holidayInfo ? (
                    <p className="text-[10px] text-slate-400">ไม่มีการลาในวันนี้</p>
                  ) : null}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCalendar;
