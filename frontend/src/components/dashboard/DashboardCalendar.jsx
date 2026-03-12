import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getHolidayInfo } from '../../utils/thaiHolidays';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const LEAVE_COLORS = {
  SICK:       { dot: 'bg-rose-500',    bg: 'bg-rose-50',    ring: 'ring-rose-300',    text: 'text-rose-700',    label: 'ลาป่วย' },
  VACATION:   { dot: 'bg-sky-500',     bg: 'bg-sky-50',     ring: 'ring-sky-300',     text: 'text-sky-700',     label: 'ลาพักผ่อน' },
  PERSONAL:   { dot: 'bg-amber-500',   bg: 'bg-amber-50',   ring: 'ring-amber-300',   text: 'text-amber-700',   label: 'ลากิจ' },
  MATERNITY:  { dot: 'bg-pink-500',    bg: 'bg-pink-50',    ring: 'ring-pink-300',    text: 'text-pink-700',    label: 'ลาคลอด' },
  ORDINATION: { dot: 'bg-violet-500',  bg: 'bg-violet-50',  ring: 'ring-violet-300',  text: 'text-violet-700',  label: 'ลาบวช' },
  MILITARY:   { dot: 'bg-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-300', text: 'text-emerald-700', label: 'ลาทหาร' },
};

const STATUS_LABEL = {
  approved_final: 'อนุมัติแล้ว',
  approved: 'อนุมัติแล้ว',
  pending: 'รอพิจารณา',
  pending_director: 'รอ ผอ.กลุ่ม',
  pending_central_staff: 'รอ จนท.กอก.',
  pending_central_head: 'รอ ผอ.กอก.',
  pending_admin: 'รอ ผอ.สำนัก',
  approved_level1: 'รอพิจารณา',
  approved_level2: 'รอพิจารณา',
  approved_level3: 'รอพิจารณา',
  rejected: 'ไม่อนุมัติ',
  cancelled: 'ยกเลิก',
};

const isPending = (status) => !['approved_final', 'approved', 'rejected', 'cancelled'].includes(status);

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const pad = (n) => String(n).padStart(2, '0');

