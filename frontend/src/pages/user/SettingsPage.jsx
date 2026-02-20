/**
 * ============================================
 * Settings Page - ตั้งค่าบัญชีและเปลี่ยนรหัสผ่าน
 * ออกแบบสำหรับระบบราชการ
 * ============================================
 */

import { useState, useEffect, useRef } from 'react';
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
  Shield,
  Camera,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Load current settings from user profile
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setEmailNotifications(user.emailNotifications ?? true);
    }
  }, [user]);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ขนาดรูปภาพต้องไม่เกิน 2MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          await authAPI.uploadProfileImage(base64);
          toast.success('อัพโหลดรูปโปรไฟล์สำเร็จ');
          if (refreshUser) await refreshUser();
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(error.response?.data?.message || 'ไม่สามารถอัพโหลดรูปภาพได้');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Read file error:', error);
      toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์');
      setUploadingImage(false);
    }
  };

  // Handle image delete - open modal
  const handleDeleteImage = () => {
    if (!user?.profileImageUrl) return;
    setShowDeleteModal(true);
  };

  // Confirm delete image
  const confirmDeleteImage = async () => {
    setShowDeleteModal(false);
    setUploadingImage(true);
    try {
      await authAPI.deleteProfileImage();
      toast.success('ลบรูปโปรไฟล์สำเร็จ');
      if (refreshUser) await refreshUser();
    } catch (error) {
      toast.error('ไม่สามารถลบรูปภาพได้');
    } finally {
      setUploadingImage(false);
    }
  };

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

  // คำนวณอายุราชการ
  const getServiceYears = (startDate) => {
    if (!startDate) return 'ยังไม่ระบุ';
    const start = new Date(startDate);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth();
    const totalMonths = years * 12 + months;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    if (y === 0 && m === 0) return 'น้อยกว่า 1 เดือน';
    if (y === 0) return `${m} เดือน`;
    if (m === 0) return `${y} ปี`;
    return `${y} ปี ${m} เดือน`;
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validate
    if (!currentPassword) {
      toast.error('กรุณากรอกรหัสผ่านปัจจุบัน');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      toast.error('รหัสผ่านใหม่ต้องมีทั้งตัวอักษรและตัวเลข');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChanged(true);
      setTimeout(() => setPasswordChanged(false), 3000);
    } catch (error) {
      console.error('Change password error:', error);
      const status = error.response?.status;
      const msg = error.response?.data?.message;
      if (status === 429) {
        toast.error('เปลี่ยนรหัสผ่านบ่อยเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่');
      } else if (status === 401 || msg === 'Current password is incorrect') {
        toast.error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      } else {
        toast.error(msg || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-800">ตั้งค่าบัญชี</h1>
            <p className="text-slate-500 text-sm mt-1">จัดการข้อมูลส่วนตัวและการแจ้งเตือน</p>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-xl border border-slate-200 mb-6">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-slate-400" />
                    )}
                  </div>

                  {/* Upload Button Overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/40 rounded-2xl flex items-center justify-center transition-all duration-200 group cursor-pointer"
                    title="อัพโหลดรูปภาพ"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </button>

                  {/* Small indicator */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
                    <Camera className="w-4 h-4 text-white" />
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-800">{user?.fullName}</h2>
                  <p className="text-sm text-slate-500">{user?.position}</p>
                  {user?.profileImageUrl && (
                    <button
                      onClick={handleDeleteImage}
                      disabled={uploadingImage}
                      className="text-xs text-red-500 hover:text-red-600 mt-2 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      ลบรูปโปรไฟล์
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">รหัสพนักงาน</p>
                  <p className="text-sm font-medium text-slate-800 font-mono">{user?.employeeCode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">สังกัด</p>
                  <p className="text-sm font-medium text-slate-800">{getDepartmentThaiCode(user?.department)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">ตำแหน่ง</p>
                  <p className="text-sm font-medium text-slate-800">{user?.position}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">อายุราชการ</p>
                  <p className="text-sm font-medium text-slate-800">{getServiceYears(user?.startDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Notification Settings */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-400" />
                <div>
                  <h2 className="font-medium text-slate-800">การแจ้งเตือนทาง Email</h2>
                  <p className="text-xs text-slate-500">รับการแจ้งเตือนเมื่อใบลาของท่านถูกพิจารณา</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Email Input */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Email สำหรับรับการแจ้งเตือน
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-2.5 pl-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all text-slate-800 placeholder-slate-400 text-sm"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    ระบบจะส่ง Email แจ้งเตือนเมื่อใบลาได้รับการอนุมัติหรือไม่อนุมัติ
                  </p>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${emailNotifications ? 'bg-slate-800' : 'bg-slate-200'} transition-colors`}>
                      <Bell className={`w-4 h-4 ${emailNotifications ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">เปิดรับการแจ้งเตือน</p>
                      <p className="text-xs text-slate-500">รับ Email เมื่อมีการอัพเดทสถานะใบลา</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                  </label>
                </div>

                {/* Warning */}
                {!email && emailNotifications && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">ยังไม่ได้ระบุ Email</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        กรุณากรอก Email เพื่อรับการแจ้งเตือน
                      </p>
                    </div>
                  </div>
                )}

                {/* Success */}
                {saved && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700">บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    บันทึกการตั้งค่า
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-xl border border-slate-200 mt-6">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-slate-400" />
                <div>
                  <h2 className="font-medium text-slate-800">เปลี่ยนรหัสผ่าน</h2>
                  <p className="text-xs text-slate-500">เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชี</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-4">

                {/* Current Password */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    รหัสผ่านปัจจุบัน
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านปัจจุบัน"
                      className="w-full px-4 py-2.5 pl-10 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all text-slate-800 placeholder-slate-400 text-sm"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    รหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 8 ตัว ตัวอักษร+ตัวเลข)"
                      className="w-full px-4 py-2.5 pl-10 pr-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all text-slate-800 placeholder-slate-400 text-sm"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength hints */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <p className={`text-xs flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {newPassword.length >= 8 ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        อย่างน้อย 8 ตัวอักษร
                      </p>
                      <p className={`text-xs flex items-center gap-1.5 ${/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword) ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        มีทั้งตัวอักษรและตัวเลข
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      className={`w-full px-4 py-2.5 pl-10 border rounded-lg focus:ring-2 focus:ring-slate-200 transition-all text-slate-800 placeholder-slate-400 text-sm ${confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-300 focus:border-red-400'
                        : confirmPassword && confirmPassword === newPassword
                          ? 'border-emerald-300 focus:border-emerald-400'
                          : 'border-slate-200 focus:border-slate-400'
                        }`}
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      รหัสผ่านไม่ตรงกัน
                    </p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && newPassword && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      รหัสผ่านตรงกัน
                    </p>
                  )}
                </div>

                {/* Password Changed Success */}
                {passwordChanged && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700">เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</span>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    {changingPassword ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">ยืนยันการลบ</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-slate-600 text-center">
                ต้องการลบรูปโปรไฟล์หรือไม่?
              </p>
              <p className="text-sm text-slate-400 text-center mt-2">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteImage}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                ลบรูปโปรไฟล์
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default SettingsPage;
