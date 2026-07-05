import React from 'react';
import { 
  Users, Building2, UserCog, CalendarCheck, FileText, Calendar, 
  Megaphone, Lock, PieChart, LogOut, ShieldCheck, Tag
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  username: string;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, userRole, username, onLogout }: SidebarProps) {
  // Navigation items scoped by role (or showing all to admin/HR, restricted to manager/employee)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart, roles: ['Super Admin', 'HR', 'Manager', 'Employee'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['Super Admin', 'HR', 'Manager'] },
    { id: 'departments', label: 'Departments', icon: Building2, roles: ['Super Admin', 'HR'] },
    { id: 'designations', label: 'Designations', icon: Tag, roles: ['Super Admin', 'HR'] },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['Super Admin', 'HR', 'Manager', 'Employee'] },
    { id: 'leaves', label: 'Leaves', icon: FileText, roles: ['Super Admin', 'HR', 'Manager', 'Employee'] },
    { id: 'payroll', label: 'Payroll', icon: AwardIcon, roles: ['Super Admin', 'HR', 'Employee'] },
    { id: 'holidays', label: 'Holidays', icon: Calendar, roles: ['Super Admin', 'HR', 'Manager', 'Employee'] },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, roles: ['Super Admin', 'HR', 'Manager', 'Employee'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['Super Admin', 'HR', 'Manager'] },
    { id: 'users', label: 'User Accounts', icon: ShieldCheck, roles: ['Super Admin'] },
  ];

  // Simple custom Award icon replace since Lucide might have varying named awards
  function AwardIcon(props: any) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    );
  }

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside id="app-sidebar" className="w-64 bg-white text-slate-600 flex flex-col min-h-screen border-r border-slate-200 transition-all duration-300">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-slate-200 flex items-center space-x-3">
        <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-slate-800 leading-none">HRMS ERP</h1>
          <span className="text-xs text-slate-400 font-medium tracking-wide">Enterprise Hub</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">Main Modules</p>
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-link-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-800'}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center space-x-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 font-bold uppercase">
            {username.substring(0, 2)}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold text-slate-800 truncate leading-tight">{username}</h4>
            <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-full">
              {userRole}
            </span>
          </div>
        </div>

        <button
          id="btn-sidebar-logout"
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all duration-150"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
