import { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Edit2, Trash2, UserPlus, 
  Shield, Building, Phone, Mail, ChevronDown, ChevronUp,
  Eye, EyeOff, Check, X, RefreshCw, Download, MoreHorizontal,
  Calendar, Clock, FileText, AlertCircle, Award, Briefcase,
  Key, Power, PowerOff, Save, UserCircle, RotateCcw, PlayCircle,
  AlertTriangle, Sparkles, CheckCircle2, XCircle, Info, Archive
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
  
  // Tab state - 'current' หรือ 'archived'
  const [activeTab, setActiveTab] = useState('current');
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [showArchivedDetailModal, setShowArchivedDetailModal] = useState(false);
  const [selectedArchivedUser, setSelectedArchivedUser] = useState(null);
  const [archivedUserLeaves, setArchivedUserLeaves] = useState([]);
  
  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState('deactivate'); // 'deactivate' | 'archive' | 'permanent'
  const [deleteReason, setDeleteReason] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showLeaveBalanceModal, setShowLeaveBalanceModal] = useState(false);
  const [showCarryoverModal, setShowCarryoverModal] = useState(false);
  const [carryoverProcessing, setCarryoverProcessing] = useState(false);
  const [carryoverResults, setCarryoverResults] = useState(null);
  
  // Custom Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    icon: null,
    iconBg: '',
    confirmText: 'ยืนยัน',
    confirmColor: 'bg-red-500 hover:bg-red-600',
    onConfirm: null
  });
  
  // Form states - ค่าเริ่มต้นตามระเบียบสำนักนายกฯ พ.ศ. 2555
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
    hire_date: '',                // วันเริ่มรับราชการ
    sick_leave_balance: 60,       // สูงสุด 60 วัน/ปี
    personal_leave_balance: 15,   // ปีแรก 15 วัน
    vacation_leave_balance: 10    // 10 วัน/ปี
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

  // Fetch archived users when tab changes
  useEffect(() => {
    if (activeTab === 'archived' && archivedUsers.length === 0) {
      fetchArchivedUsers();
    }
  }, [activeTab]);

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

  // Fetch archived users
  const fetchArchivedUsers = async () => {
    try {
      setArchivedLoading(true);
      const response = await adminAPI.getArchivedUsers();
      setArchivedUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching archived users:', error);
      toast.error('ไม่สามารถโหลดข้อมูลบุคลากรที่เก็บถาวรได้');
    } finally {
      setArchivedLoading(false);
    }
  };

  // View archived user details (leave history)
  const handleViewArchivedUser = async (archivedUser) => {
    try {
      setSelectedArchivedUser(archivedUser);
      const response = await adminAPI.getArchivedUserLeaves(archivedUser.id);
      setArchivedUserLeaves(response.data?.leaves || []);
      setShowArchivedDetailModal(true);
    } catch (error) {
      console.error('Error fetching archived user leaves:', error);
      toast.error('ไม่สามารถโหลดประวัติการลาได้');
    }
  };

  // Delete archived user permanently
  const handleDeleteArchivedUser = async (archivedUser) => {
    if (!confirm(`ต้องการลบข้อมูล ${archivedUser.full_name} ออกถาวรหรือไม่?\nการดำเนินการนี้ไม่สามารถกู้คืนได้`)) {
      return;
    }
    try {
      await adminAPI.deleteArchivedUser(archivedUser.id);
      toast.success('ลบข้อมูลถาวรสำเร็จ');
      setArchivedUsers(prev => prev.filter(u => u.id !== archivedUser.id));
    } catch (error) {
      console.error('Error deleting archived user:', error);
      toast.error('ไม่สามารถลบข้อมูลได้');
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
      hire_date: '',              // วันเริ่มรับราชการ
      sick_leave_balance: 60,      // สูงสุด 60 วัน/ปี
      personal_leave_balance: 15,  // ปีแรก 15 วัน
      vacation_leave_balance: 10   // 10 วัน/ปี
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

  const handleDeleteUser = async () => {
    try {
      setSubmitting(true);
      await adminAPI.deleteUser(selectedUser.id, deleteMode, deleteReason);
      
      const messages = {
        deactivate: 'ปิดการใช้งานบุคลากรสำเร็จ',
        archive: 'ลบบุคลากรและเก็บข้อมูลสำเร็จ',
        permanent: 'ลบบุคลากรถาวรสำเร็จ'
      };
      toast.success(messages[deleteMode]);
      setShowDeleteModal(false);
      setDeleteMode('deactivate');
      setDeleteReason('');
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

  // ================================
  // Vacation Carryover Functions
  // ================================
  
  // คำนวณปีงบประมาณไทย (1 ต.ค. - 30 ก.ย.)
  const getCurrentFiscalYear = () => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear() + 543;
    return month >= 9 ? year + 1 : year;
  };

  // ยกยอดวันลาพักผ่อนสำหรับทุกคน
  const handleProcessAllCarryover = async (force = false) => {
    try {
      setCarryoverProcessing(true);
      const result = await adminAPI.processAllVacationCarryover(force);
      setCarryoverResults(result.data);
      toast.success(`ยกยอดวันลาสำเร็จ ${result.data.processed} คน`);
      fetchData();
    } catch (error) {
      console.error('Process carryover error:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถยกยอดวันลาได้');
    } finally {
      setCarryoverProcessing(false);
    }
  };

  // Reset วันลาประจำปี (ลาป่วย, ลากิจ)
  const handleResetAnnualLeave = async () => {
    try {
      setCarryoverProcessing(true);
      const result = await adminAPI.resetAnnualLeaveBalance();
      toast.success(`Reset วันลาประจำปีสำเร็จ ${result.data.updated_count} คน`);
      fetchData();
    } catch (error) {
      console.error('Reset annual leave error:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถ Reset วันลาได้');
    } finally {
      setCarryoverProcessing(false);
    }
  };

  // ยกเลิกการยกยอดวันลาพักผ่อน (กลับเป็น 10 วัน, ยกยอด 0)
  const handleResetVacationCarryover = () => {
    setConfirmModal({
      show: true,
      title: 'ยกเลิกการยกยอดวันลาพักผ่อน',
      message: 'ระบบจะ Reset วันลาพักผ่อนเป็นค่าเริ่มต้น',
      details: [
        { label: 'วันลาพักผ่อน', value: '10 วัน' },
        { label: 'ยกยอด', value: '0 วัน' }
      ],
      warning: 'การดำเนินการนี้จะมีผลกับบุคลากรทุกคน',
      icon: <AlertTriangle className="w-8 h-8" />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmText: 'ยืนยันยกเลิกการยกยอด',
      confirmColor: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      onConfirm: async () => {
        try {
          setCarryoverProcessing(true);
          setConfirmModal(prev => ({ ...prev, show: false }));
          const result = await adminAPI.resetVacationCarryover();
          setCarryoverResults(null);
          toast.success(
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>ยกเลิกการยกยอดสำเร็จ <strong>{result.data.updated_count}</strong> คน</span>
            </div>
          );
          fetchData();
        } catch (error) {
          console.error('Reset vacation carryover error:', error);
          toast.error(
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span>{error.response?.data?.message || 'ไม่สามารถยกเลิกการยกยอดได้'}</span>
            </div>
          );
        } finally {
          setCarryoverProcessing(false);
        }
      }
    });
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
                <p className="text-3xl font-bold text-white">{activeTab === 'current' ? users.length : archivedUsers.length}</p>
                <p className="text-slate-300 text-xs">{activeTab === 'current' ? 'บุคลากรทั้งหมด' : 'ข้อมูลที่เก็บถาวร'}</p>
              </div>
              {activeTab === 'current' && (
                <>
                  <button 
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-semibold shadow-lg"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>เพิ่มบุคลากร</span>
                  </button>
                  <button 
                    onClick={() => setShowCarryoverModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors font-semibold shadow-lg"
                    title="ยกยอดวันลาพักผ่อนประจำปี"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>ยกยอดวันลา</span>
                  </button>
                </>
              )}
              <button 
                onClick={activeTab === 'current' ? fetchData : fetchArchivedUsers}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition-colors font-semibold shadow-lg"
              >
                <RefreshCw className={`w-5 h-5 ${(activeTab === 'current' ? loading : archivedLoading) ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white rounded-xl shadow-md border p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'current'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>บุคลากรปัจจุบัน</span>
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">{users.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'archived'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-5 h-5" />
            <span>ข้อมูลที่เก็บถาวร</span>
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">{archivedUsers.length}</span>
          </button>
        </div>

        {activeTab === 'current' ? (
          <>
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
                              <span 
                                className={`px-2 py-0.5 rounded text-xs font-semibold border ${user.vacation_carryover > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`} 
                                title={user.vacation_carryover > 0 ? `ลาพักผ่อน (ปีนี้ ${user.vacation_leave_balance || 0} + ยกยอด ${user.vacation_carryover})` : 'ลาพักผ่อน'}
                              >
                                พ.{user.total_vacation_balance || (user.vacation_leave_balance || 0) + (user.vacation_carryover || 0)}
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
          </>
        ) : (
          /* Archived Users Tab */
          <Card className="shadow-lg border overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Archive className="w-5 h-5" />
                บุคลากรที่เก็บถาวร
                <span className="ml-2 text-sm font-normal text-slate-300">({archivedUsers.length} รายการ)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {archivedLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 animate-spin text-slate-500" />
                </div>
              ) : archivedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Archive className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="text-lg font-medium">ไม่มีข้อมูลบุคลากรที่เก็บถาวร</p>
                  <p className="text-sm text-slate-400 mt-1">เมื่อลบบุคลากรแบบ "ลบและเก็บข้อมูล" ข้อมูลจะแสดงที่นี่</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ลำดับ</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">รหัส</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ตำแหน่ง</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">สังกัด</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">บทบาท</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">วันที่เก็บถาวร</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">เหตุผล</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">ดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {archivedUsers.map((user, index) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm font-bold text-slate-700">{user.employee_code}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {user.first_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{user.title}{user.first_name} {user.last_name}</p>
                                {user.phone && <p className="text-xs text-slate-500">{user.phone}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.position || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                              {DEPARTMENT_CODES[user.department]?.short || user.department || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
                              {ROLE_STYLES[user.role_name]?.label || user.role_name || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {user.archived_at ? new Date(user.archived_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 max-w-[150px] truncate" title={user.archive_reason}>
                            {user.archive_reason || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewArchivedUser(user)}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                                title="ดูประวัติการลา"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteArchivedUser(user)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                title="ลบถาวร"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                      <p className="text-3xl font-bold text-emerald-600">{selectedUser.total_vacation_balance || (selectedUser.vacation_leave_balance || 0) + (selectedUser.vacation_carryover || 0)}</p>
                      <p className="text-sm text-slate-600 mt-1 font-medium">วันลาพักผ่อน</p>
                      {(selectedUser.vacation_carryover > 0) && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          (ปีนี้ {selectedUser.vacation_leave_balance || 0} + ยกยอด {selectedUser.vacation_carryover})
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* แสดงข้อมูลอายุราชการ */}
                  {selectedUser.hire_date && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">วันเริ่มรับราชการ:</span> {new Date(selectedUser.hire_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        <span className="ml-3 text-slate-500">
                          (อายุราชการ: {Math.max(0, Math.floor((new Date() - new Date(selectedUser.hire_date)) / (365.25 * 24 * 60 * 60 * 1000)))} ปี)
                        </span>
                      </p>
                    </div>
                  )}
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

                {/* วันเริ่มรับราชการ */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    วันเริ่มรับราชการ
                    <span className="font-normal text-slate-500 ml-1">(ใช้คำนวณสิทธิ์ยกยอดลาพักผ่อน)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    อายุราชการ &lt; 10 ปี: สะสมวันลาพักผ่อนได้สูงสุด 20 วัน | ≥ 10 ปี: สะสมได้สูงสุด 30 วัน
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    สิทธิ์การลาเริ่มต้น (ตามระเบียบสำนักนายกรัฐมนตรี พ.ศ. 2555)
                  </h4>
                  
                  {/* Info Box */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">หมายเหตุ:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                          <li>ลาป่วย: มาแล้วกี่วัน (เริ่มต้น 0 คือยังไม่เคยลา, สูงสุด 60 วัน/ปี)</li>
                          <li>ลากิจ: ปีแรก 15 วัน, ปีต่อไป 45 วัน</li>
                          <li>ลาพักผ่อน: 10 วัน/ปี (ผู้รับราชการยังไม่ถึง 6 เดือนไม่มีสิทธิ์)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        ลาป่วยมาแล้ว (วัน)
                      </label>
                      <input
                        type="number"
                        value={formData.sick_leave_balance}
                        onChange={(e) => setFormData({ ...formData, sick_leave_balance: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400 text-center font-bold text-lg"
                        min="0"
                        max="60"
                      />
                      <p className="text-xs text-slate-500 mt-1 text-center">สูงสุด 60 วัน/ปี</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        ลากิจคงเหลือ (วัน)
                      </label>
                      <input
                        type="number"
                        value={formData.personal_leave_balance}
                        onChange={(e) => setFormData({ ...formData, personal_leave_balance: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400 text-center font-bold text-lg"
                        min="0"
                        max="45"
                      />
                      <p className="text-xs text-slate-500 mt-1 text-center">ปีแรก 15 / ปีต่อไป 45 วัน</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        ลาพักผ่อนคงเหลือ (วัน)
                      </label>
                      <input
                        type="number"
                        value={formData.vacation_leave_balance}
                        onChange={(e) => setFormData({ ...formData, vacation_leave_balance: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400 text-center font-bold text-lg"
                        min="0"
                        max="30"
                      />
                      <p className="text-xs text-slate-500 mt-1 text-center">10 วัน/ปี (สะสมได้ 20-30 วัน)</p>
                    </div>
                  </div>

                  {/* ประเภทลาอื่นๆ */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-semibold text-amber-800 mb-2">ประเภทลาอื่นๆ (ตามสิทธิ์อัตโนมัติ):</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-amber-700">
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>ลาคลอดบุตร: 90 วัน/ครรภ์</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>ลาช่วยภรรยาคลอด: 15 วัน/ครั้ง</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>ลาอุปสมบท: 120 วัน</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>ลาเข้ารับการตรวจเลือก: ตามจำเป็น</span>
                      </div>
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
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between text-white">
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  ลบ / จัดการบุคลากร
                </h3>
                <button onClick={() => { setShowDeleteModal(false); setDeleteMode('deactivate'); setDeleteReason(''); }} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* User Info */}
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

                {/* Delete Options */}
                <div className="space-y-3">
                  <p className="font-semibold text-slate-700">เลือกวิธีการดำเนินการ:</p>
                  
                  {/* Option 1: Deactivate */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${deleteMode === 'deactivate' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input
                      type="radio"
                      name="deleteMode"
                      value="deactivate"
                      checked={deleteMode === 'deactivate'}
                      onChange={(e) => setDeleteMode(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <PowerOff className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-amber-700">ปิดการใช้งาน</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        บุคลากรจะไม่สามารถเข้าสู่ระบบได้ แต่ข้อมูลยังคงอยู่และ<strong>สามารถเปิดใช้งานได้อีกครั้ง</strong>
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Archive */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${deleteMode === 'archive' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input
                      type="radio"
                      name="deleteMode"
                      value="archive"
                      checked={deleteMode === 'archive'}
                      onChange={(e) => setDeleteMode(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Archive className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-700">ลบและเก็บข้อมูล</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        ลบบุคลากรออกจากระบบ แต่<strong>เก็บข้อมูลและประวัติการลาไว้</strong>สำหรับอ้างอิงในอนาคต
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Permanent Delete */}
                  <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${deleteMode === 'permanent' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input
                      type="radio"
                      name="deleteMode"
                      value="permanent"
                      checked={deleteMode === 'permanent'}
                      onChange={(e) => setDeleteMode(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-700">ลบถาวรทั้งหมด</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        ลบบุคลากรและประวัติการลาทั้งหมดออกจากระบบ <strong className="text-red-600">ไม่สามารถกู้คืนได้</strong>
                      </p>
                    </div>
                  </label>
                </div>

                {/* Reason input for archive/permanent */}
                {(deleteMode === 'archive' || deleteMode === 'permanent') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      เหตุผล (ไม่บังคับ)
                    </label>
                    <input
                      type="text"
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="เช่น ลาออก, เกษียณ, โอนย้าย..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Warning for permanent delete */}
                {deleteMode === 'permanent' && (
                  <div className="flex items-start gap-3 p-3 bg-red-100 border border-red-300 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      <strong>คำเตือน:</strong> การดำเนินการนี้จะลบข้อมูลทั้งหมดของบุคลากรออกจากระบบอย่างถาวร รวมถึงประวัติการลาทั้งหมด ไม่สามารถกู้คืนได้
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowDeleteModal(false); setDeleteMode('deactivate'); setDeleteReason(''); }}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    disabled={submitting}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl transition-colors font-semibold disabled:opacity-50 ${
                      deleteMode === 'permanent' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : deleteMode === 'archive'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : deleteMode === 'permanent' ? (
                      <Trash2 className="w-4 h-4" />
                    ) : deleteMode === 'archive' ? (
                      <Archive className="w-4 h-4" />
                    ) : (
                      <PowerOff className="w-4 h-4" />
                    )}
                    {deleteMode === 'permanent' ? 'ลบถาวร' : deleteMode === 'archive' ? 'ลบและเก็บข้อมูล' : 'ปิดการใช้งาน'}
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

        {/* Vacation Carryover Modal - Modern Design */}
        {showCarryoverModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header with gradient and pattern */}
              <div className="relative bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 px-6 py-5 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">จัดการวันลาประจำปี</h3>
                      <p className="text-amber-100 text-sm">ปีงบประมาณ พ.ศ. {getCurrentFiscalYear()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowCarryoverModal(false);
                      setCarryoverResults(null);
                    }} 
                    className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all hover:rotate-90 duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* ข้อมูลปีงบประมาณ */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-800">ปีงบประมาณ พ.ศ. {getCurrentFiscalYear()}</p>
                      <p className="text-sm text-amber-600">1 ต.ค. {getCurrentFiscalYear() - 1} - 30 ก.ย. {getCurrentFiscalYear()}</p>
                    </div>
                  </div>
                </div>

                {/* กฎเกณฑ์วันลา */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-4 shadow-sm">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    กฎเกณฑ์วันลาพักผ่อน
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-3 bg-white/80 rounded-xl border border-blue-100">
                      <p className="text-2xl font-bold text-blue-600">10</p>
                      <p className="text-xs text-slate-600">วัน/ปี</p>
                    </div>
                    <div className="text-center p-3 bg-white/80 rounded-xl border border-blue-100">
                      <p className="text-2xl font-bold text-blue-600">20</p>
                      <p className="text-xs text-slate-600">&lt;10ปี สะสม</p>
                    </div>
                    <div className="text-center p-3 bg-white/80 rounded-xl border border-blue-100">
                      <p className="text-2xl font-bold text-blue-600">30</p>
                      <p className="text-xs text-slate-600">≥10ปี สะสม</p>
                    </div>
                  </div>
                </div>

                {/* แสดงผลลัพธ์ */}
                {carryoverResults && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 rounded-2xl p-4 shadow-sm animate-in slide-in-from-bottom duration-300">
                    <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      ดำเนินการเรียบร้อย
                    </h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-4 bg-white rounded-xl border border-emerald-200 shadow-sm">
                        <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">{carryoverResults.processed}</p>
                        <p className="text-sm text-slate-600 mt-1">สำเร็จ</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-xl border border-red-200 shadow-sm">
                        <p className="text-3xl font-bold text-red-500">{carryoverResults.failed}</p>
                        <p className="text-sm text-slate-600 mt-1">ล้มเหลว</p>
                      </div>
                    </div>
                    {carryoverResults.results?.length > 0 && (
                      <div className="max-h-28 overflow-y-auto space-y-1.5 scrollbar-thin">
                        {carryoverResults.results.slice(0, 5).map((r, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-emerald-100 text-sm">
                            <span className="text-slate-700">{r.name}</span>
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <span className="text-slate-400">{r.new_carryover}+10</span>
                              <span>→</span>
                              <span className="font-bold">{r.total_available} วัน</span>
                            </span>
                          </div>
                        ))}
                        {carryoverResults.results.length > 5 && (
                          <p className="text-center text-slate-500 text-xs pt-1">
                            และอีก {carryoverResults.results.length - 5} คน...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ปุ่มดำเนินการ */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleProcessAllCarryover(false)}
                    disabled={carryoverProcessing}
                    className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl transition-all font-semibold disabled:opacity-50 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                  >
                    {carryoverProcessing ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    <span>ยกยอดวันลาพักผ่อน</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">เฉพาะคนที่ยังไม่ได้ยกยอด</span>
                  </button>
                  
                  <button
                    onClick={() => handleProcessAllCarryover(true)}
                    disabled={carryoverProcessing}
                    className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all font-semibold disabled:opacity-50 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                  >
                    {carryoverProcessing ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    )}
                    <span>บังคับยกยอดทุกคน</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Reset ใหม่</span>
                  </button>

                  <div className="border-t border-slate-200 pt-3">
                    <button
                      onClick={handleResetAnnualLeave}
                      disabled={carryoverProcessing}
                      className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl transition-all font-semibold disabled:opacity-50 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                    >
                      {carryoverProcessing ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                      )}
                      Reset ลาป่วย/ลากิจ ประจำปี
                    </button>
                    <p className="text-xs text-slate-400 mt-2 text-center">
                      ลาป่วย = 60 วัน, ลากิจ = 15 วัน
                    </p>
                  </div>

                  {/* ยกเลิกการยกยอด */}
                  <div className="border-t border-slate-200 pt-3">
                    <button
                      onClick={handleResetVacationCarryover}
                      disabled={carryoverProcessing}
                      className="group w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-all font-semibold disabled:opacity-50 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                    >
                      {carryoverProcessing ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      )}
                      ยกเลิกการยกยอด (กลับเป็นเดิม)
                    </button>
                    <p className="text-xs text-slate-400 mt-2 text-center">
                      Reset วันลาพักผ่อน = 10 วัน, ยกยอด = 0 วัน
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCarryoverModal(false);
                    setCarryoverResults(null);
                  }}
                  className="w-full px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archived User Detail Modal */}
        {showArchivedDetailModal && selectedArchivedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Archive className="w-6 h-6" />
                  ข้อมูลบุคลากรที่เก็บถาวร
                </h3>
                <button 
                  onClick={() => setShowArchivedDetailModal(false)} 
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-xl mb-6">
                  <div className="w-16 h-16 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 text-2xl font-bold">
                    {selectedArchivedUser.first_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900">{selectedArchivedUser.title}{selectedArchivedUser.first_name} {selectedArchivedUser.last_name}</p>
                    <p className="text-slate-500">รหัส: {selectedArchivedUser.employee_code}</p>
                    <p className="text-sm text-slate-400">{selectedArchivedUser.position || '-'} • {DEPARTMENT_CODES[selectedArchivedUser.department]?.full || selectedArchivedUser.department}</p>
                  </div>
                </div>

                {/* Archive Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500">วันที่เก็บถาวร</p>
                    <p className="font-semibold text-slate-800">
                      {selectedArchivedUser.archived_at ? new Date(selectedArchivedUser.archived_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500">เหตุผล</p>
                    <p className="font-semibold text-slate-800">{selectedArchivedUser.archive_reason || 'ไม่ระบุ'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500">วันลาป่วยคงเหลือ (ตอนลบ)</p>
                    <p className="font-semibold text-slate-800">{selectedArchivedUser.last_sick_leave_balance || 0} วัน</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500">วันลากิจคงเหลือ (ตอนลบ)</p>
                    <p className="font-semibold text-slate-800">{selectedArchivedUser.last_personal_leave_balance || 0} วัน</p>
                  </div>
                </div>

                {/* Leave History */}
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    ประวัติการลา ({archivedUserLeaves.length} รายการ)
                  </h4>
                  {archivedUserLeaves.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
                      <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p>ไม่มีประวัติการลา</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {archivedUserLeaves.map((leave) => (
                        <div key={leave.id} className="border rounded-xl p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-slate-800">{leave.leave_types?.type_name || 'ไม่ระบุประเภท'}</p>
                              <p className="text-sm text-slate-500">
                                {new Date(leave.start_date).toLocaleDateString('th-TH')} - {new Date(leave.end_date).toLocaleDateString('th-TH')}
                              </p>
                              {leave.reason && (
                                <p className="text-sm text-slate-600 mt-1">
                                  {(() => {
                                    try {
                                      const parsed = JSON.parse(leave.reason);
                                      return parsed.reason || leave.reason;
                                    } catch {
                                      return leave.reason;
                                    }
                                  })()}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                                leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                leave.status === 'cancelled' ? 'bg-slate-100 text-slate-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {leave.status === 'approved' ? 'อนุมัติ' :
                                 leave.status === 'rejected' ? 'ไม่อนุมัติ' :
                                 leave.status === 'cancelled' ? 'ยกเลิก' : 'รอดำเนินการ'}
                              </span>
                              <p className="text-sm text-slate-500 mt-1">{leave.total_days} วัน</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t px-6 py-4 bg-slate-50">
                <button
                  onClick={() => setShowArchivedDetailModal(false)}
                  className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl transition-colors font-semibold"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirm Modal - Modern Design */}
        {confirmModal.show && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Icon Header */}
              <div className="pt-8 pb-4 flex justify-center">
                <div className={`p-4 rounded-full ${confirmModal.iconBg || 'bg-red-100'} animate-in zoom-in duration-300`}>
                  <span className={confirmModal.iconColor || 'text-red-600'}>
                    {confirmModal.icon}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-6 pb-6 text-center">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
                <p className="text-slate-600 mb-4">{confirmModal.message}</p>
                
                {/* Details */}
                {confirmModal.details && (
                  <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2">
                    {confirmModal.details.map((detail, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-slate-600">{detail.label}</span>
                        <span className="font-bold text-slate-800">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Warning */}
                {confirmModal.warning && (
                  <div className="flex items-center gap-2 justify-center text-amber-600 bg-amber-50 rounded-lg px-4 py-2.5 mb-4">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{confirmModal.warning}</span>
                  </div>
                )}
                
                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                    className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className={`flex-1 px-4 py-3 text-white rounded-xl transition-all font-semibold shadow-lg ${confirmModal.confirmColor}`}
                  >
                    {confirmModal.confirmText}
                  </button>
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
