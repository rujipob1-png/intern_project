/**
 * Leave Calendar Component
 * แสดงปฏิทินการลาของพนักงานในแผนก หรือทั้งหมด (สำหรับ admin)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { th } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Date-fns localizer for react-big-calendar
const locales = { 'th': th };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Start on Monday
  getDay,
  locales
});

// Leave type colors
const LEAVE_COLORS = {
  SICK: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
  PERSONAL: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  VACATION: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  MATERNITY: { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
  PATERNITY: { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },
  ORDINATION: { bg: '#FED7AA', border: '#EA580C', text: '#9A3412' },
  HAJJ: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  MILITARY: { bg: '#E5E7EB', border: '#6B7280', text: '#374151' },
  default: { bg: '#F3F4F6', border: '#9CA3AF', text: '#4B5563' }
};

// Status labels
const STATUS_LABELS = {
  pending: 'รอพิจารณา',
  approved_level1: 'ผอ.อนุมัติแล้ว',
  approved_level2: 'ระดับ 2 ผ่าน',
  approved_level3: 'ระดับ 3 ผ่าน',
  approved_final: 'อนุมัติแล้ว',
  rejected: 'ถูกปฏิเสธ',
  cancelled: 'ยกเลิกแล้ว'
};

// Custom event component
const EventComponent = ({ event }) => {
  const colors = LEAVE_COLORS[event.leaveTypeCode] || LEAVE_COLORS.default;
  
  return (
    <div
      style={{
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: colors.text,
        padding: '2px 4px',
        fontSize: '11px',
        borderRadius: '2px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
      }}
      title={`${event.title}\n${event.leaveType}\n${STATUS_LABELS[event.status] || event.status}`}
    >
      {event.title}
    </div>
  );
};

// Custom toolbar
const CustomToolbar = ({ date, onNavigate, onView, view }) => {
  const handlePrev = () => onNavigate('PREV');
  const handleNext = () => onNavigate('NEXT');
  const handleToday = () => onNavigate('TODAY');
  
  return (
    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          className="p-2 rounded hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleToday}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          วันนี้
        </button>
        <button
          onClick={handleNext}
          className="p-2 rounded hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold ml-2">
          {format(date, 'MMMM yyyy', { locale: th })}
        </h2>
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={() => onView('month')}
          className={`px-3 py-1 text-sm rounded ${view === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          เดือน
        </button>
        <button
          onClick={() => onView('week')}
          className={`px-3 py-1 text-sm rounded ${view === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          สัปดาห์
        </button>
        <button
          onClick={() => onView('agenda')}
          className={`px-3 py-1 text-sm rounded ${view === 'agenda' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          รายการ
        </button>
      </div>
    </div>
  );
};

// Main LeaveCalendar component
export default function LeaveCalendar({ 
  leaves = [], 
  onEventClick,
  showAllStatuses = false,
  height = 600 
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Transform leaves to calendar events
  const events = useMemo(() => {
    if (!leaves || !Array.isArray(leaves)) return [];
    
    return leaves
      .filter(leave => {
        // Filter by status if not showing all
        if (!showAllStatuses) {
          return ['approved_final', 'approved_level1', 'approved_level2', 'approved_level3'].includes(leave.status);
        }
        return true;
      })
      .map(leave => {
        // Handle selected_dates (for multi-day selection)
        const selectedDates = leave.selectedDates || leave.selected_dates;
        
        if (selectedDates && Array.isArray(selectedDates) && selectedDates.length > 0) {
          // Create multiple events for each selected date
          return selectedDates.map(dateStr => ({
            id: `${leave.id}-${dateStr}`,
            leaveId: leave.id,
            title: `${leave.user?.first_name || leave.firstName || 'ไม่ทราบชื่อ'} ${leave.user?.last_name?.charAt(0) || leave.lastName?.charAt(0) || ''}.`,
            start: new Date(dateStr),
            end: new Date(dateStr),
            allDay: true,
            leaveType: leave.leaveType || leave.leave_type || 'อื่นๆ',
            leaveTypeCode: leave.leaveTypeCode || leave.leave_types?.type_code || 'default',
            status: leave.status,
            userName: `${leave.user?.first_name || leave.firstName || ''} ${leave.user?.last_name || leave.lastName || ''}`,
            department: leave.user?.department || leave.department,
            reason: leave.reason
          }));
        }
        
        // Single date range event
        return {
          id: leave.id,
          leaveId: leave.id,
          title: `${leave.user?.first_name || leave.firstName || 'ไม่ทราบชื่อ'} ${leave.user?.last_name?.charAt(0) || leave.lastName?.charAt(0) || ''}.`,
          start: new Date(leave.startDate || leave.start_date),
          end: new Date(leave.endDate || leave.end_date),
          allDay: true,
          leaveType: leave.leaveType || leave.leave_type || 'อื่นๆ',
          leaveTypeCode: leave.leaveTypeCode || leave.leave_types?.type_code || 'default',
          status: leave.status,
          userName: `${leave.user?.first_name || leave.firstName || ''} ${leave.user?.last_name || leave.lastName || ''}`,
          department: leave.user?.department || leave.department,
          reason: leave.reason
        };
      })
      .flat();
  }, [leaves, showAllStatuses]);
  
  // Handle event click
  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
    if (onEventClick) {
      onEventClick(event);
    }
  }, [onEventClick]);
  
  // Event style getter
  const eventStyleGetter = useCallback((event) => {
    const colors = LEAVE_COLORS[event.leaveTypeCode] || LEAVE_COLORS.default;
    
    return {
      style: {
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        border: `1px solid ${colors.border}`
      }
    };
  }, []);
  
  // Custom messages for Thai locale
  const messages = {
    allDay: 'ทั้งวัน',
    previous: 'ก่อนหน้า',
    next: 'ถัดไป',
    today: 'วันนี้',
    month: 'เดือน',
    week: 'สัปดาห์',
    day: 'วัน',
    agenda: 'รายการ',
    date: 'วันที่',
    time: 'เวลา',
    event: 'รายการลา',
    noEventsInRange: 'ไม่มีรายการลาในช่วงนี้',
    showMore: (count) => `+ อีก ${count} รายการ`
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 pb-3 border-b">
        <span className="text-sm text-gray-600 font-medium">ประเภทการลา:</span>
        {Object.entries(LEAVE_COLORS)
          .filter(([key]) => key !== 'default')
          .map(([key, colors]) => (
            <div key={key} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded"
                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
              />
              <span className="text-xs text-gray-600">
                {key === 'SICK' && 'ป่วย'}
                {key === 'PERSONAL' && 'กิจ'}
                {key === 'VACATION' && 'พักผ่อน'}
                {key === 'MATERNITY' && 'คลอด'}
                {key === 'PATERNITY' && 'ช่วยภรรยาคลอด'}
                {key === 'ORDINATION' && 'บวช'}
                {key === 'HAJJ' && 'ฮัจย์'}
                {key === 'MILITARY' && 'ตรวจเลือก'}
              </span>
            </div>
          ))
        }
      </div>
      
      {/* Calendar */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height }}
        views={['month', 'week', 'agenda']}
        defaultView="month"
        messages={messages}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleEventClick}
        components={{
          event: EventComponent,
          toolbar: CustomToolbar
        }}
        popup
        selectable={false}
      />
      
      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">รายละเอียดการลา</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-sm text-gray-500">ชื่อพนักงาน:</span>
                <p className="font-medium">{selectedEvent.userName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">ประเภทการลา:</span>
                <p className="font-medium">{selectedEvent.leaveType}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">วันที่:</span>
                <p className="font-medium">
                  {format(selectedEvent.start, 'd MMMM yyyy', { locale: th })}
                  {selectedEvent.start.getTime() !== selectedEvent.end.getTime() && 
                    ` - ${format(selectedEvent.end, 'd MMMM yyyy', { locale: th })}`
                  }
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">สถานะ:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  selectedEvent.status === 'approved_final' ? 'bg-green-100 text-green-800' :
                  selectedEvent.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  selectedEvent.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {STATUS_LABELS[selectedEvent.status] || selectedEvent.status}
                </span>
              </div>
              {selectedEvent.reason && (
                <div>
                  <span className="text-sm text-gray-500">เหตุผล:</span>
                  <p className="text-sm">{selectedEvent.reason}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
