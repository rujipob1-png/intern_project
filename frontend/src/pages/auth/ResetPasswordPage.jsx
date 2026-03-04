/**
 * ResetPasswordPage — ตั้งรหัสผ่านใหม่
 * เข้าจากลิงก์ /reset-password?token=xxx
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../api/auth.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // ถ้าไม่มี token redirect กลับ login
  useEffect(() => {
    if (!token) {
      toast.error('ลิงก์ไม่ถูกต้อง');
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = 'กรุณากรอกรหัสผ่านใหม่';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = 'รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
      toast.success('รีเซ็ตรหัสผ่านสำเร็จ');
    } catch (error) {
      toast.error(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getStrength = () => {
    if (!newPassword) return { level: 0, text: '', color: '' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) score++;

    if (score <= 1) return { level: 1, text: 'อ่อน', color: 'bg-red-500' };
    if (score === 2) return { level: 2, text: 'ปานกลาง', color: 'bg-yellow-500' };
    if (score === 3) return { level: 3, text: 'ดี', color: 'bg-blue-500' };
    return { level: 4, text: 'แข็งแรง', color: 'bg-green-500' };
  };

  const strength = getStrength();

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img src="/logo.png" alt="ตราสำนักนายกรัฐมนตรี" className="w-20 h-20 rounded-full drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-gray-500">กรอกรหัสผ่านใหม่ที่ต้องการ</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* New password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  รหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    placeholder="อย่างน้อย 8 ตัวอักษร (ตัวอักษร + ตัวเลข)"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: '' }));
                    }}
                    disabled={loading}
                    className={errors.newPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.newPassword}
                  </p>
                )}
                {/* Strength bar */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i <= strength.level ? strength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      ความแข็งแรง: <span className="font-medium">{strength.text}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' }));
                    }}
                    disabled={loading}
                    className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button type="submit" fullWidth loading={loading} disabled={loading}>
                <KeyRound className="w-5 h-5" />
                ตั้งรหัสผ่านใหม่
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            </form>
          ) : (
            <div className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">รีเซ็ตรหัสผ่านสำเร็จ!</h3>
              <p className="text-gray-600 text-sm">
                รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
              </p>
              <div className="pt-4">
                <Button fullWidth onClick={() => navigate('/login', { replace: true })}>
                  <CheckCircle className="w-5 h-5" />
                  ไปหน้าเข้าสู่ระบบ
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
