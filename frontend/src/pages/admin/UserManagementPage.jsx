import { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Edit2, Trash2, UserPlus, 
  Shield, Building, Phone, Mail, ChevronDown, ChevronUp,
  Eye, EyeOff, Check, X, RefreshCw, Download, MoreHorizontal,
  Calendar, Clock, FileText, AlertCircle, Award, Briefcase,
  Key, Power, PowerOff, Save, UserCircle
} from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { adminAPI } from '../../api/admin.api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Role badge colors - โทนสีเรียบ minimal
const ROLE_STYLES = {
  'user': { bg: 'bg-slate-100 border border-slate-300', text: 'text-slate-700', label: 'บุคลากร' },
  'director': { bg: 'bg-slate-200 border border-slate-400', text: 'text-slate-800', label: 'ผอ.กลุ่มงาน' },
  'central_office_staff': { bg: 'bg-slate-300 border border-slate-400', text: 'text-slate-800', label: 'หน.ฝ่ายบริหารฯ' },
  'central_office_head': { bg: 'bg-slate-400 border border-slate-500', text: 'text-white', label: 'ผอ.กอก.' },
  'admin': { bg: 'bg-slate-700 border border-slate-800', text: 'text-white', label: 'ผู้ดูแลระบบ' },
};

// Department mapping - ตัวย่อภาษาไทย (ตาม database จริง)
const DEPARTMENT_CODES = {
  'GOK': { short: 'กอก.', full: 'กลุ่มงานอำนวยการ', color: 'bg-slate-100 text-slate-700 border border-slate-300' },
  'GYS': { short: 'กยส.', full: 'กลุ่มงานยุทธศาสตร์สารสนเทศและการสื่อสาร', color: 'bg-slate-100 text-slate-700 border border-slate-300' },
  'GTS': { short: 'กทส.', full: 'กลุ่มงานเทคโนโลยีสารสนเทศ', color: 'bg-slate-100 text-slate-700 border border-slate-300' },
  'GTP': { short: 'กตป.', full: 'กลุ่มงานติดตามประเมินผลด้านสารสนเทศและการสื่อสาร', color: 'bg-slate-100 text-slate-700 border border-slate-300' },
  'GSS': { short: 'กสส.', full: 'กลุ่มงานเทคโนโลยีการสื่อสาร', color: 'bg-slate-100 text-slate-700 border border-slate-300' },
  'GKC': { short: 'กคฐ.', full: 'กลุ่มงานโครงสร้างพื้นฐานด้านสารสนเทศและการสื่อสาร', color: 'bg-slate-100 text-slate-700 border border-slate-300' },
};

const TITLES = ['นาย', 'นาง', 'นางสาว', 'น.ส.', 'ดร.', 'ผศ.', 'รศ.', 'ศ.'];

