import { useAuth } from '../../contexts/AuthContext';
import { Bell, User } from 'lucide-react';

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ระบบการลาออนไลน์
          </h1>
          <p className="text-sm text-gray-600">
            {user?.department || 'ยินดีต้อนรับ'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user?.fullName}</p>
              <p className="text-xs text-gray-500">{user?.employeeCode}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
