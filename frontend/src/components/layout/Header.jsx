import { useAuth } from '../../contexts/AuthContext';
import { User } from 'lucide-react';
import { NotificationBell } from '../common/NotificationBell';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#1a2744] border-b border-[#243356] px-4 sm:px-6 py-3 shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between">
        {/* Left: Title - hidden on mobile (hamburger takes this space), shown on sm+ */}
        <div className="hidden sm:block">
          <h1 className="text-xl font-bold text-white">
            ระบบการลาอิเล็กทรอนิกส์
          </h1>
          <p className="text-xs text-blue-200/70 mt-0.5">
            {getDepartmentThaiCode(user?.department) || 'ยินดีต้อนรับ'}
          </p>
        </div>

        {/* Mobile: spacer for hamburger button */}
        <div className="sm:hidden w-10" />

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 bg-[#253d6a]/50 border border-[#2a3f6a] rounded-lg">
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
              <p className="font-semibold text-white text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{user?.fullName}</p>
              <p className="text-xs text-blue-200/70 hidden sm:block">{user?.employeeCode}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
