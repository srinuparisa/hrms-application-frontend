import React from 'react';
import { 
  Users, Building2, CalendarCheck, FileText, Banknote, Megaphone, 
  TrendingUp, ArrowRight, CheckCircle2, AlertCircle, Clock, UserCheck, UserPlus
} from 'lucide-react';
import { Employee, Department, Designation, Attendance, LeaveRequest, Payroll, Announcement, SystemUser } from '../types';

interface DashboardViewProps {
  employees: Employee[];
  departments: Department[];
  designations?: Designation[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  payrollList: Payroll[];
  announcements: Announcement[];
  setActiveTab: (tab: string) => void;
  userRole: string;
  users?: SystemUser[];
  onUpdateUser?: (u: SystemUser) => void;
  onDeleteUser?: (id: string) => void;
  onAddEmployee?: (emp: Employee) => void;
}

export default function DashboardView({
  employees,
  departments,
  designations = [],
  attendance,
  leaves,
  payrollList,
  announcements,
  setActiveTab,
  userRole,
  users = [],
  onUpdateUser,
  onDeleteUser,
  onAddEmployee
}: DashboardViewProps) {
  // 1. Calculate KPIs
  const totalEmployees = employees.length;
  const totalDepartments = departments.length;
  
  // Today's Date
  const getSystemTodayDate = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getSystemTodayDate();
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const absentToday = todayAttendance.filter(a => a.status === 'Absent').length;
  const onLeaveToday = todayAttendance.filter(a => a.status === 'On Leave').length;

  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  
  const junePayroll = payrollList.filter(p => p.month === 'June 2026');
  const payrollAmount = junePayroll.reduce((acc, curr) => acc + curr.netSalary, 0);

  const activeAnnouncements = announcements.length;

  // 2. Department distribution data
  const deptEmployeeCount = departments.map(d => {
    const count = employees.filter(emp => emp.departmentId === d.id).length;
    return { name: d.name, count };
  });

  const maxDeptCount = Math.max(...deptEmployeeCount.map(d => d.count), 1);

  // 3. Weekly Attendance trend (last 5 days mock)
  const attendanceTrendData = [
    { label: 'Tue 6/29', present: 5, late: 2, absent: 0 },
    { label: 'Wed 6/30', present: 7, late: 0, absent: 0 },
    { label: 'Thu 7/01', present: 4, late: 2, absent: 1 },
    { label: 'Fri 7/02', present: 4, late: 2, absent: 0 },
    { label: 'Sat 7/03', present: 5, late: 1, absent: 0 } // Today
  ];

  const isSuperAdmin = userRole === 'Super Admin';
  const isHR = userRole === 'HR';
  const canManageUsers = isSuperAdmin || isHR;

  // Pending employee registrations
  const pendingRegistrations = users.filter(u => u.status === 'Pending Approval');

  const handleApproveRegistration = (pendingUser: SystemUser) => {
    // Check if there is an existing employee profile linked to this user
    const existingEmp = pendingUser.employeeId ? employees.find(e => e.id === pendingUser.employeeId) : null;
    
    if (existingEmp) {
      // The employee profile already exists (e.g. created by backend self-registration)
      // We only need to approve the system user account
      if (onUpdateUser) {
        onUpdateUser({
          ...pendingUser,
          status: 'Active'
        });
      }
    } else {
      // Generate new employee ID by finding true maximum ID
      const maxNum = employees.reduce((max, emp) => {
        if (emp.id && emp.id.startsWith('EMP-')) {
          const parsed = parseInt(emp.id.substring(4), 10);
          return (!isNaN(parsed) && parsed > max) ? parsed : max;
        }
        return max;
      }, 100);
      const nextIdNum = maxNum + 1;
      const nextEmpId = `EMP-${String(nextIdNum).padStart(3, '0')}`;
      
      // Create new Employee Profile
      const newEmp: Employee = {
        id: nextEmpId,
        firstName: pendingUser.firstName || 'Firstname',
        lastName: pendingUser.lastName || 'Lastname',
        gender: pendingUser.gender || 'Male',
        dob: pendingUser.dob || '1995-01-01',
        email: pendingUser.email,
        mobile: pendingUser.mobile || '9999999999',
        address: pendingUser.address || 'Address',
        joiningDate: new Date().toISOString().split('T')[0],
        departmentId: pendingUser.departmentId || 'DEPT-01',
        designationId: pendingUser.designationId || 'DESG-01',
        salary: 50000, // Standard default salary
        status: 'Active',
        branch: pendingUser.branch || 'Main Head Office'
      };

      // Add employee record
      if (onAddEmployee) {
        onAddEmployee(newEmp);
      }

      // Update system user with active status and linked employee ID
      if (onUpdateUser) {
        onUpdateUser({
          ...pendingUser,
          employeeId: nextEmpId,
          status: 'Active'
        });
      }
    }
  };

  const handleRejectRegistration = (pendingUser: SystemUser) => {
    if (confirm(`Are you sure you want to decline and remove the registration request for ${pendingUser.firstName || ''} ${pendingUser.lastName || ''} (${pendingUser.username})?`)) {
      if (onDeleteUser) {
        onDeleteUser(pendingUser.id);
      }
    }
  };

  const getDeptName = (deptId?: string) => {
    if (!deptId) return 'N/A';
    return departments.find(d => d.id === deptId)?.name || deptId;
  };

  const getDesgName = (desgId?: string) => {
    if (!desgId) return 'N/A';
    return designations.find(d => d.id === desgId)?.name || desgId;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Greetings Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 text-slate-800 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">Workspace ERP Overview</span>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back, Executive Hub</h3>
          <p className="text-slate-500 text-sm max-w-xl">
            Here is your daily operational summary for today, <b>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</b>. Ensure checklist processes run smoothly.
          </p>
        </div>
        <div className="mt-4 md:mt-0 relative z-10 flex space-x-3">
          <button 
            onClick={() => setActiveTab('employees')}
            className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-2 transition-all duration-150 cursor-pointer"
          >
            <span>Manage Team</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setActiveTab('leaves')}
            className="px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all duration-150 cursor-pointer"
          >
            <span>Leave Requests</span>
            {pendingLeaves > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Decorative background vectors */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* PENDING EMPLOYEE REGISTRATION APPROVALS FOR HR & ADMIN */}
      {canManageUsers && pendingRegistrations.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <UserCheck className="w-5 h-5 text-amber-850" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">Pending Employee Login Requests ({pendingRegistrations.length})</h3>
              <p className="text-[11px] text-amber-700/90">The following employee accounts are registered and awaiting login authorization approval. Approving grants them immediate access to the ERP.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingRegistrations.map(req => {
              const linkedEmp = employees.find(e => e.id === req.employeeId);
              const firstName = req.firstName || linkedEmp?.firstName || 'Pending';
              const lastName = req.lastName || linkedEmp?.lastName || 'User';
              const branch = req.branch || linkedEmp?.branch || 'N/A';
              const departmentId = req.departmentId || linkedEmp?.departmentId;
              const designationId = req.designationId || linkedEmp?.designationId;
              const mobile = req.mobile || linkedEmp?.mobile || 'N/A';
              const gender = req.gender || linkedEmp?.gender || 'N/A';

              return (
                <div key={req.id} className="bg-white border border-amber-200/60 rounded-xl p-4.5 space-y-3.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{firstName} {lastName}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Username: {req.username} • Email: {req.email}</span>
                      </div>
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Awaiting HR Approval
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-600 bg-slate-50/75 p-3 rounded-xl border border-slate-100 mt-3">
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Branch/Location:</span>
                        <span className="font-bold text-slate-700">{branch}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Department:</span>
                        <span className="font-semibold text-slate-700">{getDeptName(departmentId)}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Designation:</span>
                        <span className="font-semibold text-slate-700">{getDesgName(designationId)}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Mobile & Gender:</span>
                        <span className="font-medium text-slate-600">{mobile} ({gender})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 justify-end pt-3 border-t border-slate-50 mt-2">
                    <button
                      type="button"
                      onClick={() => handleRejectRegistration(req)}
                      className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveRegistration(req)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve & Create Profile</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Stats Cards - Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {/* Total Employees */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Staff</span>
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h4 id="kpi-total-employees" className="text-2xl font-extrabold text-slate-800 tracking-tight">{totalEmployees}</h4>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Active headcount
            </span>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departments</span>
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight">{totalDepartments}</h4>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">Cross-functional groups</span>
          </div>
        </div>

        {/* Attendance Today */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present Today</span>
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CalendarCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {presentToday} <span className="text-xs text-slate-400 font-semibold">/ {totalEmployees}</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-medium flex items-center mt-1">
              {absentToday} absent, {onLeaveToday} leave
            </span>
          </div>
        </div>

        {/* Leave Requests */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Leaves</span>
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight">{pendingLeaves}</h4>
            <span className={`text-[10px] font-bold mt-1 block ${pendingLeaves > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-500'}`}>
              {pendingLeaves > 0 ? 'Needs review and action' : 'All clear'}
            </span>
          </div>
        </div>

        {/* Payroll Processed */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">June Payroll</span>
            <div className="p-2.5 bg-teal-50 rounded-lg text-teal-600">
              <Banknote className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              ₹{(payrollAmount / 1000).toFixed(1)}k
            </h4>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center mt-1">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Paid & complete
            </span>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Broadcasts</span>
            <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
              <Megaphone className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight">{activeAnnouncements}</h4>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">Active bulletins</span>
          </div>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Attendance Bar Chart (8/12) */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Weekly Attendance Trends</h4>
              <p className="text-xs text-slate-400">Headcount statistics for current calendar week</p>
            </div>
            <div className="flex items-center space-x-3 text-[10px] font-bold">
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded bg-blue-500 mr-1.5" />
                <span className="text-slate-500">Present</span>
              </div>
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 mr-1.5" />
                <span className="text-slate-500">Late</span>
              </div>
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded bg-rose-400 mr-1.5" />
                <span className="text-slate-500">Absent</span>
              </div>
            </div>
          </div>

          {/* Premium custom SVG Stacked Bar Chart */}
          <div className="h-64 w-full relative mt-4 flex items-end justify-between px-2 pt-6 border-b border-slate-200 pb-2">
            {/* Gridlines */}
            <div className="absolute inset-x-0 bottom-2 top-6 border-t border-slate-100 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-b border-slate-100 h-0" />
              <div className="w-full border-b border-slate-100 h-0" />
              <div className="w-full border-b border-slate-100 h-0" />
              <div className="w-full border-b border-slate-100 h-0" />
            </div>

            {/* Y Axis Guide numbers */}
            <div className="absolute left-0 top-3 text-[9px] font-bold text-slate-400 flex flex-col h-full justify-between pointer-events-none">
              <span>8 EMP</span>
              <span>6 EMP</span>
              <span>4 EMP</span>
              <span>2 EMP</span>
              <span>0 EMP</span>
            </div>

            {/* Bars rendering */}
            {attendanceTrendData.map((data, idx) => {
              const maxScale = 8; // 8 employees maximum in scale
              const presentHeight = (data.present / maxScale) * 100;
              const lateHeight = (data.late / maxScale) * 100;
              const absentHeight = (data.absent / maxScale) * 100;

              return (
                <div key={idx} className="flex flex-col items-center flex-1 mx-2 relative group z-10">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 bg-slate-900 text-white text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-20 whitespace-nowrap">
                    Present: {data.present} | Late: {data.late} | Absent: {data.absent}
                  </div>

                  {/* Stacked bar */}
                  <div className="w-10 sm:w-12 flex flex-col justify-end space-y-0.5 rounded-t-md overflow-hidden h-48 bg-slate-50">
                    {data.absent > 0 && (
                      <div 
                        style={{ height: `${absentHeight}%` }} 
                        className="bg-rose-400 hover:bg-rose-500 transition-colors cursor-pointer"
                      />
                    )}
                    {data.late > 0 && (
                      <div 
                        style={{ height: `${lateHeight}%` }} 
                        className="bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer"
                      />
                    )}
                    {data.present > 0 && (
                      <div 
                        style={{ height: `${presentHeight}%` }} 
                        className="bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
                      />
                    )}
                  </div>

                  {/* X Axis label */}
                  <span className="text-[10px] font-semibold text-slate-500 mt-2 block">{data.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Department Breakdown Progress list (5/12) */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Department Share</h4>
            <p className="text-xs text-slate-400 mb-6">Staff distribution per functional team</p>
            
            <div className="space-y-4">
              {deptEmployeeCount.map((dept, idx) => {
                const percentage = Math.round((dept.count / totalEmployees) * 100);
                const colorPalette = ['bg-blue-600', 'bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                const bgColors = ['bg-blue-50', 'bg-indigo-50', 'bg-emerald-50', 'bg-amber-50', 'bg-rose-50'];
                const textColors = ['text-blue-700', 'text-indigo-700', 'text-emerald-700', 'text-amber-700', 'text-rose-700'];

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${colorPalette[idx % colorPalette.length]}`} />
                        <span className="text-slate-700">{dept.name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-800">{dept.count} Staff</span>
                        <span className={`px-1.5 py-0.5 text-[9px] rounded-md font-bold ${bgColors[idx % bgColors.length]} ${textColors[idx % textColors.length]}`}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar background */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${(dept.count / maxDeptCount) * 100}%` }} 
                        className={`h-full rounded-full transition-all duration-500 ${colorPalette[idx % colorPalette.length]}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('departments')}
            className="w-full mt-6 flex items-center justify-center py-2 text-xs font-bold text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all duration-150"
          >
            <span>View All Departments</span>
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </button>
        </div>
      </div>

      {/* Grid: Live Announcements & Action Checklist */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Latest Announcements */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800">Bulletin & Announcements</h4>
            <button 
              onClick={() => setActiveTab('announcements')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
            >
              <span>Bulletin Board</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {announcements.slice(0, 3).map((ann) => {
              const categoryColor = {
                Policy: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                Event: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                Urgent: 'bg-rose-50 text-rose-700 border-rose-200',
                General: 'bg-blue-50 text-blue-700 border-blue-200'
              }[ann.category];

              return (
                <div key={ann.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${categoryColor}`}>
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{ann.date}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">• Audience: {ann.targetAudience}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 leading-snug">{ann.title}</h5>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Pending Items (Approvals / Checks) */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4">Urgent Actions Queue</h4>
          
          <div className="space-y-4">
            {/* Login Registrations Pending */}
            {canManageUsers && pendingRegistrations.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between animate-pulse-slow">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-800">
                      {pendingRegistrations.length} Login Approval Request{pendingRegistrations.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 font-bold rounded">
                      Awaiting HR
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Employees registered accounts that are pending HR clearance to sign in.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    // Scroll to top or view them on the dashboard
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-1.5 rounded-lg border border-amber-200 transition-all duration-150 cursor-pointer"
                >
                  Review Now
                </button>
              </div>
            )}

            {/* Leaves Pending */}
            {leaves.filter(l => l.status === 'Pending').length > 0 ? (
              leaves.filter(l => l.status === 'Pending').slice(0, 2).map((l) => {
                const emp = employees.find(e => e.id === l.employeeId);
                return (
                  <div key={l.id} className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-800">
                          {emp ? `${emp.firstName} ${emp.lastName}` : 'Employee'} Applied
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 font-bold rounded">
                          {l.leaveType} Leave
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 italic">"{l.reason}"</p>
                      <span className="text-[10px] text-slate-400 block font-medium">Dates: {l.startDate} to {l.endDate}</span>
                    </div>
                    <button 
                      onClick={() => setActiveTab('leaves')}
                      className="text-xs font-bold text-blue-600 hover:bg-blue-100/50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-blue-200 transition-all duration-150"
                    >
                      Process
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-3 text-emerald-800 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <h5 className="font-bold">All leaves up to date</h5>
                  <p className="text-emerald-700 font-medium">No pending leave requests require authorization at this time.</p>
                </div>
              </div>
            )}

            {/* General Task Instructions for high-fidelity Sandbox guidance */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                <Clock className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                HR Operations Checklist
              </h5>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="line-through text-slate-400">Generate salary slips for June 2026</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked={totalEmployees > 7} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span>Onboard new hires in Engineering (EMP-108+)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span>Review July holiday scheduling with team</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
