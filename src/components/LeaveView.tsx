import React, { useState } from 'react';
import { 
  Plus, Search, Check, X, AlertCircle, FileText, Calendar, 
  User, CheckCircle2, ShieldAlert, Sparkles, Send, Ban, Sliders
} from 'lucide-react';
import { LeaveRequest, Employee, SystemUser } from '../types';

interface LeaveViewProps {
  leaves: LeaveRequest[];
  employees: Employee[];
  onAddLeave: (leave: LeaveRequest) => void;
  onUpdateLeave: (leave: LeaveRequest) => void;
  userRole: string;
  username: string;
  currentUser?: SystemUser;
}

export default function LeaveView({
  leaves,
  employees,
  onAddLeave,
  onUpdateLeave,
  userRole,
  username,
  currentUser
}: LeaveViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formError, setFormError] = useState('');

  // States for HR branch-specific month-wise leaves download
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');

  // Leave Limit Configuration (Sick, Casual, Earned)
  const [leaveConfig, setLeaveConfig] = useState(() => {
    const saved = localStorage.getItem('leave_configuration');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      sickTotal: 10,
      casualTotal: 12,
      earnedTotal: 15
    };
  });

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    sickTotal: leaveConfig.sickTotal,
    casualTotal: leaveConfig.casualTotal,
    earnedTotal: leaveConfig.earnedTotal
  });

  // Form Fields
  const [formData, setFormData] = useState({
    leaveType: 'Sick' as 'Sick' | 'Casual' | 'Earned',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    reason: ''
  });

  // Approvals comments state
  const [actionComments, setActionComments] = useState<{ [key: string]: string }>({});

  const canApprove = userRole === 'Super Admin' || userRole === 'HR' || userRole === 'Manager';

  // Find linked profile
  const linkedEmployee = employees.find(e => e.id === currentUser?.employeeId || e.firstName.toLowerCase() === username.toLowerCase());
  const activeBranch = linkedEmployee?.branch || currentUser?.branch || "Main Head Office";
  const activeDeptId = linkedEmployee?.departmentId || currentUser?.departmentId || "";
  const activeEmpId = linkedEmployee?.id || currentUser?.employeeId || "";

  // Filter lists with strict role hierarchy:
  // - Employee can see their logs only
  // - Manager can see his department Attendance/leave logs
  // - HR can see his branch/location Employees logs
  // - Admin can see all Employees logs
  const filteredLeaves = leaves.filter(l => {
    const emp = employees.find(e => e.id === l.employeeId);
    if (!emp) return false;

    // Apply strict role boundaries
    if (userRole === 'Employee') {
      if (l.employeeId !== activeEmpId) return false;
    } else if (userRole === 'Manager') {
      if (emp.departmentId !== activeDeptId) return false;
    } else if (userRole === 'HR') {
      if ((emp.branch || 'Main Head Office') !== activeBranch) return false;
    } // Admin sees all

    const empName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch = empName.includes(searchTerm.toLowerCase()) || 
                          l.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'All' || l.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
  };

  const getEmpRoleDept = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `EMP ID: ${emp.id}` : 'N/A';
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!linkedEmployee) {
      setFormError('Your account is not linked to an Employee profile.');
      return;
    }

    if (!formData.reason) {
      setFormError('Please provide a reason for the leave.');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      setFormError('End date cannot precede the start date.');
      return;
    }

    const nextIdNum = leaves.reduce((max, l) => {
      const num = parseInt(l.id.replace('LV-', ''));
      return num > max ? num : max;
    }, 500) + 1;

    onAddLeave({
      id: `LV-${nextIdNum}`,
      employeeId: linkedEmployee.id,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    });

    setShowApplyModal(false);
    setFormData({ leaveType: 'Sick', startDate: '2026-07-10', endDate: '2026-07-12', reason: '' });
  };

  const handleProcessLeave = (leave: LeaveRequest, status: 'Approved' | 'Rejected') => {
    const comments = actionComments[leave.id] || 'Processed via executive portal.';
    onUpdateLeave({
      ...leave,
      status,
      actionBy: `${username} (${userRole})`,
      comments
    });
  };

  // Calculate dynamic used days
  const getUsedDays = (type: 'Sick' | 'Casual' | 'Earned') => {
    const baseline = type === 'Sick' ? 2 : type === 'Casual' ? 3 : 5;
    if (!linkedEmployee) return baseline;
    const dynamicDays = leaves
      .filter(l => l.employeeId === linkedEmployee.id && l.status === 'Approved' && l.leaveType === type)
      .reduce((sum, l) => {
        const s = new Date(l.startDate);
        const e = new Date(l.endDate);
        const days = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
        return sum + (isNaN(days) ? 1 : days);
      }, 0);
    return baseline + dynamicDays;
  };

  const handleDownloadBranchLeaves = () => {
    const isSuperAdmin = userRole === 'Super Admin';
    const branchEmployees = employees.filter(emp => isSuperAdmin || (emp.branch || 'Main Head Office') === activeBranch);
    const branchEmpIds = branchEmployees.map(emp => emp.id);

    const reportLeaves = leaves.filter(l => {
      const isBranchEmployee = branchEmpIds.includes(l.employeeId);
      if (!isBranchEmployee) return false;

      // Month check: l.startDate or l.endDate falls within selected month (e.g., "2026-07")
      const matchesMonth = l.startDate.substring(0, 7) === selectedMonth || l.endDate.substring(0, 7) === selectedMonth;
      const matchesType = selectedTypeFilter === 'All' || l.leaveType === selectedTypeFilter;

      return matchesMonth && matchesType;
    });

    if (reportLeaves.length === 0) {
      alert(`No leaves found ${isSuperAdmin ? 'across all branches' : `for branch "${activeBranch}"`} in month "${selectedMonth}".`);
      return;
    }

    // Build CSV
    const headers = ['Leave ID', 'Employee ID', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Applied Date', 'Status', 'Reason', 'Reviewed By', 'Comments'];
    const rows = reportLeaves.map(l => {
      const emp = employees.find(e => e.id === l.employeeId);
      return [
        l.id,
        l.employeeId,
        emp ? `${emp.firstName} ${emp.lastName}` : 'N/A',
        l.leaveType,
        l.startDate,
        l.endDate,
        l.appliedDate,
        l.status,
        l.reason,
        l.actionBy || 'N/A',
        l.comments || 'N/A'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Leaves_Report_${isSuperAdmin ? 'All_Branches' : activeBranch.replace(/\s+/g, '_')}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBranchLeavesAllTime = () => {
    const isSuperAdmin = userRole === 'Super Admin';
    const branchEmployees = employees.filter(emp => isSuperAdmin || (emp.branch || 'Main Head Office') === activeBranch);
    const branchEmpIds = branchEmployees.map(emp => emp.id);

    const reportLeaves = leaves.filter(l => branchEmpIds.includes(l.employeeId));

    if (reportLeaves.length === 0) {
      alert(`No leaves found ${isSuperAdmin ? 'across all branches' : `for branch "${activeBranch}"`}.`);
      return;
    }

    // Build CSV
    const headers = ['Leave ID', 'Employee ID', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Applied Date', 'Status', 'Reason', 'Reviewed By', 'Comments'];
    const rows = reportLeaves.map(l => {
      const emp = employees.find(e => e.id === l.employeeId);
      return [
        l.id,
        l.employeeId,
        emp ? `${emp.firstName} ${emp.lastName}` : 'N/A',
        l.leaveType,
        l.startDate,
        l.endDate,
        l.appliedDate,
        l.status,
        l.reason,
        l.actionBy || 'N/A',
        l.comments || 'N/A'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `All_Time_Leaves_Report_${isSuperAdmin ? 'All_Branches' : activeBranch.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Dynamic Allocations card data
  const allocations = [
    { name: 'Sick Leave', used: getUsedDays('Sick'), total: leaveConfig.sickTotal, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { name: 'Casual Leave', used: getUsedDays('Casual'), total: leaveConfig.casualTotal, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { name: 'Earned Leave', used: getUsedDays('Earned'), total: leaveConfig.earnedTotal, color: 'text-blue-600 bg-blue-50 border-blue-100' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Allocation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {allocations.map((alloc, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{alloc.name} Allowance</span>
              <h4 className="text-xl font-extrabold text-slate-800">
                {alloc.total - alloc.used} <span className="text-xs text-slate-400 font-medium">days left</span>
              </h4>
              <span className="text-[9px] text-slate-400 font-semibold block">{alloc.used} used out of {alloc.total} days</span>
            </div>
            <div className={`p-3.5 rounded-xl border font-bold text-sm ${alloc.color}`}>
              {Math.round(((alloc.total - alloc.used) / alloc.total) * 100)}%
            </div>
          </div>
        ))}
      </div>

      {/* Header and buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time Off Scheduler</p>
          <h3 className="text-lg font-bold text-slate-800">Leaves & Absence Approvals</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(userRole === 'Super Admin' || userRole === 'HR') && (
            <button
              id="btn-configure-leaves"
              onClick={() => {
                setConfigForm({
                  sickTotal: leaveConfig.sickTotal,
                  casualTotal: leaveConfig.casualTotal,
                  earnedTotal: leaveConfig.earnedTotal
                });
                setShowConfigModal(true);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 flex items-center space-x-2 transition-all cursor-pointer animate-fadeIn"
            >
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Configure Limits</span>
            </button>
          )}
          {linkedEmployee ? (
            <button
              id="btn-apply-leave"
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Time Off</span>
            </button>
          ) : (
            <div className="flex items-center text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg select-none">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
              <span>No linked employee profile (View only)</span>
            </div>
          )}
        </div>
      </div>

      {/* HR Branch Leave Report Exporter Block */}
      {(userRole === 'HR' || userRole === 'Super Admin') && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-4 shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-900 rounded-xl flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {userRole === 'Super Admin' ? 'Company-wide Leaves Exporter' : `Branch Leaves Exporter (${activeBranch})`}
              </h3>
              <p className="text-[11px] text-slate-500">
                {userRole === 'Super Admin' ? 'Download leave reports and historical records across all branches.' : 'Download leave reports and historical records for employees belonging to your branch.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-white p-4 rounded-xl border border-blue-100/50">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Month Filter</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leave Type</label>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Earned">Earned Leave</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadBranchLeaves}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download Month Report</span>
              </button>
              <button
                onClick={handleDownloadBranchLeavesAllTime}
                className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                title="Download all leaves ever registered for your branch"
              >
                <span>Download All-Time</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="leave-search"
            type="text"
            placeholder="Search request by employee ID, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            id="leave-status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Approvals</option>
            <option value="Approved">Approved Leaves</option>
            <option value="Rejected">Rejected Requests</option>
          </select>
        </div>
      </div>

      {/* Requests Display Panel */}
      <div className="space-y-4">
        {filteredLeaves.length > 0 ? (
          filteredLeaves.map((leave) => {
            const isPending = leave.status === 'Pending';
            
            const statusColor = {
              Pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
              Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              Rejected: 'bg-rose-50 text-rose-700 border-rose-150'
            }[leave.status];

            return (
              <div 
                key={leave.id} 
                className={`bg-white border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-start justify-between gap-6 ${
                  isPending ? 'border-amber-200/50 bg-amber-50/10' : 'border-slate-200'
                }`}
              >
                {/* Left section: Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                      Ref: {leave.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Applied: {leave.appliedDate}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${statusColor}`}>
                      {leave.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center">
                      <User className="w-4 h-4 text-slate-400 mr-1.5 flex-shrink-0" />
                      {getEmpName(leave.employeeId)}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5 ml-5">
                      {getEmpRoleDept(leave.employeeId)}
                    </span>
                  </div>

                  <div className="pl-5 space-y-1.5 border-l border-slate-100">
                    <div className="flex items-center text-xs font-semibold text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
                      <span>Dates: <b>{leave.startDate}</b> to <b>{leave.endDate}</b> ({leave.leaveType} Leave)</span>
                    </div>
                    <p className="text-xs text-slate-500 italic leading-relaxed">
                      " {leave.reason} "
                    </p>
                  </div>

                  {/* Audit details */}
                  {leave.actionBy && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-500 font-semibold">
                        Processed by: <span className="text-slate-700 font-bold">{leave.actionBy}</span>
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        Audit Note: <span className="italic">"{leave.comments || 'No comments left.'}"</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Right section: Action Buttons for HR */}
                {isPending && (
                  <div className="w-full md:w-64 flex flex-col justify-between space-y-3 md:border-l md:border-slate-100 md:pl-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Review Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="Add reason for approval/rejection..."
                        value={actionComments[leave.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionComments(prev => ({ ...prev, [leave.id]: val }));
                        }}
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none transition-all"
                      />
                    </div>

                    {canApprove ? (
                      <div className="flex space-x-2 pt-1">
                        <button
                          id={`btn-approve-${leave.id}`}
                          onClick={() => handleProcessLeave(leave, 'Approved')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          id={`btn-reject-${leave.id}`}
                          onClick={() => handleProcessLeave(leave, 'Rejected')}
                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 font-semibold flex items-center pt-2">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                        <span>Awaiting HR / Admin authority</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center text-slate-400 shadow-sm">
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-sm">No leave requests found</p>
              <p className="text-xs text-slate-300">Filtered criteria has zero matching items.</p>
            </div>
          </div>
        )}
      </div>

      {/* APPLY LEAVE REQUEST MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowApplyModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50 animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Apply for Time Off</h3>
              <button 
                id="close-leave-modal"
                onClick={() => setShowApplyModal(false)} 
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* Leave Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Type *</label>
                <select
                  id="leave-field-type"
                  required
                  value={formData.leaveType}
                  onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Earned">Earned Leave</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date *</label>
                  <input
                    id="leave-field-start"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date *</label>
                  <input
                    id="leave-field-end"
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detailed Reason *</label>
                <textarea
                  id="leave-field-reason"
                  required
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain the necessity for this time off request..."
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all resize-none"
                />
              </div>

              {/* Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-leave-cancel"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-leave-submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURE LEAVE LIMITS MODAL */}
      {showConfigModal && (userRole === 'Super Admin' || userRole === 'HR') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowConfigModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50 animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-blue-600" />
                <span>Configure Leave Allowances</span>
              </h3>
              <button 
                id="close-config-modal"
                onClick={() => setShowConfigModal(false)} 
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('leave_configuration', JSON.stringify(configForm));
              setLeaveConfig(configForm);
              setShowConfigModal(false);
            }} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                As an authorized HR or Administrator, you have the authority to alter maximum annual leave allocations for employees.
              </p>

              {/* Sick Leave */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sick Leave Limit (Days)</label>
                <input
                  id="config-sick-limit"
                  type="number"
                  required
                  min={1}
                  value={configForm.sickTotal}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, sickTotal: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all font-mono"
                />
              </div>

              {/* Casual Leave */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Casual Leave Limit (Days)</label>
                <input
                  id="config-casual-limit"
                  type="number"
                  required
                  min={1}
                  value={configForm.casualTotal}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, casualTotal: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all font-mono"
                />
              </div>

              {/* Earned Leave */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Earned Leave Limit (Days)</label>
                <input
                  id="config-earned-limit"
                  type="number"
                  required
                  min={1}
                  value={configForm.earnedTotal}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, earnedTotal: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all font-mono"
                />
              </div>

              {/* Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-config-cancel"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-config-save"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
