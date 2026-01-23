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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ระบบการลาออนไลน์
          </h1>
          <p className="text-gray-600">
            สำหรับข้าราชการและเจ้าหน้าที่
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                เข้าสู่ระบบ
              </h2>
              <p className="text-sm text-gray-600">
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
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">บัญชีทดสอบ (Demo):</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Backend: http://localhost:3000</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <p className="font-medium">พนักงาน</p>
                <p className="text-gray-600">EMP001 / 123456</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="font-medium">ผู้อำนวยการ</p>
                <p className="text-gray-600">DIR001 / 123456</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="font-medium">กองกลาง</p>
                <p className="text-gray-600">CTR001 / 123456</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="font-medium">Admin</p>
                <p className="text-gray-600">ADMIN001 / 123456</p>
              </div>
            </div>
            <p className="text-xs text-red-600 mt-2">
              ⚠️ หาก Login ไม่ได้ กรุณาเปิด Backend server ที่ Terminal ก่อน: <code className="bg-gray-100 px-1 rounded">npm run dev</code>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2026 ระบบการลาออนไลน์. All rights reserved.
        </p>
      </div>
    </div>
  );
};
