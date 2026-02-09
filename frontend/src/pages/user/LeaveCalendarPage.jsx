/**
 * Leave Calendar Page
 * หน้าแสดงปฏิทินการลา
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LeaveCalendar from '../../components/LeaveCalendar';
import api from '../../api/axios';

export default function LeaveCalendarPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('approved');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  // Check if user is admin or director
  const isAdmin = user?.role === 'admin';
  const isDirector = user?.role === 'director';
  const isCentralOffice = user?.role === 'central_office_staff' || user?.role === 'central_office_head';

  useEffect(() => {
    fetchLeaves();
    if (isAdmin || isCentralOffice) {
      fetchDepartments();
    }
  }, [filterStatus, filterDepartment]);

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '/api/leaves/calendar';
      const params = new URLSearchParams();
      
      if (filterStatus === 'approved') {
        params.append('status', 'approved_final');
      } else if (filterStatus === 'all') {
        // No status filter
      } else {
        params.append('status', filterStatus);
      }
      
      if (filterDepartment) {
        params.append('department', filterDepartment);
      }
      
      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      const response = await api.get(url);
      
      if (response.data.success) {
        setLeaves(response.data.data || []);
      } else {
        setError(response.data.message || 'ไม่พบข้อมูล');
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
      // Fallback: try to get leaves from user's own endpoint
      try {
        const fallbackResponse = await api.get('/api/leaves/my-leaves');
        if (fallbackResponse.data.success) {
          setLeaves(fallbackResponse.data.data || []);
        }
      } catch (fallbackErr) {
        setError('ไม่สามารถโหลดข้อมูลการลาได้');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/admin/departments');
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    // Could navigate to leave detail or open modal
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ปฏิทินการลา</h1>
        <p className="text-gray-600">
          {isAdmin || isCentralOffice 
            ? 'ดูรายการการลาของพนักงานทั้งหมด' 
            : isDirector 
              ? 'ดูรายการการลาของพนักงานในกลุ่มงาน'
              : 'ดูรายการการลาของคุณ'
          }
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              สถานะการลา
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="approved">อนุมัติแล้ว</option>
              <option value="pending">รอพิจารณา</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </div>

          {/* Department Filter (Admin/Central Office only) */}
          {(isAdmin || isCentralOffice) && departments.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                แผนก/กลุ่มงาน
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ทั้งหมด</option>
                {departments.map(dept => (
                  <option key={dept.id || dept.name} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchLeaves}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              รีเฟรช
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Calendar */}
      {!loading && (
        <>
          <LeaveCalendar
            leaves={leaves}
            onEventClick={handleEventClick}
            showAllStatuses={filterStatus === 'all'}
            height={700}
          />

          {/* Summary */}
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">สรุปข้อมูล</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-600">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-green-700">
                  {leaves.filter(l => l.status === 'approved_final').length}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-600">รอพิจารณา</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {leaves.filter(l => ['pending', 'approved_level1', 'approved_level2', 'approved_level3'].includes(l.status)).length}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-600">ถูกปฏิเสธ</p>
                <p className="text-2xl font-bold text-red-700">
                  {leaves.filter(l => l.status === 'rejected').length}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">ยกเลิก</p>
                <p className="text-2xl font-bold text-gray-700">
                  {leaves.filter(l => l.status === 'cancelled').length}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
