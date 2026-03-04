/**
 * ForgotPasswordPage — ลืมรหัสผ่าน
 * กรอกรหัสพนักงาน + Email → ระบบส่งลิงก์รีเซ็ตไปทาง Email
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../api/auth.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export const ForgotPasswordPage = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState(null); // สำหรับ dev mode (ไม่มี SMTP)
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!employeeCode.trim()) newErrors.employeeCode = 'กรุณากรอกรหัสพนักงาน';
    if (!email.trim()) {
      newErrors.email = 'กรุณากรอก Email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'รูปแบบ Email ไม่ถูกต้อง';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(employeeCode.trim(), email.trim());
      setSent(true);
      // ถ้า backend ส่ง resetUrl กลับมา (dev mode ที่ไม่มี SMTP)
      if (response.data?.resetUrl) {
        setResetUrl(response.data.resetUrl);
      }
      toast.success('ส่งคำขอเรียบร้อยแล้ว');
    } catch (error) {
      toast.error(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img src="/logo.png" alt="ตราสำนักนายกรัฐมนตรี" className="w-20 h-20 rounded-full drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ลืมรหัสผ่าน</h1>
          <p className="text-gray-500">ระบบจะส่งลิงก์รีเซ็ตไปยัง Email ของคุณ</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="space-y-1">
                <Input
                  label="รหัสพนักงาน"
                  type="text"
                  placeholder="เช่น 51143"
                  value={employeeCode}
                  onChange={(e) => {
                    setEmployeeCode(e.target.value.toUpperCase());
                    if (errors.employeeCode) setErrors((p) => ({ ...p, employeeCode: '' }));
                  }}
                  disabled={loading}
                  autoFocus
                  className={errors.employeeCode ? 'border-red-500' : ''}
                />
                {errors.employeeCode && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.employeeCode}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  label="Email ที่ลงทะเบียนไว้"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: '' }));
                  }}
                  disabled={loading}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <Button type="submit" fullWidth loading={loading} disabled={loading}>
                <Send className="w-5 h-5" />
                ส่งลิงก์รีเซ็ตรหัสผ่าน
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            </form>
          ) : (
            <div className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">ส่งคำขอเรียบร้อยแล้ว</h3>
              <p className="text-gray-600 text-sm">
                หากรหัสพนักงานและ Email ตรงกับข้อมูลในระบบ จะมีลิงก์รีเซ็ตรหัสผ่านส่งไปยัง Email ของคุณ
              </p>
              <p className="text-gray-500 text-xs">ลิงก์จะหมดอายุภายใน 15 นาที</p>

              {/* Dev mode: แสดงลิงก์โดยตรงถ้า SMTP ไม่ได้ตั้งค่า */}
              {resetUrl && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                  <p className="text-xs font-semibold text-yellow-800 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Dev Mode — Email ยังไม่ได้ตั้งค่า
                  </p>
                  <a
                    href={resetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline break-all flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    คลิกเพื่อรีเซ็ตรหัสผ่าน
                  </a>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setSent(false);
                    setResetUrl(null);
                  }}
                >
                  <Mail className="w-4 h-4" />
                  ส่งอีกครั้ง
                </Button>
                <Link
                  to="/login"
                  className="block text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  ← กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
