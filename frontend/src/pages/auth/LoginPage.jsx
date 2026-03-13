import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { sanitizeString, loginSchema, validateData } from '../../utils/validation';
import toast from 'react-hot-toast';
import { LogIn, AlertCircle, XCircle, ChevronRight } from 'lucide-react';

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
    <div className="min-h-screen flex bg-slate-50">
      {/* ===== Left Banner Panel — Premium Dark Gradient ===== */}
      <div
        className="hidden lg:flex lg:w-[55%] xl:w-[58%] relative overflow-hidden flex-col login-gradient-bg"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #312e81 50%, #1e293b 75%, #0f172a 100%)',
        }}
      >
        {/* Animated floating orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="login-orb absolute rounded-full"
            style={{
              width: '500px', height: '500px',
              top: '10%', left: '5%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0) 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="login-orb-slow absolute rounded-full"
            style={{
              width: '600px', height: '600px',
              top: '40%', right: '-10%',
              background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0) 70%)',
              filter: 'blur(50px)',
            }}
          />
          <div
            className="login-orb-reverse absolute rounded-full"
            style={{
              width: '400px', height: '400px',
              bottom: '-5%', left: '20%',
              background: 'radial-gradient(circle, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0) 70%)',
              filter: 'blur(35px)',
            }}
          />
          <div
            className="login-orb absolute rounded-full"
            style={{
              width: '300px', height: '300px',
              top: '5%', right: '15%',
              background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(56,189,248,0) 70%)',
              filter: 'blur(30px)',
            }}
          />
          {/* Subtle noise texture */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full px-12 xl:px-16 py-12">
          {/* Top - Logo */}
          <div className="login-fade-in">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-12 h-12 rounded-full ring-2 ring-white/10 shadow-lg"
              />
              <div className="h-8 w-px bg-white/10" />
              <span className="text-white/50 text-sm font-medium tracking-wider uppercase">
                ระบบการลาอิเล็กทรอนิกส์
              </span>
            </div>
          </div>

          {/* Center - Large Title */}
          <div className="login-slide-up flex-1 flex flex-col justify-center -mt-8">
            <div className="space-y-6">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-white/60 text-xs font-medium tracking-wide">
                  ระบบพร้อมใช้งาน
                </span>
              </div>

              <h1 className="text-white font-bold leading-[1.1] tracking-tight"
                style={{ fontSize: 'clamp(2.8rem, 4.5vw, 4.5rem)' }}
              >
                ระบบการลา
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  อิเล็กทรอนิกส์
                </span>
              </h1>

              <p className="text-white/40 text-lg max-w-md leading-relaxed">
                ระบบบริหารจัดการการลาแบบดิจิทัล
                <br />
                สำหรับข้าราชการและเจ้าหน้าที่
              </p>
            </div>
          </div>

          {/* Bottom - Features */}
          <div className="login-slide-up login-slide-up-delay-3">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'ยื่นลาออนไลน์', desc: 'สะดวก รวดเร็ว' },
                { label: 'อนุมัติทันที', desc: 'ผ่านระบบดิจิทัล' },
                { label: 'ติดตามสถานะ', desc: 'แบบเรียลไทม์' },
              ].map((item, i) => (
                <div key={i} className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] transition-all duration-300">
                  <p className="text-white/80 text-sm font-semibold">{item.label}</p>
                  <p className="text-white/30 text-xs mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Right Login Form Panel ===== */}
      <div className="w-full lg:w-[45%] xl:w-[42%] flex flex-col min-h-screen">
        {/* Mobile hero header */}
        <div className="lg:hidden relative overflow-hidden py-10 px-6"
          style={{
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="login-orb absolute w-48 h-48 rounded-full"
              style={{ top: '-20%', right: '-10%', background: 'radial-gradient(circle, rgba(75,85,99,0.5) 0%, transparent 70%)', filter: 'blur(20px)' }}
            />
          </div>
          <div className="relative z-10 text-center">
            <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-4 ring-2 ring-white/20 shadow-xl" />
            <h1 className="text-2xl font-bold text-white">ระบบการลาอิเล็กทรอนิกส์</h1>
            <p className="text-gray-300/60 text-sm mt-2">สำหรับข้าราชการและเจ้าหน้าที่</p>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-12 xl:px-16 py-8 overflow-y-auto">
          <div className="w-full max-w-[380px]">
            {/* Desktop: small branding */}
            <div className="hidden lg:block mb-12 login-slide-up">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full shadow-sm" />
                <span className="text-gray-400 text-xs font-medium tracking-wider uppercase">
                  ระบบการลาอิเล็กทรอนิกส์
                </span>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8 login-slide-up login-slide-up-delay-1">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                เข้าสู่ระบบ
              </h2>
              <p className="text-gray-400 mt-2">
                กรุณากรอกข้อมูลเพื่อเข้าใช้งาน
              </p>
            </div>

            {/* Error Banner */}
            {loginError && (
              <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-shake">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-red-800">เข้าสู่ระบบไม่สำเร็จ</p>
                  <p className="text-sm text-red-600/80 mt-0.5">{loginError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-slide-up login-slide-up-delay-2">
              <div className="space-y-5">
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
              </div>

              <div className="flex items-center justify-between mt-4 mb-6">
                <Link
                  to="/register"
                  className="text-sm text-gray-400 hover:text-gray-700 transition-colors duration-200"
                >
                  ลงทะเบียนพนักงานใหม่
                </Link>
                <Link
                  to="/forgot-password"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 flex items-center gap-0.5"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading}
                className="!py-3 !text-base !rounded-xl !bg-gradient-to-r !from-gray-800 !to-gray-900 hover:!from-gray-900 hover:!to-black !shadow-lg !shadow-gray-900/25 hover:!shadow-gray-900/40 !transition-all !duration-300 !text-white"
              >
                <LogIn className="w-5 h-5" />
                เข้าสู่ระบบ
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-10 pt-8 border-t border-gray-100 login-slide-up login-slide-up-delay-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    บัญชีทดลอง
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'พนักงาน (กทส.)', code: '51143' },
                  { role: 'ผอ.กลุ่มงาน (กยส.)', code: '51497' },
                  { role: 'หน.ฝ่ายบริหารทั่วไป', code: '51417' },
                  { role: 'ผอ.กอก.', code: '51410' },
                ].map((acc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setEmployeeCode(acc.code); setPassword('123456'); }}
                    className="text-left p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50/50 hover:shadow-sm transition-all duration-200 group"
                  >
                    <p className="font-medium text-gray-700 text-xs group-hover:text-gray-900 transition-colors">{acc.role}</p>
                    <p className="text-gray-400 mt-0.5 font-mono text-[11px]">{acc.code} / 123456</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setEmployeeCode('50001'); setPassword('123456'); }}
                  className="col-span-2 text-left p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50/50 hover:shadow-sm transition-all duration-200 group"
                >
                  <p className="font-medium text-gray-700 text-xs group-hover:text-gray-900 transition-colors">ผู้อำนวยการสำนัก (Admin)</p>
                  <p className="text-gray-400 mt-0.5 font-mono text-[11px]">50001 / 123456</p>
                </button>
              </div>

              <p className="text-[10px] text-gray-400 mt-3 text-center">
                รหัสผ่านทุกบัญชี: <code className="font-mono font-semibold text-gray-500">123456</code>
                <span className="mx-1.5">·</span>
                กลุ่มงาน: กยส., กทส., กอก., กตป., กสส., กคฐ.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 text-center">
          <p className="text-[11px] text-gray-300">
            © 2026 ระบบการลาอิเล็กทรอนิกส์ · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};
