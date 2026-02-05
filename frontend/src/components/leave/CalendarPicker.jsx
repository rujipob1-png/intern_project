import { useState, useMemo } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

/**
 * CalendarPicker - ปฏิทินแบบคลิกเลือกหลายวันได้ (เหมือนเลือกที่นั่งโรงหนัง)
 */
export const CalendarPicker = ({ 
  selectedDates = [], 
  onChange, 
  disabled = false,
  showWeekends = true,
  minDate = null
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const monthNamesShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [currentMonth]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearList = [];
    for (let y = currentYear - 2; y <= currentYear + 5; y++) {
      yearList.push(y);
    }
    return yearList;
  }, []);

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectMonth = (monthIndex) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), monthIndex, 1));
    setShowMonthPicker(false);
  };

  const selectYear = (year) => {
    setCurrentMonth(prev => new Date(year, prev.getMonth(), 1));
    setShowYearPicker(false);
  };

  const isSelected = (date) => {
    if (!date) return false;
    const dateStr = formatDate(date);
    return selectedDates.includes(dateStr);
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (date) => {
    if (!date || disabled) return;
    const dayOfWeek = date.getDay();
    const dateStr = formatDate(date);

    if (!showWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) return;
    if (minDate) {
      const minDateObj = new Date(minDate);
      minDateObj.setHours(0, 0, 0, 0);
      if (date < minDateObj) return;
    }
    if (date < today) return;

    let newDates;
    if (isSelected(date)) {
      newDates = selectedDates.filter(d => d !== dateStr);
    } else {
      newDates = [...selectedDates, dateStr].sort();
    }
    onChange(newDates);
  };

  const handleRemoveDate = (dateStr) => {
    const newDates = selectedDates.filter(d => d !== dateStr);
    onChange(newDates);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const dayOfWeek = date.getDay();
    if (date < today) return true;
    if (minDate) {
      const minDateObj = new Date(minDate);
      minDateObj.setHours(0, 0, 0, 0);
      if (date < minDateObj) return true;
    }
    if (!showWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) return true;
    return false;
  };

  const isWeekend = (date) => {
    if (!date) return false;
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isToday = (date) => {
    if (!date) return false;
    return formatDate(date) === formatDate(today);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Calendar Container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-visible w-80 relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-4 py-3 rounded-t-2xl">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowMonthPicker(!showMonthPicker);
                setShowYearPicker(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white font-medium text-sm"
            >
              {monthNames[currentMonth.getMonth()]}
              <ChevronDown className={`w-4 h-4 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowYearPicker(!showYearPicker);
                setShowMonthPicker(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white font-medium text-sm"
            >
              {currentMonth.getFullYear() + 543}
              <ChevronDown className={`w-4 h-4 transition-transform ${showYearPicker ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Month Picker Dropdown */}
        {showMonthPicker && (
          <div className="absolute z-50 left-2 right-2 top-14 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {monthNames.map((month, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectMonth(idx)}
                className={`px-2 py-2.5 text-sm rounded-lg font-medium transition-all ${
                  currentMonth.getMonth() === idx
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'
                }`}
              >
                {monthNamesShort[idx]}
              </button>
            ))}
          </div>
        )}

        {/* Year Picker Dropdown */}
        {showYearPicker && (
          <div className="absolute z-50 left-2 right-2 top-14 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => selectYear(year)}
                className={`px-2 py-2.5 text-sm rounded-lg font-medium transition-all ${
                  currentMonth.getFullYear() === year
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'
                }`}
              >
                {year + 543}
              </button>
            ))}
          </div>
        )}

        {/* Day Names */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {dayNames.map((name, idx) => (
            <div
              key={idx}
              className={`py-2 text-center text-xs font-semibold ${
                idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 p-3">
          {calendarDays.map((date, idx) => {
            if (!date) {
              return <div key={idx} className="w-9 h-9"></div>;
            }

            const selected = isSelected(date);
            const isDisabled = isDateDisabled(date);
            const weekend = isWeekend(date);
            const todayDate = isToday(date);
            const isSunday = date.getDay() === 0;
            const isSaturday = date.getDay() === 6;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDateClick(date)}
                disabled={isDisabled || disabled}
                className={`
                  w-9 h-9 mx-auto flex items-center justify-center text-sm font-medium
                  rounded-xl transition-all duration-200 relative
                  ${selected
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                    : isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : isSunday
                        ? 'text-red-500 hover:bg-red-50'
                        : isSaturday
                          ? 'text-blue-500 hover:bg-blue-50'
                          : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }
                  ${todayDate && !selected ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
                `}
              >
                {date.getDate()}
                {selected && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            วันนี้
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              {selectedDates.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                  <Check className="w-3.5 h-3.5" />
                  เลือก {selectedDates.length} วัน
                </span>
              ) : (
                <span className="text-gray-400">ยังไม่ได้เลือก</span>
              )}
            </span>
          </div>
          {selectedDates.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm text-red-500 hover:text-red-700 font-medium hover:underline"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Selected Dates Chips */}
      {selectedDates.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-3 w-80">
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedDates.sort().map((dateStr) => {
              const date = new Date(dateStr + 'T00:00:00');
              const dayOfWeek = date.getDay();
              const dayName = dayNames[dayOfWeek];
              return (
                <div
                  key={dateStr}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-white border border-indigo-200 rounded-full text-sm font-medium text-indigo-700 shadow-sm hover:shadow transition-shadow"
                >
                  <span>
                    {dayName} {date.getDate()} {monthNamesShort[date.getMonth()]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(dateStr)}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    disabled={disabled}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPicker;
