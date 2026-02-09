/**
 * ============================================
 * Settings Page - ตั้งค่าการแจ้งเตือน
 * ออกแบบสำหรับระบบราชการ
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../api/auth.api';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';
import { 
  Settings, 
  Mail, 
  Bell, 
  Save, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  IdCard,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current settings from user profile
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setEmailNotifications(user.emailNotifications ?? true);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email format
    if (email && !email.includes('@')) {
      toast.error('รูปแบบ Email ไม่ถูกต้อง');
      return;
    }

    setLoading(true);
    setSaved(false);

    try {
      await authAPI.updateNotificationSettings(email, emailNotifications);
      
      // Refresh user data to get updated settings
      if (refreshUser) {
        await refreshUser();
      }
      
      setSaved(true);
      toast.success('บันทึกการตั้งค่าสำเร็จ');
      
      // Reset saved state after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  // Get role display name
  const getRoleDisplayName = (roleName) => {
    const roleMap = {
      'user': 'พนักงาน',
      'director': 'ผู้อำนวยการกอง',
      'central_staff': 'เจ้าหน้าที่สำนักงานกลาง',
      'central_head': 'หัวหน้าสำนักงานกลาง',
      'admin': 'ผู้ดูแลระบบ'
    };
    return roleMap[roleName] || roleName;
  };

  return (
    <MainLayout>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">กลับหน้าหลัก</span>
          </button>

          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">ตั้งค่าบัญชี</h1>
              <p className="text-slate-500 mt-1">จัดการข้อมูลส่วนตัวและการแจ้งเตือน</p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          {/* Header Banner */}
          <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
            <div className="absolute inset-0 opacity-50"></div>
          </div>
          
          {/* Profile Content */}
          <div className="px-8 pb-8 -mt-12 relative">
            {/* Avatar */}
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            {/* User Name */}
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{user?.fullName}</h2>
            <p className="text-slate-500 mb-6">{user?.position}</p>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <IdCard className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-slate-500">รหัสพนักงาน</span>
                </div>
                <p className="text-lg font-bold text-slate-800 font-mono">{user?.employeeCode}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm text-slate-500">สังกัด</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{getDepartmentThaiCode(user?.department)}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-slate-500">ตำแหน่ง</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{user?.position}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-slate-500">ระดับสิทธิ์</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{getRoleDisplayName(user?.role_name)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Notification Settings Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">การแจ้งเตือนทาง Email</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  รับการแจ้งเตือนเมื่อใบลาของท่านถูกพิจารณา
                </p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Email สำหรับรับการแจ้งเตือน
                </label>
                <div className="relative max-w-lg">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="กรอก Email ของท่าน เช่น name@example.com"
                    className="w-full px-4 py-3 pl-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-slate-500 mt-2 ml-1">
                  ระบบจะส่ง Email แจ้งเตือนเมื่อใบลาของท่านได้รับการอนุมัติหรือไม่อนุมัติ
                </p>
              </div>

              {/* Toggle Notifications */}
              <div className="max-w-lg">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${emailNotifications ? 'bg-green-100' : 'bg-slate-200'} transition-colors`}>
                      <Bell className={`w-5 h-5 ${emailNotifications ? 'text-green-600' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">เปิดรับการแจ้งเตือน</p>
                      <p className="text-sm text-slate-500">รับ Email เมื่อมีการอัพเดทสถานะใบลา</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* Warning Box - No Email */}
              {!email && emailNotifications && (
                <div className="max-w-lg flex items-start gap-4 p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800">ยังไม่ได้ระบุ Email</p>
                    <p className="text-sm text-amber-700 mt-1">
                      กรุณากรอก Email เพื่อรับการแจ้งเตือนเมื่อใบลาของท่านได้รับการพิจารณา
                    </p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {saved && (
                <div className="max-w-lg flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="font-medium text-green-800">บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  บันทึกการตั้งค่า
                </Button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  กลับหน้าหลัก
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>ระบบลาออนไลน์ สำหรับข้าราชการและเจ้าหน้าที่</p>
        </div>

      </div>
    </div>
    </MainLayout>
  );
};

export default SettingsPage;
