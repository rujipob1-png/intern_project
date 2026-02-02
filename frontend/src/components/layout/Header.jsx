import { useAuth } from '../../contexts/AuthContext';
import { User } from 'lucide-react';
import { NotificationBell } from '../common/NotificationBell';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            ระบบการลาออนไลน์
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {getDepartmentThaiCode(user?.department) || 'ยินดีต้อนรับ'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-slate-800">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{user?.employeeCode}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
