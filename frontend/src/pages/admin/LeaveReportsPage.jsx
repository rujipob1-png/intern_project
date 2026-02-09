/**
 * Leave Reports Page
 * หน้ารายงานการลา (สำหรับ Admin และ Central Office)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { exportLeavesToExcel, exportLeavesToPDF } from '../../utils/reportExport';

export default function LeaveReportsPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    leaveType: '',
    department: ''
  });
  
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalDays: 0
  });

  const statusOptions = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'pending', label: 'รอพิจารณา' },
    { value: 'approved_level1', label: 'ผอ.อนุมัติแล้ว' },
    { value: 'approved_level2', label: 'ระดับ 2 ผ่าน' },
    { value: 'approved_level3', label: 'ระดับ 3 ผ่าน' },
    { value: 'approved_final', label: 'อนุมัติแล้ว' },
    { value: 'rejected', label: 'ถูกปฏิเสธ' },
    { value: 'cancelled', label: 'ยกเลิกแล้ว' }
  ];

  useEffect(() => {
    fetchDepartments();
    fetchLeaveTypes();
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFilters(prev => ({
      ...prev,
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    }));
  }, []);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchLeaves();
    }
  }, [filters]);

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

  const fetchLeaveTypes = async () => {
    try {
      const response = await api.get('/api/leaves/types');
      if (response.data.success) {
        setLeaveTypes(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching leave types:', err);
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      if (filters.leaveType) params.append('leaveType', filters.leaveType);
      
      const response = await api.get(`/api/admin/reports/leaves?${params.toString()}`);
      
      if (response.data.success) {
        const leavesData = response.data.data || [];
        setLeaves(leavesData);
        
        // Calculate summary
        const approved = leavesData.filter(l => l.status === 'approved_final').length;
        const pending = leavesData.filter(l => 
          ['pending', 'approved_level1', 'approved_level2', 'approved_level3'].includes(l.status)
        ).length;
        const rejected = leavesData.filter(l => l.status === 'rejected').length;
        const totalDays = leavesData
          .filter(l => l.status === 'approved_final')
          .reduce((sum, l) => sum + (l.total_days || l.totalDays || 0), 0);
        
        setSummary({
          total: leavesData.length,
          approved,
          pending,
          rejected,
          totalDays
        });
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExportExcel = async () => {
    if (leaves.length === 0) {
      alert('ไม่มีข้อมูลให้ export');
      return;
    }
    
    setExporting(true);
    try {
      const filename = exportLeavesToExcel(leaves, 'รายงานการลา');
      console.log('Exported:', filename);
    } catch (err) {
      console.error('Export error:', err);
      alert('เกิดข้อผิดพลาดในการ export');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (leaves.length === 0) {
      alert('ไม่มีข้อมูลให้ export');
      return;
    }
    
    setExporting(true);
    try {
      const filename = exportLeavesToPDF(leaves, 'Leave Report');
      console.log('Exported:', filename);
    } catch (err) {
      console.error('Export error:', err);
      alert('เกิดข้อผิดพลาดในการ export');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'รอพิจารณา' },
      approved_level1: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'ผอ.อนุมัติ' },
      approved_level2: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'ระดับ 2 ผ่าน' },
      approved_level3: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'ระดับ 3 ผ่าน' },
      approved_final: { bg: 'bg-green-100', text: 'text-green-800', label: 'อนุมัติแล้ว' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'ถูกปฏิเสธ' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ยกเลิก' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายงานการลา</h1>
          <p className="text-gray-600">สร้างและ export รายงานการลา</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            disabled={exporting || leaves.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting || leaves.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">ตัวกรองข้อมูล</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่ม</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการลา</label>
            <select
              value={filters.leaveType}
              onChange={(e) => handleFilterChange('leaveType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {leaveTypes.map(type => (
                <option key={type.id} value={type.type_code}>{type.type_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {departments.map(dept => (
                <option key={dept.id || dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">ทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-600">อนุมัติแล้ว</p>
          <p className="text-2xl font-bold text-green-700">{summary.approved}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-600">รอพิจารณา</p>
          <p className="text-2xl font-bold text-yellow-700">{summary.pending}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-600">ถูกปฏิเสธ</p>
          <p className="text-2xl font-bold text-red-700">{summary.rejected}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-sm text-blue-600">วันลารวม</p>
          <p className="text-2xl font-bold text-blue-700">{summary.totalDays}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Data Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เลขที่ใบลา</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">พนักงาน</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">แผนก</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวน</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      ไม่พบข้อมูลการลาในช่วงที่เลือก
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave, index) => (
                    <tr key={leave.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {leave.leaveNumber || leave.leave_number || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          {leave.employeeName || `${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`.trim() || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {leave.employeeCode || leave.users?.employee_code || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {leave.department || leave.users?.department || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {leave.leaveType || leave.leave_types?.type_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{formatDate(leave.startDate || leave.start_date)}</div>
                        {(leave.startDate || leave.start_date) !== (leave.endDate || leave.end_date) && (
                          <div className="text-xs text-gray-500">
                            ถึง {formatDate(leave.endDate || leave.end_date)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {leave.totalDays || leave.total_days || 0} วัน
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(leave.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination info */}
          {leaves.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600">
              แสดง {leaves.length} รายการ
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  } catch {
    return dateStr;
  }
}