const getDeptInfo = (code) => {
  return DEPARTMENT_CODES[code] || { short: code || '-', full: code || 'ไม่ระบุ', color: 'bg-gray-100 text-gray-700 border border-gray-200' };
};

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'employee_code', direction: 'asc' });
  
  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showLeaveBalanceModal, setShowLeaveBalanceModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    employee_code: '',
    password: '',
    title: 'นาย',
    first_name: '',
    last_name: '',
    position: '',
    department: 'GOK',
    phone: '',
    email: '',
    role_id: '',
    sick_leave_balance: 30,
    personal_leave_balance: 0,
    vacation_leave_balance: 10
  });
  const [newPassword, setNewPassword] = useState('');
  const [leaveBalanceData, setLeaveBalanceData] = useState({ sick: 0, personal: 0, vacation: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedDepartment, selectedRole, sortConfig]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getAllRoles()
      ]);
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.employee_code?.toLowerCase().includes(term) ||
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term) ||
        user.position?.toLowerCase().includes(term)
      );
    }

    if (selectedDepartment !== 'all') {
      result = result.filter(user => user.department_code === selectedDepartment);
    }

    if (selectedRole !== 'all') {
      result = result.filter(user => user.role_name === selectedRole);
    }

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

  const handleOpenCreateModal = () => {
    setFormData({
      employee_code: '',
      password: '',
      title: 'นาย',
      first_name: '',
      last_name: '',
      position: '',
      department: 'GOK',
      phone: '',
      email: '',
      role_id: roles.find(r => r.role_name === 'user')?.id || '',
      sick_leave_balance: 30,
      personal_leave_balance: 0,
      vacation_leave_balance: 10
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      title: user.title || 'นาย',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      position: user.position || '',
      department: user.department_code || 'GOK',
      phone: user.phone || '',
      email: user.email || '',
      role_id: roles.find(r => r.role_name === user.role_name)?.id || ''
    });
    setShowEditModal(true);
  };

  const handleOpenDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleOpenResetPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowResetPasswordModal(true);
  };

  const handleOpenLeaveBalanceModal = (user) => {
    setSelectedUser(user);
    setLeaveBalanceData({
      sick: user.sick_leave_balance || 0,
      personal: user.personal_leave_balance || 0,
      vacation: user.vacation_leave_balance || 0
    });
    setShowLeaveBalanceModal(true);
  };

  // CRUD Operations
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.employee_code || !formData.password || !formData.first_name || !formData.last_name || !formData.role_id) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบ');
      return;
    }

    try {
      setSubmitting(true);
      await adminAPI.createUser(formData);
      toast.success('สร้างบุคลากรใหม่สำเร็จ');
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      console.error('Create user error:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถสร้างบุคลากรได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminAPI.updateUser(selectedUser.id, formData);
      toast.success('อัพเดตข้อมูลสำเร็จ');
      setShowEditModal(false);
      fetchData();
    } catch (error) {
      console.error('Update user error:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถอัพเดตข้อมูลได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (permanent = false) => {
    try {
      setSubmitting(true);
      await adminAPI.deleteUser(selectedUser.id, permanent);
      toast.success(permanent ? 'ลบบุคลากรถาวรสำเร็จ' : 'ปิดการใช้งานบุคลากรสำเร็จ');
      setShowDeleteModal(false);
      fetchData();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถดำเนินการได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateUser = async (user) => {
    try {
      await adminAPI.activateUser(user.id);
      toast.success('เปิดการใช้งานบุคลากรสำเร็จ');
      fetchData();
    } catch (error) {
      console.error('Activate user error:', error);
      toast.error('ไม่สามารถเปิดการใช้งานได้');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      setSubmitting(true);
      await adminAPI.resetUserPassword(selectedUser.id, newPassword);
      toast.success('รีเซ็ตรหัสผ่านสำเร็จ');
      setShowResetPasswordModal(false);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('ไม่สามารถรีเซ็ตรหัสผ่านได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLeaveBalance = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await adminAPI.updateLeaveBalance(selectedUser.id, {
        sick_leave_balance: leaveBalanceData.sick,
        personal_leave_balance: leaveBalanceData.personal,
        vacation_leave_balance: leaveBalanceData.vacation
      });
      toast.success('อัพเดตวันลาสำเร็จ');
      setShowLeaveBalanceModal(false);
      fetchData();
    } catch (error) {
      console.error('Update leave balance error:', error);
      toast.error('ไม่สามารถอัพเดตวันลาได้');
    } finally {
      setSubmitting(false);
    }
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
        {/* Header */}
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
                onClick={handleOpenCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-semibold shadow-lg"
              >
                <UserPlus className="w-5 h-5" />
                <span>เพิ่มบุคลากร</span>
              </button>
              <button 
                onClick={fetchData}
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
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-32">
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
                              {user.profile_image_url ? (
                                <img 
                                  src={user.profile_image_url} 
                                  alt="Profile" 
                                  className="w-10 h-10 rounded-full object-cover shadow-md border border-slate-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-bold shadow-md text-sm">
                                  {user.first_name?.charAt(0) || 'U'}
                                </div>
                              )}
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
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
                                <Check className="w-3 h-3" />
                                ปฏิบัติงาน
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                                <X className="w-3 h-3" />
                                ไม่ใช้งาน
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold border border-slate-300" title="ลาป่วย">
                                ป.{user.sick_leave_balance || 0}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold border border-slate-300" title="ลากิจ">
                                ก.{user.personal_leave_balance || 0}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold border border-slate-300" title="ลาพักผ่อน">
                                พ.{user.vacation_leave_balance || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewDetail(user)}
                                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                                title="ดูรายละเอียด"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                                title="แก้ไข"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenResetPasswordModal(user)}
                                className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors text-amber-600"
                                title="รีเซ็ตรหัสผ่าน"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenLeaveBalanceModal(user)}
                                className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600"
                                title="แก้ไขวันลา"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                              {user.id === currentUser?.id ? (
                                <span 
                                  className="p-1.5 text-slate-300 cursor-not-allowed"
                                  title="บัญชีตัวเอง"
                                >
                                  <UserCircle className="w-4 h-4" />
                                </span>
                              ) : user.is_active ? (
                                <button
                                  onClick={() => handleOpenDeleteModal(user)}
                                  className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                  title="ปิดการใช้งาน"
                                >
                                  <PowerOff className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivateUser(user)}
                                  className="p-1.5 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                                  title="เปิดการใช้งาน"
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              )}
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
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  ข้อมูลบุคลากร
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Profile Header */}
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border">
                  {selectedUser.profile_image_url ? (
                    <img 
                      src={selectedUser.profile_image_url} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-white"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {selectedUser.first_name?.charAt(0) || 'U'}
                    </div>
                  )}
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
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">✓ ปฏิบัติงาน</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-300">✗ ไม่ใช้งาน</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-500 font-semibold mb-1">รหัสบุคลากร</p>
                    <p className="text-xl font-bold text-slate-900 font-mono">{selectedUser.employee_code}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-500 font-semibold mb-1">สังกัด</p>
                    <p className="text-lg font-bold text-slate-900">
                      {getDeptInfo(selectedUser.department_code).full}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-500 font-semibold mb-1">หมายเลขโทรศัพท์</p>
                    <p className="text-lg font-bold text-slate-900">{selectedUser.phone || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-500 font-semibold mb-1">ตำแหน่ง</p>
                    <p className="text-lg font-bold text-slate-900">{selectedUser.position || '-'}</p>
                  </div>
                </div>

                {/* Email Section */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-slate-500" />
                    <p className="text-sm text-slate-500 font-semibold">อีเมล</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{selectedUser.email || 'ไม่ได้ระบุอีเมล'}</p>
                  {selectedUser.email && (
                    <p className="text-sm text-slate-500 mt-1">
                      การแจ้งเตือนทางอีเมล: {selectedUser.email_notifications ? '✓ เปิดใช้งาน' : '✗ ปิดใช้งาน'}
                    </p>
                  )}
                </div>

                {/* Leave Balance */}
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                  <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-slate-600" />
                    สิทธิการลาคงเหลือ ประจำปีงบประมาณ พ.ศ. {new Date().getFullYear() + 543}
                  </h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-300">
                        <FileText className="w-7 h-7 text-slate-600" />
                      </div>
                      <p className="text-3xl font-bold text-slate-700">{selectedUser.sick_leave_balance || 0}</p>
                      <p className="text-sm text-slate-600 mt-1 font-medium">วันลาป่วย</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-300">
                        <FileText className="w-7 h-7 text-slate-600" />
                      </div>
                      <p className="text-3xl font-bold text-slate-700">{selectedUser.personal_leave_balance || 0}</p>
                      <p className="text-sm text-slate-600 mt-1 font-medium">วันลากิจ</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-300">
                        <FileText className="w-7 h-7 text-slate-600" />
                      </div>
                      <p className="text-3xl font-bold text-slate-700">{selectedUser.vacation_leave_balance || 0}</p>
                      <p className="text-sm text-slate-600 mt-1 font-medium">วันลาพักผ่อน</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenEditModal(selectedUser);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-semibold"
                  >
                    <Edit2 className="w-4 h-4" />
                    แก้ไขข้อมูล
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenResetPasswordModal(selectedUser);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors font-semibold"
                  >
                    <Key className="w-4 h-4" />
                    รีเซ็ตรหัสผ่าน
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="w-6 h-6" />
                  เพิ่มบุคลากรใหม่
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสพนักงาน *</label>
                    <input
                      type="text"
                      value={formData.employee_code}
                      onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่าน *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">คำนำหน้า</label>
                    <select
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                    >
                      {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อ *</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">นามสกุล *</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">กลุ่มงาน *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                    >
                      {Object.entries(DEPARTMENT_CODES).map(([code, info]) => (
                        <option key={code} value={code}>{info.short} - {info.full}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">อีเมล</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">บทบาท (Role) *</label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                    required
                  >
                    <option value="">-- เลือกบทบาท --</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {ROLE_STYLES[role.role_name]?.label || role.role_name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-slate-700 mb-3">วันลาเริ่มต้น</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">ลาป่วย</label>
                      <input
                        type="number"
                        value={formData.sick_leave_balance}
                        onChange={(e) => setFormData({ ...formData, sick_leave_balance: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">ลากิจ</label>
                      <input
                        type="number"
                        value={formData.personal_leave_balance}
                        onChange={(e) => setFormData({ ...formData, personal_leave_balance: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">ลาพักผ่อน</label>
                      <input
                        type="number"
                        value={formData.vacation_leave_balance}
                        onChange={(e) => setFormData({ ...formData, vacation_leave_balance: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-semibold disabled:opacity-50"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Edit2 className="w-6 h-6" />
                  แก้ไขข้อมูลบุคลากร
                </h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="p-4 bg-slate-100 rounded-xl">
                  <p className="text-sm text-slate-500">รหัสพนักงาน</p>
                  <p className="text-xl font-bold font-mono">{selectedUser.employee_code}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">คำนำหน้า</label>
                    <select
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    >
                      {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">ชื่อ *</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">นามสกุล *</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">กลุ่มงาน *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    >
                      {Object.entries(DEPARTMENT_CODES).map(([code, info]) => (
                        <option key={code} value={code}>{info.short} - {info.full}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">อีเมล</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">บทบาท (Role) *</label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="">-- เลือกบทบาท --</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {ROLE_STYLES[role.role_name]?.label || role.role_name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-semibold disabled:opacity-50"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete/Disable User Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  ยืนยันการดำเนินการ
                </h3>
                <button onClick={() => setShowDeleteModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-xl">
                  {selectedUser.profile_image_url ? (
                    <img src={selectedUser.profile_image_url} alt="Profile" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-500 flex items-center justify-center text-white text-xl font-bold">
                      {selectedUser.first_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{selectedUser.title}{selectedUser.first_name} {selectedUser.last_name}</p>
                    <p className="text-sm text-slate-500">รหัส: {selectedUser.employee_code}</p>
                  </div>
                </div>

                <p className="text-slate-600">
                  คุณต้องการ<span className="font-bold text-red-600">ปิดการใช้งาน</span>บุคลากรนี้หรือไม่?
                </p>
                <p className="text-sm text-slate-500">
                  บุคลากรจะไม่สามารถเข้าสู่ระบบได้จนกว่าจะเปิดใช้งานอีกครั้ง
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(false)}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-semibold disabled:opacity-50"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PowerOff className="w-4 h-4" />}
                    ปิดการใช้งาน
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Key className="w-6 h-6" />
                  รีเซ็ตรหัสผ่าน
                </h3>
                <button onClick={() => setShowResetPasswordModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-xl">
                  {selectedUser.profile_image_url ? (
                    <img src={selectedUser.profile_image_url} alt="Profile" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-500 flex items-center justify-center text-white text-xl font-bold">
                      {selectedUser.first_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{selectedUser.title}{selectedUser.first_name} {selectedUser.last_name}</p>
                    <p className="text-sm text-slate-500">รหัส: {selectedUser.employee_code}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่านใหม่ *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors font-semibold disabled:opacity-50"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    {submitting ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Leave Balance Modal */}
        {showLeaveBalanceModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  แก้ไขวันลาคงเหลือ
                </h3>
                <button onClick={() => setShowLeaveBalanceModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateLeaveBalance} className="p-6 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-xl">
                  {selectedUser.profile_image_url ? (
                    <img src={selectedUser.profile_image_url} alt="Profile" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-500 flex items-center justify-center text-white text-xl font-bold">
                      {selectedUser.first_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{selectedUser.title}{selectedUser.first_name} {selectedUser.last_name}</p>
                    <p className="text-sm text-slate-500">รหัส: {selectedUser.employee_code}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">ลาป่วย</label>
                    <input
                      type="number"
                      value={leaveBalanceData.sick}
                      onChange={(e) => setLeaveBalanceData({ ...leaveBalanceData, sick: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400 text-center"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">ลากิจ</label>
                    <input
                      type="number"
                      value={leaveBalanceData.personal}
                      onChange={(e) => setLeaveBalanceData({ ...leaveBalanceData, personal: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400 text-center"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">ลาพักผ่อน</label>
                    <input
                      type="number"
                      value={leaveBalanceData.vacation}
                      onChange={(e) => setLeaveBalanceData({ ...leaveBalanceData, vacation: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400 text-center"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLeaveBalanceModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-semibold disabled:opacity-50"
                  >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default UserManagementPage;
