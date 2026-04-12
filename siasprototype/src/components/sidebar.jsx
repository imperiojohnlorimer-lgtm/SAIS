import React from 'react';
import { 
  ShieldCheck, 
  UserCircle, 
  LayoutDashboard, 
  Users,
  Clock, 
  UserCog,
  CheckSquare,
  User,
  Calendar as CalendarIcon,
  FileText
} from 'lucide-react';

export const Sidebar = ({ role, activeTab, setActiveTab, currentUser }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'accounts', label: 'Accounts', icon: UserCog, roles: ['Admin'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['Admin', 'Supervisor'] },
    { id: 'calendar', label: 'Schedule', icon: CalendarIcon },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Supervisor', 'Student Assistant'] },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['Supervisor', 'Student Assistant'] },
  ];

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(role));

  return (
    <aside className="w-72 bg-white border-r-2 border-maroon-600 flex flex-col shadow-sm">
      <div className="p-6 border-b-2 border-gold-400">
        {/* Logo and Branding */}
        <div className="mb-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src="/university-seal.jpg" alt="SAIS Logo" className="w-12 h-12 rounded-full shadow-lg border-2 border-gold-400 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-slate-900">SAIS</span>
              <span className="text-[10px] text-maroon-600 font-semibold uppercase">
                STUDENT ASSISTANT<br/>INFORMATION SYSTEM
              </span>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-maroon-600 to-maroon-700 text-white shadow-lg shadow-maroon-200 border-l-4 border-l-gold-400' 
                  : 'text-slate-700 hover:bg-slate-100 hover:text-maroon-600 border-l-4 border-l-transparent'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t-2 border-gold-400">
        <div className="bg-gradient-to-br from-maroon-50 to-gold-50 rounded-2xl p-4 border-2 border-maroon-200 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-maroon-500 to-maroon-700 flex items-center justify-center text-white shadow-lg flex-shrink-0 border-3 border-gold-400 overflow-hidden">
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser?.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCircle size={28} />
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold truncate text-slate-900">{currentUser?.name || 'User'}</p>
              <p className="text-xs text-maroon-600 uppercase tracking-widest font-bold">{role}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

