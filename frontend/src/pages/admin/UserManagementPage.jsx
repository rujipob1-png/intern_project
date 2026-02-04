import { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Edit2, Trash2, UserPlus, 
  Shield, Building, Phone, Mail, ChevronDown, ChevronUp,
  Eye, EyeOff, Check, X, RefreshCw, Download, MoreHorizontal,
  Calendar, Clock, FileText, AlertCircle, Award, Briefcase
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { adminAPI } from '../../api/admin.api';
import toast from 'react-hot-toast';

// Role badge colors - โทนสีทางราชการ
const ROLE_STYLES = {
  'user': { bg: 'bg-slate-100 border border-slate-300', text: 'text-slate-700', label: 'บุคลากร' },
  'director': { bg: 'bg-blue-100 border border-blue-300', text: 'text-blue-700', label: 'ผอ.กลุ่มงาน' },
  'central_office_staff': { bg: 'bg-amber-100 border border-amber-300', text: 'text-amber-700', label: 'หน.ฝ่ายบริหารฯ' },
  'central_office_head': { bg: 'bg-orange-100 border border-orange-300', text: 'text-orange-700', label: 'ผอ.กอก.' },
  'admin': { bg: 'bg-rose-100 border border-rose-300', text: 'text-rose-700', label: 'ผู้ดูแลระบบ' },
};

// Department mapping - ตัวย่อภาษาไทย (ตาม database จริง)
const DEPARTMENT_CODES = {
  'GOK': { short: 'กอก.', full: 'กลุ่มงานอำนวยการ', color: 'bg-blue-100 text-blue-800 border border-blue-200' },
  'GYS': { short: 'กยส.', full: 'กลุ่มงานยุทธศาสตร์สารสนเทศและการสื่อสาร', color: 'bg-purple-100 text-purple-800 border border-purple-200' },
  'GTS': { short: 'กทส.', full: 'กลุ่มงานเทคโนโลยีสารสนเทศ', color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  'GTP': { short: 'กตป.', full: 'กลุ่มงานติดตามประเมินผลด้านสารสนเทศและการสื่อสาร', color: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
  'GSS': { short: 'กสส.', full: 'กลุ่มงานเทคโนโลยีการสื่อสาร', color: 'bg-teal-100 text-teal-800 border border-teal-200' },
  'GKC': { short: 'กคช.', full: 'กลุ่มงานโครงสร้างพื้นฐานด้านสารสนเทศและการสื่อสาร', color: 'bg-cyan-100 text-cyan-800 border border-cyan-200' },
};

const getDeptInfo = (code) => {
  return DEPARTMENT_CODES[code] || { short: code || '-', full: code || 'ไม่ระบุ', color: 'bg-gray-100 text-gray-700 border border-gray-200' };
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'employee_code', direction: 'asc' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedDepartment, selectedRole, sortConfig]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.employee_code?.toLowerCase().includes(term) ||
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term) ||
        user.position?.toLowerCase().includes(term)
      );
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      result = result.filter(user => user.department_code === selectedDepartment);
    }

    // Role filter
    if (selectedRole !== 'all') {
      result = result.filter(user => user.role_name === selectedRole);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      if (sortConfig.direction === 'asc') {
        return aVal.toString().localeCompare(bVal.toString(), 'th');
      }
      return bVal.toString().localeCompare(aVal.toString(), 'th');
    });

    setFilteredUsers(result);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const getRoleStyle = (roleName) => {
    return ROLE_STYLES[roleName] || ROLE_STYLES['user'];
  };

  // Count by department
  const departmentCounts = users.reduce((acc, user) => {
    const dept = user.department_code || 'ไม่ระบุ';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Count by role
  const roleCounts = users.reduce((acc, user) => {
    const role = user.role_name || 'user';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header - โทนสีเทาสำหรับหน่วยงานราชการ */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/15 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wide">ทะเบียนบุคลากร</h1>
                <p className="text-slate-300 mt-1 text-sm">ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร สป.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-5 py-2 bg-white/10 rounded-xl">
                <p className="text-3xl font-bold text-white">{users.length}</p>
                <p className="text-slate-300 text-xs">บุคลากรทั้งหมด</p>
              </div>
              <button 
                onClick={fetchUsers}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition-colors font-semibold shadow-lg"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats & Filters Combined Section */}
        <div className="bg-white rounded-xl shadow-md border overflow-hidden">
          {/* Stats Row */}
          <div className="grid grid-cols-6 border-b">
            {Object.entries(ROLE_STYLES).map(([role, style], index) => (
              <div 
                key={role} 
                className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${index < 5 ? 'border-r' : ''} ${selectedRole === role ? 'bg-slate-100' : ''}`}
                onClick={() => setSelectedRole(selectedRole === role ? 'all' : role)}
              >
                <div className="text-center">
                  <p className="text-xs text-slate-500 font-medium mb-1">{style.label}</p>
                  <p className="text-3xl font-bold text-slate-800">{roleCounts[role] || 0}</p>
                </div>
              </div>
            ))}
            <div className="p-4 bg-gradient-to-br from-slate-700 to-slate-800 text-white">
              <div className="text-center">
                <p className="text-xs text-slate-300 font-medium mb-1">รวมทั้งหมด</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="p-4 bg-slate-50">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยรหัส, ชื่อ-นามสกุล, ตำแหน่ง..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Department Filter */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 bg-white min-w-[200px] font-medium"
              >
                <option value="all">ทุกกลุ่มงาน ({users.length})</option>
                {Object.entries(DEPARTMENT_CODES).map(([code, info]) => (
                  departmentCounts[code] > 0 && (
                    <option key={code} value={code}>
                      {info.short} {info.full} ({departmentCounts[code] || 0})
                    </option>
                  )
                ))}
              </select>

              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 bg-white min-w-[150px] font-medium"
              >
                <option value="all">ทุกบทบาท</option>
                {Object.entries(ROLE_STYLES).map(([role, style]) => (
                  <option key={role} value={role}>
                    {style.label} ({roleCounts[role] || 0})
                  </option>
                ))}
              </select>

              {/* Clear Filters */}
              {(searchTerm || selectedDepartment !== 'all' || selectedRole !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDepartment('all');
                    setSelectedRole('all');
                  }}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-2 font-medium bg-white"
                >
                  <X className="w-4 h-4" />
                  ล้าง
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <Card className="shadow-lg border overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b px-6 py-4">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-600" />
              รายชื่อบุคลากร 
              <span className="text-blue-600 font-bold">({filteredUsers.length} ราย)</span>
              {filteredUsers.length !== users.length && (
                <span className="text-slate-400 text-sm font-normal ml-2">
                  จากทั้งหมด {users.length} ราย
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                  <p className="text-slate-500 mt-4">กำลังโหลดข้อมูล...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">ไม่พบข้อมูลบุคลากร</p>
                <p className="text-sm mt-1">ลองเปลี่ยนเงื่อนไขการค้นหา</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-12">
                        ลำดับ
                      </th>
                      <th 
                        className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-500 transition-colors"
                        onClick={() => handleSort('employee_code')}
                      >
                        <div className="flex items-center justify-center gap-2">
                          รหัสบุคลากร
                          {sortConfig.key === 'employee_code' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-500 transition-colors"
                        onClick={() => handleSort('first_name')}
                      >
                        <div className="flex items-center gap-2">
                          ชื่อ-นามสกุล
                          {sortConfig.key === 'first_name' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        ตำแหน่ง
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        สังกัด
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        บทบาท
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        วันลาคงเหลือ
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-20">
                        ดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.map((user, index) => {
                      const roleStyle = getRoleStyle(user.role_name);
                      const deptInfo = getDeptInfo(user.department_code);
                      return (
                        <tr 
                          key={user.id} 
                          className={`hover:bg-slate-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                        >
                          <td className="px-4 py-3 text-center text-slate-500 text-sm font-medium">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg text-sm border border-slate-300">
                              {user.employee_code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-bold shadow-md text-sm">
                                {user.first_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {user.title}{user.first_name} {user.last_name}
                                </p>
                                {user.phone && (
                                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Phone className="w-3 h-3" /> {user.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-700 text-sm">{user.position || '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${deptInfo.color}`} title={deptInfo.full}>
                              {deptInfo.short}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${roleStyle.bg} ${roleStyle.text}`}>
                              {roleStyle.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {user.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                <Check className="w-3 h-3" />
                                ปฏิบัติงาน
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                <X className="w-3 h-3" />
                                ไม่ปฏิบัติงาน
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold border border-blue-200" title="ลาป่วย">
                                ป.{user.sick_leave_balance || 0}
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold border border-emerald-200" title="ลากิจ">
                                ก.{user.personal_leave_balance || 0}
                              </span>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-semibold border border-amber-200" title="ลาพักผ่อน">
                                พ.{user.vacation_leave_balance || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleViewDetail(user)}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 border border-transparent hover:border-blue-200"
                                title="ดูรายละเอียด"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  ข้อมูลบุคลากร
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Profile Header */}
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {selectedUser.first_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900">
                      {selectedUser.title}{selectedUser.first_name} {selectedUser.last_name}
                    </h4>
                    <p className="text-slate-600 font-medium">{selectedUser.position || 'ไม่ระบุตำแหน่ง'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${getRoleStyle(selectedUser.role_name).bg} ${getRoleStyle(selectedUser.role_name).text}`}>
                        {getRoleStyle(selectedUser.role_name).label}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getDeptInfo(selectedUser.department_code).color}`}>
                        {getDeptInfo(selectedUser.department_code).short}
                      </span>
                      {selectedUser.is_active ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 border border-green-200">✓ ปฏิบัติงาน</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200">✗ ไม่ปฏิบัติงาน</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-600 font-semibold mb-1">รหัสบุคลากร</p>
                    <p className="text-xl font-bold text-slate-900 font-mono">{selectedUser.employee_code}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <p className="text-sm text-purple-600 font-semibold mb-1">สังกัด</p>
                    <p className="text-lg font-bold text-slate-900">
                      {getDeptInfo(selectedUser.department_code).full}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-600 font-semibold mb-1">หมายเลขโทรศัพท์</p>
                    <p className="text-lg font-bold text-slate-900">{selectedUser.phone || '-'}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-sm text-emerald-600 font-semibold mb-1">ตำแหน่ง</p>
                    <p className="text-lg font-bold text-slate-900">{selectedUser.position || '-'}</p>
                  </div>
                </div>

                {/* Leave Balance */}
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                  <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-slate-600" />
                    สิทธิการลาคงเหลือ ประจำปีงบประมาณ พ.ศ. {new Date().getFullYear() + 543}
                  </h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border-2 border-blue-200">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-blue-300">
                        <FileText className="w-7 h-7 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-600">{selectedUser.sick_leave_balance || 0}</p>
                      <p className="text-sm text-slate-600 mt-1 font-medium">วันลาป่วย</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border-2 border-emerald-200">
                      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-emerald-300">
                        <FileText className="w-7 h-7 text-emerald-600" />
                      </div>
                      <p className="text-3xl font-bold text-emerald-600">{selectedUser.personal_leave_balance || 0}</p>
                      <p className="text-sm text-slate-600 mt-1 font-medium">วันลากิจ</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border-2 border-amber-200">
                      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-amber-300">
                        <FileText className="w-7 h-7 text-amber-600" />
                      </div>
                      <p className="text-3xl font-bold text-amber-600">{selectedUser.vacation_leave_balance || 0}</p>
                      <p className="text-sm text-slate-600 mt-1 font-medium">วันลาพักผ่อน</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default UserManagementPage;
