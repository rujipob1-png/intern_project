import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { sanitizeString, loginSchema, validateData } from '../../utils/validation';
import toast from 'react-hot-toast';
import { LogIn, AlertCircle, XCircle } from 'lucide-react';

export const LoginPage = () => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ถ้า login อยู่แล้ว redirect ไป dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Clear specific error when user starts typing
  const handleEmployeeCodeChange = (e) => {
    // Sanitize input to prevent XSS
    const sanitized = sanitizeString(e.target.value.toUpperCase());
    setEmployeeCode(sanitized);
    if (errors.employeeCode) {
      setErrors(prev => ({ ...prev, employeeCode: '' }));
    }
    if (loginError) setLoginError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
    if (loginError) setLoginError('');
  };

  // Validate form before submit
  const validateForm = () => {
    const newErrors = {};
    
    if (!employeeCode.trim()) {
      newErrors.employeeCode = 'กรุณากรอกรหัสพนักงาน';
    }
    
    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!validateForm()) {
      // Show toast for quick feedback
      if (!employeeCode.trim() && !password) {
        toast.error('กรุณากรอกรหัสพนักงานและรหัสผ่าน');
      } else if (!employeeCode.trim()) {
        toast.error('กรุณากรอกรหัสพนักงาน');
      } else if (!password) {
        toast.error('กรุณากรอกรหัสผ่าน');
      }
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(employeeCode, password);
      
      if (result.success) {
        toast.success('เข้าสู่ระบบสำเร็จ');
        navigate('/dashboard');
      } else {
        // Handle specific error codes
        const errorCode = result.errorCode;
        let errorMessage = result.message || 'เข้าสู่ระบบไม่สำเร็จ';
        
        switch (errorCode) {
          case 'EMPLOYEE_NOT_FOUND':
            setErrors(prev => ({ ...prev, employeeCode: 'ไม่พบรหัสพนักงานนี้ในระบบ' }));
            errorMessage = 'ไม่พบรหัสพนักงานนี้ในระบบ กรุณาตรวจสอบรหัสพนักงานอีกครั้ง';
            break;
          case 'INVALID_PASSWORD':
            setErrors(prev => ({ ...prev, password: 'รหัสผ่านไม่ถูกต้อง' }));
            errorMessage = 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง';
            break;
          case 'ACCOUNT_DEACTIVATED':
            errorMessage = 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ';
            break;
          case 'MISSING_EMPLOYEE_CODE':
            setErrors(prev => ({ ...prev, employeeCode: 'กรุณากรอกรหัสพนักงาน' }));
            break;
          case 'MISSING_PASSWORD':
            setErrors(prev => ({ ...prev, password: 'กรุณากรอกรหัสผ่าน' }));
            break;
          default:
            break;
        }
        
        setLoginError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า Backend รันอยู่';
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-6 transform hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="ตราสำนักนายกรัฐมนตรี" className="w-24 h-24 rounded-full drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3 tracking-tight">
            ระบบการลาอิเล็กทรอนิกส์ 
          </h1>
          <p className="text-gray-500 text-lg">
            สำหรับข้าราชการและเจ้าหน้าที่
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800">
                เข้าสู่ระบบ
              </h2>
              <p className="text-sm text-gray-500">
                กรุณาใช้รหัสพนักงานและรหัสผ่านของคุณ
              </p>
            </div>

            {/* Error Banner */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-shake">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">เข้าสู่ระบบไม่สำเร็จ</p>
                  <p className="text-sm text-red-600 mt-1">{loginError}</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Input
                label="รหัสพนักงาน"
                type="text"
                placeholder="เช่น 51143"
                value={employeeCode}
                onChange={handleEmployeeCodeChange}
                required
                disabled={loading}
                autoFocus
                className={errors.employeeCode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
              />
              {errors.employeeCode && (
                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.employeeCode}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Input
                label="รหัสผ่าน"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                required
                disabled={loading}
                className={errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              <LogIn className="w-5 h-5" />
              เข้าสู่ระบบ
            </Button>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-gray-200 px-6 pb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">บัญชีทดลอง (Demo):</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Backend: http://localhost:3000</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:shadow-md transition-all">
                <p className="font-semibold text-gray-900">พนักงาน (กทส.)</p>
                <p className="text-gray-500 mt-1">51143 / 123456</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:shadow-md transition-all">
                <p className="font-semibold text-gray-900">ผอ.กลุ่มงาน (กยส.)</p>
                <p className="text-gray-500 mt-1">51497 / 123456</p>
              </div>
              <div className="bg-white p-3 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:shadow-md transition-all">
                <p className="font-semibold text-gray-900">หัวหน้าฝ่ายบริหารทั่วไป</p>
                <p className="text-gray-500 mt-1">51417 / 123456</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:shadow-md transition-all">
                <p className="font-semibold text-gray-900">ผอ.กอก.</p>
                <p className="text-gray-500 mt-1">51410 / 123456</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all col-span-2">
                <p className="font-semibold text-gray-900">ผู้อำนวยการสำนัก (Admin)</p>
                <p className="text-gray-600 mt-1">50001 / 123456</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <span className="font-semibold">ทุกบัญชีใช้รหัสผ่าน: 123456</span>
              <br />
              <span className="text-gray-500">กลุ่มงาน: กยส., กทส., กอก., กตป., กสส., กคฐ.</span>
            </div>
            <p className="text-xs text-gray-600 mt-3 bg-gray-100 p-2 rounded-lg border border-gray-200">
              หาก Login ไม่ได้ กรุณาเปิด Backend server ที่ Terminal ก่อน: <code className="bg-white px-2 py-0.5 rounded font-mono">npm run dev</code>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8 opacity-75">
          © 2026 ระบบการลาอิเล็กทรอนิกส์. All rights reserved.
        </p>
      </div>
    </div>
  );
};
