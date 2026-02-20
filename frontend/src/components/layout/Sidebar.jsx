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
  Clock,
  XCircle
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ROLES } from '../../utils/constants';
import { getActingRequests } from '../../api/acting.api';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // Default closed on mobile
  const [actingRequestCount, setActingRequestCount] = useState(0);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const navRef = useRef(null);
  const [openSections, setOpenSections] = useState({
    leave: true,
    approval: true,
    cancellation: false,
    management: true,
  });

  // Check if desktop (lg breakpoint = 1024px)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setIsOpen(true); // Always open on desktop
      } else {
        setIsOpen(false); // Default closed on mobile
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ดึงจำนวนคำขอปฏิบัติหน้าที่แทนที่รออยู่
  useEffect(() => {
    const fetchActingCount = async () => {
      try {
        const result = await getActingRequests();
        if (result.success) {
          setActingRequestCount(result.data?.length || 0);
        }
      } catch (error) {
        console.log('Error fetching acting requests count');
      }
    };
    fetchActingCount();

    // Refresh ทุก 30 วินาที
    const interval = setInterval(fetchActingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigate and close sidebar on mobile
  const handleNavigate = (path) => {
    navigate(path);
    if (!isDesktop) {
      setIsOpen(false);
    }
  };

  // ตรวจสอบว่ายังเลื่อนลงได้อีกไหม
  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 10);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [checkScroll, openSections]);

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
        {
          title: 'ตั้งค่า',
          icon: Settings,
          path: '/settings',
          roles: [ROLES.USER, ROLES.DIRECTOR, ROLES.CENTRAL_OFFICE_STAFF, ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN],
        },
      ],
    },
    {
      id: 'leave',
      title: 'การลา',
      icon: FileText,
      collapsible: true,
      roles: [ROLES.USER, ROLES.DIRECTOR, ROLES.CENTRAL_OFFICE_STAFF, ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN],
      items: [
        {
          title: 'สร้างคำขอลา',
          path: '/create-leave',
          roles: [ROLES.USER, ROLES.DIRECTOR, ROLES.CENTRAL_OFFICE_STAFF, ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN],
        },
        {
          title: 'คำขอลาของฉัน',
          path: '/my-leaves',
          roles: [ROLES.USER, ROLES.DIRECTOR, ROLES.CENTRAL_OFFICE_STAFF, ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN],
        },
        {
          title: 'คำขอปฏิบัติหน้าที่แทน',
          path: '/acting-requests',
          roles: [ROLES.USER, ROLES.DIRECTOR, ROLES.CENTRAL_OFFICE_STAFF, ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN],
        },
        {
          title: 'ประวัติการลา',
          path: '/leave-history',
          roles: [ROLES.USER, ROLES.DIRECTOR, ROLES.CENTRAL_OFFICE_STAFF, ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN],
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
          title: 'ประวัติการอนุมัติ',
          path: '/director/history',
          roles: [ROLES.DIRECTOR],
        },
        {
          title: 'ตรวจสอบเอกสาร (เจ้าหน้าที่)',
          path: '/central-office/staff',
          roles: [ROLES.CENTRAL_OFFICE_STAFF],
        },
        {
          title: 'ประวัติการตรวจสอบ',
          path: '/central-office/staff/history',
          roles: [ROLES.CENTRAL_OFFICE_STAFF],
        },
        {
          title: 'รออนุมัติ (หัวหน้าสำนักงานกลาง)',
          path: '/central-office/head',
          roles: [ROLES.CENTRAL_OFFICE_HEAD],
        },
        {
          title: 'ประวัติการอนุมัติ',
          path: '/central-office/head/history',
          roles: [ROLES.CENTRAL_OFFICE_HEAD],
        },
        {
          title: 'อนุมัติขั้นสุดท้าย (ผู้บริหาร)',
          path: '/admin/dashboard',
          roles: [ROLES.ADMIN],
        },
        {
          title: 'ประวัติการอนุมัติ',
          path: '/admin/approval-history',
          roles: [ROLES.ADMIN],
        },
      ],
    },
    {
      id: 'cancellation',
      title: 'อนุมัติยกเลิกการลา',
      icon: XCircle,
      collapsible: true,
      roles: [ROLES.DIRECTOR, ROLES.CENTRAL_OFFICE_STAFF, ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN],
      items: [
        {
          title: 'รออนุมัติยกเลิก (ผู้อำนวยการ)',
          path: '/director/cancel-requests',
          roles: [ROLES.DIRECTOR],
        },
        {
          title: 'รออนุมัติยกเลิก (เจ้าหน้าที่)',
          path: '/central-office/staff/cancel-requests',
          roles: [ROLES.CENTRAL_OFFICE_STAFF],
        },
        {
          title: 'รออนุมัติยกเลิก (หัวหน้าสำนักงานกลาง)',
          path: '/central-office/head/cancel-requests',
          roles: [ROLES.CENTRAL_OFFICE_HEAD],
        },
        {
          title: 'อนุมัติยกเลิกขั้นสุดท้าย (ผู้บริหาร)',
          path: '/admin/cancel-requests',
          roles: [ROLES.ADMIN],
        },
        {
          title: 'ประวัติการยกเลิก',
          path: '/admin/cancel-history',
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
      {/* Mobile toggle - hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3 left-3 z-[60] p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 active:scale-95 transition-transform"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5 text-red-500" /> : <Menu className="w-5 h-5 text-slate-700" />}
      </button>

      {/* Mobile backdrop overlay */}
      {isOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-[#1a2744] border-r border-[#243356]
          transition-all duration-300 z-50 shadow-xl
          ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Only */}
          <div className="border-b border-[#2a3f6a]">
            {isOpen ? (
              <div className="flex flex-col items-center py-5">
                <img src="/logo.png" alt="ตราสำนักนายกรัฐมนตรี" className="w-16 h-16 rounded-full ring-2 ring-amber-400/40 mb-2" />
                <h1 className="text-white font-bold text-sm">ระบบการลาอิเล็กทรอนิกส์</h1>
                <p className="text-[11px] text-slate-400">สำนักนายกรัฐมนตรี</p>
              </div>
            ) : (
              <div className="hidden lg:flex justify-center py-4">
                <img src="/logo.png" alt="ตราสำนักนายกรัฐมนตรี" className="w-10 h-10 rounded-full ring-2 ring-amber-400/40" />
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="relative flex-1 min-h-0">
            <nav ref={navRef} className="h-full p-4 overflow-y-auto sidebar-scroll">
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
                          transition-all duration-200 text-white bg-[#253d6a]/30 hover:bg-[#253d6a]/50 font-bold
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
                              const showBadge = item.path === '/acting-requests' && actingRequestCount > 0;
                              return (
                                <li key={item.path}>
                                  <button
                                    onClick={() => handleNavigate(item.path)}
                                    className={`
                                    w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                    transition-all duration-200 relative
                                    ${isActive(item.path)
                                        ? 'bg-amber-400 text-[#1a2744] font-bold shadow-md'
                                        : 'text-white bg-[#253d6a]/20 hover:bg-[#253d6a]/40 font-semibold'
                                      }
                                  `}
                                  >
                                    {ItemIcon && <ItemIcon className="w-4 h-4 flex-shrink-0" />}
                                    <span className="flex-1 text-left text-sm">{item.title}</span>
                                    {showBadge && (
                                      <span className="flex items-center justify-center min-w-5 h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                        {actingRequestCount}
                                      </span>
                                    )}
                                    {isActive(item.path) && !showBadge && <div className="w-2 h-2 bg-white rounded-full" />}
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
                            onClick={() => handleNavigate(item.path)}
                            className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-all duration-200
                            ${isActive(item.path)
                                ? 'bg-amber-400 text-[#1a2744] font-bold shadow-md'
                                : 'text-white bg-[#253d6a]/30 hover:bg-[#253d6a]/50 font-semibold'
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

            {/* ลูกศรเด้งๆ บอกว่าเลื่อนลงได้อีก */}
            {isOpen && canScrollDown && (
              <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                <div className="h-10 bg-gradient-to-t from-[#1a2744] via-[#1a2744]/80 to-transparent" />
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                  <ChevronDown className="w-5 h-5 text-amber-400 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-[#2a3f6a]">
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
