import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useState } from 'react';
import { ROLES } from '../../utils/constants';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [openSections, setOpenSections] = useState({
    leave: true,
    approval: true,
    management: true,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const menuSections = [
    {
      id: 'main',
      title: null,
      items: [
        {
          title: 'หน้าหลัก',
          icon: LayoutDashboard,
          path: '/dashboard',
          roles: [ROLES.USER, ROLES.DIRECTOR, ROLES.CENTRAL_OFFICE_STAFF, ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN],
        },
      ],
    },
    {
      id: 'leave',
      title: 'การลา',
      icon: FileText,
      collapsible: true,
      roles: [ROLES.USER],
      items: [
        {
          title: 'สร้างคำขอลา',
          path: '/create-leave',
          roles: [ROLES.USER],
        },
        {
          title: 'คำขอลาของฉัน',
          path: '/my-leaves',
          roles: [ROLES.USER],
        },
        {
          title: 'ประวัติการลา',
          path: '/leave-history',
          roles: [ROLES.USER],
        },
      ],
    },
    {
      id: 'approval',
      title: 'อนุมัติการลา',
      icon: CheckCircle,
      collapsible: true,
      roles: [ROLES.DIRECTOR, ROLES.CENTRAL_OFFICE_STAFF, ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN],
      items: [
        {
          title: 'รออนุมัติ (ผู้อำนวยการ)',
          path: '/director/dashboard',
          roles: [ROLES.DIRECTOR],
        },
        {
          title: 'ตรวจสอบเอกสาร (เจ้าหน้าที่)',
          path: '/central-office/staff',
          roles: [ROLES.CENTRAL_OFFICE_STAFF],
        },
        {
          title: 'อนุมัติ (หัวหน้าสำนักงานกลาง)',
          path: '/central-office/head',
          roles: [ROLES.CENTRAL_OFFICE_HEAD],
        },
        {
          title: 'อนุมัติขั้นสุดท้าย (ผู้บริหาร)',
          path: '/admin/dashboard',
          roles: [ROLES.ADMIN],
        },
      ],
    },
    {
      id: 'management',
      title: 'จัดการระบบ',
      icon: Settings,
      collapsible: true,
      roles: [ROLES.ADMIN],
      items: [
        {
          title: 'จัดการผู้ใช้',
          icon: Users,
          path: '/admin/users',
          roles: [ROLES.ADMIN],
        },
        {
          title: 'ตั้งค่าระบบ',
          path: '/settings',
          roles: [ROLES.ADMIN],
        },
      ],
    },
  ];

  const roleLevel = user?.role_name; // Use role_name instead of role.level

  const filteredSections = menuSections
    .map(section => ({
      ...section,
      items: section.items?.filter(item => 
        item.roles.includes(roleLevel)
      ) || [],
    }))
    .filter(section => 
      section.roles ? section.roles.includes(roleLevel) : section.items.length > 0
    );

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700
          transition-all duration-300 z-40 shadow-xl
          ${isOpen ? 'w-64' : 'w-0 lg:w-20'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo & User */}
          <div className="p-4 border-b border-slate-700">
            <div className={`flex items-center gap-3 ${!isOpen && 'lg:justify-center'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white font-bold text-lg">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">
                    {user?.fullName || user?.firstName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.position}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {filteredSections.map((section) => (
                <li key={section.id}>
                  {/* Section with Collapsible */}
                  {section.collapsible ? (
                    <div>
                      <button
                        onClick={() => toggleSection(section.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-200 text-white bg-slate-700/30 hover:bg-slate-600/50 font-bold
                          ${!isOpen && 'lg:justify-center'}
                        `}
                      >
                        <section.icon className="w-5 h-5 flex-shrink-0" />
                        {isOpen && (
                          <>
                            <span className="flex-1 text-left font-medium text-sm">{section.title}</span>
                            {openSections[section.id] ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </>
                        )}
                      </button>
                      
                      {/* Sub Items */}
                      {isOpen && openSections[section.id] && (
                        <ul className="ml-8 mt-1 space-y-1">
                          {section.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <li key={item.path}>
                                <button
                                  onClick={() => navigate(item.path)}
                                  className={`
                                    w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                    transition-all duration-200
                                    ${isActive(item.path)
                                      ? 'bg-blue-600 text-white font-bold shadow-md' 
                                      : 'text-white bg-slate-700/20 hover:bg-slate-600/40 font-semibold'
                                    }
                                  `}
                                >
                                  {ItemIcon && <ItemIcon className="w-4 h-4 flex-shrink-0" />}
                                  <span className="flex-1 text-left text-sm">{item.title}</span>
                                  {isActive(item.path) && <div className="w-2 h-2 bg-white rounded-full" />}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    /* Regular Items */
                    section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-all duration-200
                            ${isActive(item.path)
                              ? 'bg-blue-600 text-white font-bold shadow-md' 
                              : 'text-white bg-slate-700/30 hover:bg-slate-600/50 font-semibold'
                            }
                            ${!isOpen && 'lg:justify-center'}
                          `}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {isOpen && (
                            <>
                              <span className="flex-1 text-left text-sm">{item.title}</span>
                              {isActive(item.path) && <ChevronRight className="w-4 h-4" />}
                            </>
                          )}
                        </button>
                      );
                    })
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-white bg-red-600/30 hover:bg-red-600 hover:shadow-lg transition-all duration-200 font-semibold
                ${!isOpen && 'lg:justify-center'}
              `}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">ออกจากระบบ</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
