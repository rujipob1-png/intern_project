import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import toast from 'react-hot-toast';
import { LogIn, Building2 } from 'lucide-react';

export const LoginPage = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!employeeCode || !password) {
      toast.error('กรุณากรอกรหัสพนักงานและรหัสผ่าน');
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(employeeCode, password);
      
      if (result.success) {
        toast.success('เข้าสู่ระบบสำเร็จ');
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า Backend รันอยู่';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3 tracking-tight">
            ระบบการลาออนไลน์
          </h1>
          <p className="text-slate-600 text-lg">
            สำหรับข้าราชการและเจ้าหน้าที่
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-800">
                เข้าสู่ระบบ
              </h2>
              <p className="text-sm text-slate-600">
                กรุณาใช้รหัสพนักงานและรหัสผ่านของคุณ
              </p>
            </div>

            <Input
              label="รหัสพนักงาน"
              type="text"
              placeholder="เช่น EMP001"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
              required
              disabled={loading}
              autoFocus
            />

            <Input
              label="รหัสผ่าน"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              <LogIn className="w-5 h-5" />
              เข้าสู่ระบบ
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-slate-200 px-6 pb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700">บัญชีทดสอบ (Demo):</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-500">Backend: http://localhost:3000</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-300 hover:shadow-md transition-shadow">
                <p className="font-semibold text-blue-800">พนักงาน</p>
                <p className="text-slate-700 mt-1">EMP001 / 123456</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border border-slate-300 hover:shadow-md transition-shadow">
                <p className="font-semibold text-slate-800">ผู้อำนวยการ</p>
                <p className="text-slate-700 mt-1">DIR001 / 123456</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-300 hover:shadow-md transition-shadow">
                <p className="font-semibold text-gray-800">กองกลาง</p>
                <p className="text-slate-700 mt-1">CTR001 / 123456</p>
              </div>
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-3 rounded-lg border border-slate-400 hover:shadow-md transition-shadow">
                <p className="font-semibold text-slate-900">Admin</p>
                <p className="text-slate-700 mt-1">ADMIN001 / 123456</p>
              </div>
            </div>
            <p className="text-xs text-red-600 mt-3 bg-red-50 p-2 rounded-lg border border-red-200">
              ⚠️ หาก Login ไม่ได้ กรุณาเปิด Backend server ที่ Terminal ก่อน: <code className="bg-white px-2 py-0.5 rounded font-mono">npm run dev</code>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-8 opacity-75">
          © 2026 ระบบการลาออนไลน์. All rights reserved.
        </p>
      </div>
    </div>
  );
};
