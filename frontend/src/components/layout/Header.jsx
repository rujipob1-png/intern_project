import { useAuth } from '../../contexts/AuthContext';
import { User } from 'lucide-react';
import { NotificationBell } from '../common/NotificationBell';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-[#1a2744] border-b border-[#243356] px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            ระบบการลาออนไลน์
          </h1>
          <p className="text-xs text-blue-200/70 mt-0.5">
            {getDepartmentThaiCode(user?.department) || 'ยินดีต้อนรับ'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[#253d6a]/50 border border-[#2a3f6a] rounded-lg">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-lg object-cover shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 bg-[#2c2c2e] rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="text-sm">
              <p className="font-semibold text-white">{user?.fullName}</p>
              <p className="text-xs text-blue-200/70">{user?.employeeCode}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
