import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrationAPI } from '../../api/registration.api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import toast from 'react-hot-toast';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

const DEPARTMENTS = [
  { code: 'GOK', name: 'กลุ่มงานอำนวยการ (กอก.)' },
  { code: 'GYS', name: 'กลุ่มงานยุทธศาสตร์สารสนเทศและการสื่อสาร (กยส.)' },
  { code: 'GTS', name: 'กลุ่มงานเทคโนโลยีสารสนเทศ (กทส.)' },
  { code: 'GTP', name: 'กลุ่มงานติดตามประเมินผลด้านสารสนเทศและการสื่อสาร (กตป.)' },
  { code: 'GSS', name: 'กลุ่มงานเทคโนโลยีการสื่อสาร (กสส.)' },
  { code: 'GKC', name: 'กลุ่มงานโครงสร้างพื้นฐานด้านสารสนเทศและการสื่อสาร (กคฐ.)' },
];

const TITLES = [
  'นาย', 'นาง', 'นางสาว', 'ดร.', 'ผศ.', 'รศ.', 'ศ.', 'พล.ต.อ.',
];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    employeeCode: '',
    password: '',
    confirmPassword: '',
    title: '',
    firstName: '',
    lastName: '',
    position: '',
    departmentCode: '',
    phone: '',
    email: '',
    hireDate: '',
  });

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'employeeCode') {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.employeeCode.trim()) {
      newErrors.employeeCode = 'กรุณากรอกรหัสพนักงาน';
    }
    if (!form.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
    }
    if (!form.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    }
    if (!form.password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (form.password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    } else if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      newErrors.password = 'รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }
    if (!form.email) {
      newErrors.email = 'กรุณากรอกอีเมล (ใช้สำหรับรีเซ็ตรหัสผ่าน)';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (form.phone && !/^[0-9-]{9,15}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง';
    }
    if (!form.hireDate) {
      newErrors.hireDate = 'กรุณาเลือกวันเข้ารับราชการ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('กรุณาตรวจสอบข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      const result = await registrationAPI.register({
        employeeCode: form.employeeCode,
        password: form.password,
        title: form.title,
        firstName: form.firstName,
        lastName: form.lastName,
        position: form.position,
        departmentCode: form.departmentCode,
        phone: form.phone,
        email: form.email,
        hireDate: form.hireDate || null,
      });

      if (result.success) {
        setSuccess(true);
        toast.success('ลงทะเบียนสำเร็จ!');
      } else {
        toast.error(result.message || 'ลงทะเบียนไม่สำเร็จ');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาด';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
            <CheckCircle className="w-10 h-10 text-gray-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">ลงทะเบียนสำเร็จ!</h2>
          <p className="text-gray-500 mb-2">
            ข้อมูลของคุณถูกส่งไปยังผู้ดูแลระบบเพื่อพิจารณาแล้ว
          </p>
          <p className="text-gray-400 text-sm mb-8">
            เมื่อได้รับการอนุมัติ คุณจะสามารถเข้าสู่ระบบด้วยรหัสพนักงานและรหัสผ่านที่ลงทะเบียนไว้
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg mx-auto">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.png" alt="ตราสำนักนายกรัฐมนตรี" className="w-20 h-20 rounded-full drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ลงทะเบียนพนักงานใหม่
          </h1>
          <p className="text-gray-500">
            กรอกข้อมูลเพื่อขอเข้าใช้งานระบบการลาอิเล็กทรอนิกส์
          </p>
        </div>

        {/* Registration Form */}
        <Card className="shadow-2xl border-0 bg-white/95">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Info Banner */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                เมื่อลงทะเบียนแล้ว ระบบจะแจ้งเตือนไปยังหัวหน้าฝ่ายและผู้อำนวยการเพื่ออนุมัติ
                คุณจะสามารถเข้าสู่ระบบได้หลังจากได้รับการอนุมัติ
              </p>
            </div>

            {/* Employee Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสพนักงาน <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น 51143"
                value={form.employeeCode}
                onChange={handleChange('employeeCode')}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                  errors.employeeCode
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-gray-300 focus:border-gray-400'
                }`}
                disabled={loading}
              />
              {errors.employeeCode && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.employeeCode}
                </p>
              )}
            </div>

            {/* Name Row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำนำหน้า</label>
                <select
                  value={form.title}
                  onChange={handleChange('title')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  disabled={loading}
                >
                  <option value="">เลือก</option>
                  {TITLES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ชื่อ"
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.firstName ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="นามสกุล"
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.lastName ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Position & Department */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
                <input
                  type="text"
                  placeholder="เช่น นักวิชาการ"
                  value={form.position}
                  onChange={handleChange('position')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">กลุ่มงาน/สังกัด</label>
                <select
                  value={form.departmentCode}
                  onChange={handleChange('departmentCode')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  disabled={loading}
                >
                  <option value="">เลือกกลุ่มงาน</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  placeholder="08X-XXX-XXXX"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.phone ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleChange('email')}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.email ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Hire Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันเข้ารับราชการ <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.hireDate}
                onChange={handleChange('hireDate')}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 ${errors.hireDate ? 'border-red-400' : 'border-gray-300'}`}
                disabled={loading}
              />
              {errors.hireDate && <p className="text-red-500 text-xs mt-1">{errors.hireDate}</p>}
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={form.password}
                    onChange={handleChange('password')}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.password ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-300'
                    }`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.confirmPassword ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-gray-300'
                    }`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" fullWidth loading={loading} disabled={loading}>
              <UserPlus className="w-5 h-5" />
              ลงทะเบียน
            </Button>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6 opacity-75">
          © 2026 ระบบการลาอิเล็กทรอนิกส์. All rights reserved.
        </p>
      </div>
    </div>
  );
};
