import React, { useState, useEffect } from 'react';
import { 
  Bell, Clock, Shield, ChevronDown, CheckCircle, AlertTriangle,
  User, LogOut, X, Mail, Phone, MapPin, Calendar, Briefcase, Building, ShieldCheck, IdCard, Sun, Moon
} from 'lucide-react';
import { UserRole, SystemUser, Employee, Department, Designation } from '../types';

interface NavbarProps {
  activeTab: string;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  username: string;
  currentUser: SystemUser | null;
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  onLogout: () => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

export default function Navbar({ 
  activeTab, 
  userRole, 
  setUserRole, 
  username,
  currentUser,
  employees,
  departments,
  designations,
  onLogout,
  theme = 'light',
  toggleTheme
}: NavbarProps) {
  const [time, setTime] = useState(new Date());
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock Notifications for high-fidelity feel
  const notifications = [
    { id: 1, text: 'Sarah Connor approved EMP-106 (Sick Leave)', type: 'success', time: '10 mins ago' },
    { id: 2, text: 'Pending: 2 new Leave requests to approve', type: 'warning', time: '1 hr ago' },
    { id: 3, text: 'System Update: June Payroll processed', type: 'info', time: 'Yesterday' }
  ];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTitle = (tabId: string) => {
    if (!tabId) return 'Dashboard';
    return tabId.charAt(0).toUpperCase() + tabId.slice(1);
  };

  const roles: UserRole[] = ['Super Admin', 'HR', 'Manager', 'Employee'];

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm relative z-40">
      {/* Title / Section Name */}
      <div className="flex items-center space-x-3">
        <h2 id="navbar-view-title" className="text-xl font-bold text-slate-800 tracking-tight">
          {formatTitle(activeTab)}
        </h2>
        <span className="hidden md:inline-block px-2.5 py-0.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-md">
          v1.0.0 Stable
        </span>
      </div>

      {/* Action Area */}
      <div className="flex items-center space-x-6">
        {/* Dynamic Live Clock */}
        <div className="hidden lg:flex items-center text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-slate-400 mr-2" />
          <span>
            {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="mx-2 text-slate-300">|</span>
          <span className="text-slate-700 font-mono">
            {time.toLocaleTimeString()}
          </span>
        </div>

        {/* Dynamic Sandbox Role Switcher - Massive DX Value! */}
        <div className="relative">
          <button
            id="btn-navbar-role-switcher"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-all duration-150"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Role: {userRole}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showRoleDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleDropdown(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-fadeIn">
                <div className="px-3 py-1 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Simulate UI Access
                  </span>
                </div>
                {roles.map((r) => (
                  <button
                    key={r}
                    id={`role-switcher-${r.replace(' ', '-')}`}
                    onClick={() => {
                      setUserRole(r);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-semibold transition-all duration-150 ${
                      userRole === r
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{r}</span>
                    {userRole === r && (
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Theme Toggler Switcher */}
        {toggleTheme && (
          <button
            id="btn-navbar-theme-toggle"
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-150 relative cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-600" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500" />
            )}
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            id="btn-navbar-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-150 relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Notifications</h4>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 font-bold rounded">3 New</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start space-x-3">
                      {n.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 leading-normal">{n.text}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Account Indicator with interactive menu */}
        <div className="relative">
          <button
            id="btn-navbar-user-menu"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2 border-l border-slate-200 pl-4 py-1 hover:opacity-80 transition-all duration-150 focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-xs font-bold text-slate-700 uppercase">
              {username.charAt(0)}
            </div>
            <span className="hidden md:inline-flex items-center text-xs font-semibold text-slate-700 select-none">
              {username}
              <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400" />
            </span>
          </button>

          {showUserDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-fadeIn">
                <div className="px-3.5 py-2 border-b border-slate-100 mb-1.5 bg-slate-50/50 rounded-t-xl">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {employees.find(e => e.id === currentUser?.employeeId || e.firstName.toLowerCase() === username.toLowerCase())
                      ? `${employees.find(e => e.id === currentUser?.employeeId || e.firstName.toLowerCase() === username.toLowerCase())?.firstName} ${employees.find(e => e.id === currentUser?.employeeId || e.firstName.toLowerCase() === username.toLowerCase())?.lastName}`
                      : currentUser?.firstName 
                        ? `${currentUser.firstName} ${currentUser.lastName || ''}`
                        : username
                    }
                  </p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">
                    {currentUser?.email || `${username}@company.com`}
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded uppercase">
                    {userRole}
                  </span>
                </div>

                <button
                  id="user-menu-details"
                  onClick={() => {
                    setShowDetailsModal(true);
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150 font-semibold cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>User Details</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  id="user-menu-logout"
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 transition-all duration-150 font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Details Modal */}
      {showDetailsModal && (() => {
        const linkedEmployee = employees.find(
          e => e.id === currentUser?.employeeId || e.firstName.toLowerCase() === username.toLowerCase()
        );

        const profileDetails = {
          firstName: linkedEmployee?.firstName || currentUser?.firstName || username,
          lastName: linkedEmployee?.lastName || currentUser?.lastName || '',
          gender: linkedEmployee?.gender || currentUser?.gender || 'Male',
          dob: linkedEmployee?.dob || currentUser?.dob || '1990-01-01',
          email: linkedEmployee?.email || currentUser?.email || `${username}@company.com`,
          mobile: linkedEmployee?.mobile || currentUser?.mobile || 'N/A',
          address: linkedEmployee?.address || currentUser?.address || 'N/A',
          branch: linkedEmployee?.branch || currentUser?.branch || 'Main Head Office',
          departmentId: linkedEmployee?.departmentId || currentUser?.departmentId || '',
          designationId: linkedEmployee?.designationId || currentUser?.designationId || '',
          employeeId: linkedEmployee?.id || currentUser?.employeeId || 'USR-' + (currentUser?.id || 'REG'),
          joiningDate: linkedEmployee?.joiningDate || '2024-01-15',
          salary: linkedEmployee?.salary ? `₹${linkedEmployee.salary.toLocaleString()}` : 'N/A',
          status: linkedEmployee?.status || 'Active',
          role: currentUser?.role || userRole,
          username: currentUser?.username || username,
        };

        const getDeptName = (deptId?: string) => {
          if (!deptId) return 'N/A';
          const dept = departments.find(d => d.id === deptId);
          return dept ? dept.name : deptId;
        };

        const getDesgName = (desgId?: string) => {
          if (!desgId) return 'N/A';
          const desg = designations.find(d => d.id === desgId);
          return desg ? desg.name : desgId;
        };

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm transition-opacity" 
              onClick={() => setShowDetailsModal(false)} 
            />

            {/* Modal Container */}
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full relative z-50 overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">My Employee Profile</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Verify your security clearance and registration credentials</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Badge Summary Banner */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 p-4.5 bg-slate-50/50 border border-slate-200 rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-extrabold shadow-md shadow-blue-600/15 uppercase">
                    {profileDetails.firstName.charAt(0)}{profileDetails.lastName.charAt(0) || ''}
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <h4 className="text-base font-extrabold text-slate-800 leading-none">
                      {profileDetails.firstName} {profileDetails.lastName}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold flex flex-wrap justify-center sm:justify-start items-center gap-1.5">
                      <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                        ID: {profileDetails.employeeId}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>{getDesgName(profileDetails.designationId)}</span>
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      Branch: <b className="text-slate-600">{profileDetails.branch}</b>
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-center sm:items-end justify-center">
                    <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full uppercase tracking-wider">
                      {profileDetails.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1.5">ERP User Account</span>
                  </div>
                </div>

                {/* Grid of details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Section 1: Employment Details */}
                  <div className="space-y-3.5">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                      Employment Details
                    </h5>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center space-x-3 text-xs text-slate-600">
                        <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Department</p>
                          <p className="font-semibold text-slate-800">{getDeptName(profileDetails.departmentId)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-600">
                        <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Designation</p>
                          <p className="font-semibold text-slate-800">{getDesgName(profileDetails.designationId)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Date of Joining</p>
                          <p className="font-semibold text-slate-800">{profileDetails.joiningDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-600">
                        <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Clearance Level</p>
                          <p className="font-bold text-blue-600">{profileDetails.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Personal & Contact */}
                  <div className="space-y-3.5">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                      Personal & Contact Info
                    </h5>

                    <div className="space-y-2.5">
                      <div className="flex items-center space-x-3 text-xs text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Email Address</p>
                          <p className="font-semibold text-slate-800 font-mono">{profileDetails.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Mobile Number</p>
                          <p className="font-semibold text-slate-800 font-mono">{profileDetails.mobile}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Date of Birth / Gender</p>
                          <p className="font-semibold text-slate-800">
                            {profileDetails.dob} <span className="text-slate-300">|</span> {profileDetails.gender}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 text-xs text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Residential Address</p>
                          <p className="font-semibold text-slate-700 leading-relaxed">{profileDetails.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </header>
  );
}