const DashboardCalendar = ({ leaves = [] }) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const thaiYear = year + 543;

  const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null); };
  const goToday = () => { setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(todayStr); };

  // Build leave day map
  const leaveDayMap = useMemo(() => {
    const map = {};
    leaves.forEach(leave => {
      const typeCode = leave.leaveTypeCode || leave.leave_type_code || '';
      const status = leave.status || '';
      if (status === 'cancelled' || status === 'rejected') return;

      const dates = leave.selectedDates || leave.selected_dates || [];
      if (dates.length > 0) {
        dates.forEach(d => {
          const key = typeof d === 'string' ? d.split('T')[0] : d;
          if (!map[key]) map[key] = [];
          map[key].push({ typeCode, status, leave });
        });
      } else {
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

  // Summary stats for this month
  const monthStats = useMemo(() => {
    let leaveDays = 0;
    let holidayDays = 0;
    const daysInMo = getDaysInMonth(year, month);
    for (let d = 1; d <= daysInMo; d++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
      if (leaveDayMap[dateStr]?.length > 0) leaveDays++;
      if (getHolidayInfo(dateStr)) holidayDays++;
    }
    return { leaveDays, holidayDays };
  }, [leaveDayMap, year, month]);

  // Calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      const pm = month === 0 ? 12 : month;
      const py = month === 0 ? year - 1 : year;
      days.push({ day: prevDay, isCurrentMonth: false, date: `${py}-${pad(pm)}-${pad(prevDay)}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true, date: `${year}-${pad(month + 1)}-${pad(d)}` });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      const nm = month === 11 ? 1 : month + 2;
      const ny = month === 11 ? year + 1 : year;
      for (let d = 1; d <= remaining; d++) {
        days.push({ day: d, isCurrentMonth: false, date: `${ny}-${pad(nm)}-${pad(d)}` });
      }
    }
    return days;
  }, [year, month, daysInMonth, firstDay, prevMonthDays]);

  const isWeekend = (idx) => idx % 7 === 0 || idx % 7 === 6;
  const selectedDayLeaves = selectedDay ? (leaveDayMap[selectedDay] || []) : [];
  const selectedHoliday = selectedDay ? getHolidayInfo(selectedDay) : null;

  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header — compact dark bar */}
      <div className="bg-gradient-to-r from-[#1a2744] to-[#2a3f6a] px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-white tracking-wide">ปฏิทินการลา</span>
        <div className="flex items-center gap-1.5">
          {(monthStats.leaveDays > 0 || monthStats.holidayDays > 0) && (
            <span className="text-[10px] text-white/60 mr-1">
              {monthStats.leaveDays > 0 && `ลา ${monthStats.leaveDays} วัน`}
              {monthStats.leaveDays > 0 && monthStats.holidayDays > 0 && ' · '}
              {monthStats.holidayDays > 0 && `หยุด ${monthStats.holidayDays} วัน`}
            </span>
          )}
          <button
            onClick={goToday}
            className="text-[10px] text-white/90 hover:text-white px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors font-medium"
          >
            วันนี้
          </button>
        </div>
      </div>

      <div className="p-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h4 className="text-sm font-bold text-slate-800">
            {THAI_MONTHS[month]} {thaiYear}
          </h4>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-1">
          {THAI_DAYS_SHORT.map((day, i) => (
            <div key={day} className={`text-center text-[10px] font-semibold py-1 uppercase tracking-wider ${i === 0 || i === 6 ? 'text-red-400' : 'text-slate-400'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-[3px]">
          {calendarDays.map((cell, index) => {
            const entries = cell.date ? (leaveDayMap[cell.date] || []) : [];
            const hasLeave = entries.length > 0 && cell.isCurrentMonth;
            const primary = hasLeave ? entries[0] : null;
            const colors = primary ? (LEAVE_COLORS[primary.typeCode] || LEAVE_COLORS.PERSONAL) : null;
            const isApproved = primary && !isPending(primary.status);
            const isToday = cell.date === todayStr;
            const weekend = isWeekend(index);
            const holiday = cell.isCurrentMonth ? getHolidayInfo(cell.date) : null;
            const isSelected = selectedDay === cell.date && cell.isCurrentMonth;

            let cellClass = 'relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all duration-150 ';

            if (!cell.isCurrentMonth) {
              cellClass += 'text-slate-200 cursor-default';
            } else if (isSelected) {
              cellClass += 'bg-[#1a2744] text-white cursor-pointer ring-2 ring-[#1a2744] ring-offset-1';
            } else if (hasLeave) {
              cellClass += `${colors.bg} cursor-pointer ${isApproved ? '' : 'opacity-70'} ring-1 ${colors.ring} hover:ring-2`;
            } else if (isToday) {
              cellClass += 'bg-indigo-50 text-indigo-700 font-bold cursor-pointer ring-2 ring-indigo-400';
            } else if (holiday) {
              cellClass += 'bg-green-50 text-green-700 cursor-pointer ring-1 ring-green-200 hover:ring-green-300';
            } else if (weekend) {
              cellClass += 'text-red-400 cursor-pointer hover:bg-red-50';
            } else {
              cellClass += 'text-slate-700 cursor-pointer hover:bg-slate-50';
            }

            return (
              <button
                key={index}
                onClick={() => cell.isCurrentMonth && setSelectedDay(isSelected ? null : cell.date)}
                disabled={!cell.isCurrentMonth}
                className={cellClass}
                title={holiday ? holiday.name : hasLeave ? colors.label : ''}
              >
                <span className="leading-none">{cell.day}</span>
                {hasLeave && cell.isCurrentMonth && !isSelected && (
                  <div className="flex gap-0.5 mt-0.5">
                    {entries.slice(0, 3).map((e, i) => {
                      const c = LEAVE_COLORS[e.typeCode] || LEAVE_COLORS.PERSONAL;
                      return <span key={i} className={`w-1 h-1 rounded-full ${c.dot}`} />;
                    })}
                  </div>
                )}
                {holiday && !hasLeave && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-green-500 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend — always show */}
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(LEAVE_COLORS).map(([code, c]) => (
              <div key={code} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <span className="text-[10px] text-slate-500">{c.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-slate-500">วันหยุดราชการ</span>
            </div>
          </div>
        </div>

        {/* Selected Day Detail Panel */}
        {selectedDay && (
          <div className="mt-2.5 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-700">{formatThaiDate(selectedDay)}</p>
            </div>
            <div className="px-3 py-2 space-y-1.5">
              {selectedHoliday && (
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-green-50 border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="text-[11px] font-medium text-green-800">{selectedHoliday.name}</span>
                </div>
              )}
              {selectedDayLeaves.length > 0 ? (
                selectedDayLeaves.map((entry, i) => {
                  const c = LEAVE_COLORS[entry.typeCode] || LEAVE_COLORS.PERSONAL;
                  const statusLabel = STATUS_LABEL[entry.status] || 'รอพิจารณา';
                  const pending = isPending(entry.status);
                  return (
                    <div key={i} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${c.bg} border ${pending ? 'border-dashed' : 'border-solid'} border-slate-200`}>
                      <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                      <span className={`text-[11px] font-medium ${c.text}`}>{c.label}</span>
                      <span className={`text-[10px] ml-auto px-1.5 py-0.5 rounded-full ${
                        pending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>{statusLabel}</span>
                    </div>
                  );
                })
              ) : !selectedHoliday ? (
                <p className="text-[11px] text-slate-400 py-1 text-center">ไม่มีการลาในวันนี้</p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCalendar;
