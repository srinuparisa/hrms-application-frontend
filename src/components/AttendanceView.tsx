import React, { useState } from 'react';
import { 
  Plus, Search, Edit2, Trash2, X, AlertCircle, Calendar, 
  Clock, CheckCircle, AlertTriangle, ShieldCheck, UserCheck, Check, Send
} from 'lucide-react';
import { Attendance, Employee, SystemUser } from '../types';

// Constants for shift timing rules
const SHIFT_START_TIMES = {
  General: '09:00',
  Morning: '06:00',
  Afternoon: '14:00',
  Night: '22:00'
};

const SHIFT_END_TIMES = {
  General: '17:00',
  Morning: '14:00',
  Afternoon: '22:00',
  Night: '06:00'
};

// Calculates if attendance is late and by how many minutes
const calculateLateMinutes = (
  checkIn: string,
  shift: 'General' | 'Morning' | 'Afternoon' | 'Night',
  gracePeriod: number
): { isLate: boolean; lateMinutes: number } => {
  if (!checkIn || checkIn === '00:00') {
    return { isLate: false, lateMinutes: 0 };
  }
  
  const startTimeStr = SHIFT_START_TIMES[shift] || '09:00';
  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [checkH, checkM] = checkIn.split(':').map(Number);
  
  if (isNaN(startH) || isNaN(startM) || isNaN(checkH) || isNaN(checkM)) {
    return { isLate: false, lateMinutes: 0 };
  }
  
  const startTotalMins = startH * 60 + startM;
  let checkTotalMins = checkH * 60 + checkM;
  
  let diff = checkTotalMins - startTotalMins;
  
  // Night shift wraps around midnight
  if (shift === 'Night' && diff < -600) {
    checkTotalMins += 24 * 60;
    diff = checkTotalMins - startTotalMins;
  }
  
  if (diff > gracePeriod) {
    return { isLate: true, lateMinutes: diff };
  }
  
  return { isLate: false, lateMinutes: 0 };
};

// Calculates total working hours
const calculateWorkingHours = (checkIn: string, checkOut: string | null): number => {
  if (!checkIn || !checkOut || checkIn === '00:00' || checkOut === '00:00') return 0;
  
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  
  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;
  
  let inTotal = inH * 60 + inM;
  let outTotal = outH * 60 + outM;
  
  let diffMins = outTotal - inTotal;
  if (diffMins < 0) {
    // Crosses midnight
    diffMins += 24 * 60;
  }
  
  return parseFloat((diffMins / 60).toFixed(2));
};

interface AttendanceViewProps {
  attendance: Attendance[];
  employees: Employee[];
  onAddAttendance: (log: Attendance) => void;
  onUpdateAttendance: (log: Attendance) => void;
  onDeleteAttendance: (id: string) => void;
  userRole: string;
  username: string;
  currentUser?: SystemUser;
}

const getSystemTodayDate = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSystemCurrentMonth = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function AttendanceView({
  attendance,
  employees,
  onAddAttendance,
  onUpdateAttendance,
  onDeleteAttendance,
  userRole,
  username,
  currentUser
}: AttendanceViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getSystemCurrentMonth()); // Defaults to current month
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLog, setEditingLog] = useState<Attendance | null>(null);
  const [formError, setFormError] = useState('');

  // Regularization Modal State
  const [showRegularizeModal, setShowRegularizeModal] = useState(false);
  const [regularizingLog, setRegularizingLog] = useState<Attendance | null>(null);
  const [regReason, setRegReason] = useState('');
  const [regCheckIn, setRegCheckIn] = useState('09:00');
  const [regCheckOut, setRegCheckOut] = useState('17:00');

  // Simulated Live Punch State
  const [simulatedShift, setSimulatedShift] = useState<'General' | 'Morning' | 'Afternoon' | 'Night'>('General');
  const [simulatedGrace, setSimulatedGrace] = useState<number>(15);

  // Form Fields (For manual entries)
  const [formData, setFormData] = useState({
    employeeId: '',
    date: getSystemTodayDate(),
    checkIn: '09:00',
    checkOut: '17:00',
    status: 'Present' as 'Present' | 'Late' | 'Absent' | 'On Leave',
    shift: 'General' as 'General' | 'Morning' | 'Afternoon' | 'Night',
    gracePeriod: 15
  });

  const canModify = userRole === 'Super Admin' || userRole === 'HR' || userRole === 'Manager';

  // Find linked profile for active employee simulation
  const linkedEmployee = employees.find(e => e.id === currentUser?.employeeId || e.firstName.toLowerCase() === username.toLowerCase());
  const todayLog = linkedEmployee 
    ? attendance.find(a => a.employeeId === linkedEmployee.id && a.date === getSystemTodayDate())
    : null;

  // Punch clock simulator
  const handlePunchClock = () => {
    if (!linkedEmployee) {
      alert('Your user account is not linked to an Employee Profile. Please link an employee under User Management first.');
      return;
    }

    const timeStr = new Date().toTimeString().slice(0, 5);

    if (!todayLog) {
      // Clock In with selected shift & grace rules
      const nextId = `ATT-${Date.now()}`;
      const { isLate, lateMinutes } = calculateLateMinutes(timeStr, simulatedShift, simulatedGrace);
      
      onAddAttendance({
        id: nextId,
        employeeId: linkedEmployee.id,
        date: getSystemTodayDate(),
        checkIn: timeStr,
        checkOut: null,
        workingHours: 0,
        status: isLate ? 'Late' : 'Present',
        shift: simulatedShift,
        gracePeriod: simulatedGrace,
        lateMinutes: lateMinutes,
        regularizationStatus: 'None'
      });
    } else if (todayLog && !todayLog.checkOut) {
      // Clock Out
      const diff = calculateWorkingHours(todayLog.checkIn, timeStr);

      onUpdateAttendance({
        ...todayLog,
        checkOut: timeStr,
        workingHours: diff || 8.0
      });
    } else {
      alert('You have already completed your Attendance cycle for today.');
    }
  };

  // Regularization actions handled by Managers/HR/Admin
  const handleActionRegularization = (id: string, action: 'Approved' | 'Rejected') => {
    const req = attendance.find(a => a.id === id);
    if (!req) return;
    
    if (action === 'Approved') {
      const targetCheckIn = req.regularizationCheckIn || SHIFT_START_TIMES[req.shift || 'General'] || '09:00';
      const targetCheckOut = req.regularizationCheckOut || req.checkOut || null;
      const diffHours = calculateWorkingHours(targetCheckIn, targetCheckOut);
      
      onUpdateAttendance({
        ...req,
        checkIn: targetCheckIn,
        checkOut: targetCheckOut,
        status: 'Present',
        lateMinutes: 0,
        workingHours: diffHours,
        regularizationStatus: 'Approved'
      });
      alert(`Success! Regularization approved for ${getEmpName(req.employeeId)}. Times corrected to In: ${targetCheckIn}, Out: ${targetCheckOut || '--:--'}, and late mark has been removed.`);
    } else {
      onUpdateAttendance({
        ...req,
        regularizationStatus: 'Rejected'
      });
      alert(`Regularization request rejected for ${getEmpName(req.employeeId)}.`);
    }
  };

  // Open regularize submission modal for employee
  const openRegularizeModal = (log: Attendance) => {
    setRegularizingLog(log);
    const defaultShiftStart = SHIFT_START_TIMES[log.shift || 'General'] || '09:00';
    const defaultShiftEnd = SHIFT_END_TIMES[log.shift || 'General'] || '17:00';
    setRegCheckIn(log.checkIn || defaultShiftStart);
    setRegCheckOut(log.checkOut || defaultShiftEnd);
    setRegReason('');
    setShowRegularizeModal(true);
  };

  // Submit regularization request to manager
  const handleSubmitRegularization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regularizingLog) return;

    onUpdateAttendance({
      ...regularizingLog,
      regularizationStatus: 'Pending',
      regularizationReason: regReason,
      regularizationCheckIn: regCheckIn,
      regularizationCheckOut: regCheckOut
    });

    setShowRegularizeModal(false);
    alert('Regularization request raised successfully! This request is routed to your manager for review and database correction.');
  };

  // Find linked profile
  const exactEmployee = employees.find(e => e.id === currentUser?.employeeId || e.firstName.toLowerCase() === username.toLowerCase());
  const activeBranch = exactEmployee?.branch || currentUser?.branch || "Main Head Office";
  const activeDeptId = exactEmployee?.departmentId || currentUser?.departmentId || "";
  const activeEmpId = exactEmployee?.id || currentUser?.employeeId || "";

  // Filter attendance logs
  const filteredLogs = attendance.filter(log => {
    const emp = employees.find(e => e.id === log.employeeId);
    if (!emp) return false;

    // Apply strict role visibility permissions:
    // - Employee: Can see their logs only
    // - Manager: Can see their department's attendance logs
    // - HR: Can see their branch/location Employees logs
    // - Admin: Can see all Employees logs
    if (userRole === 'Employee') {
      if (log.employeeId !== activeEmpId) return false;
    } else if (userRole === 'Manager') {
      if (emp.departmentId !== activeDeptId) return false;
    } else if (userRole === 'HR') {
      if ((emp.branch || 'Main Head Office') !== activeBranch) return false;
    } // Admin sees all

    const empName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : '';
    const matchesSearch = empName.includes(searchTerm.toLowerCase()) || 
                          log.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedMonth || log.date.startsWith(selectedMonth);
    const matchesStatus = selectedStatus === 'All' || log.status === selectedStatus;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
  };

  const getDisplayLateMinutes = (log: Attendance): string => {
    if (log.lateMinutes !== undefined) {
      return log.lateMinutes > 0 ? `${log.lateMinutes} mins` : '--';
    }
    if (log.status === 'Late') {
      const { lateMinutes } = calculateLateMinutes(log.checkIn, log.shift || 'General', log.gracePeriod || 15);
      return lateMinutes > 0 ? `${lateMinutes} mins` : 'Late';
    }
    return '--';
  };

  const openAddModal = () => {
    setEditingLog(null);
    setFormError('');
    setFormData({
      employeeId: employees[0]?.id || '',
      date: getSystemTodayDate(),
      checkIn: '09:00',
      checkOut: '17:00',
      status: 'Present',
      shift: 'General',
      gracePeriod: 15
    });
    setShowFormModal(true);
  };

  const openEditModal = (log: Attendance) => {
    setEditingLog(log);
    setFormError('');
    setFormData({
      employeeId: log.employeeId,
      date: log.date,
      checkIn: log.checkIn,
      checkOut: log.checkOut || '',
      status: log.status,
      shift: log.shift || 'General',
      gracePeriod: log.gracePeriod || 15
    });
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.employeeId || !formData.date || !formData.checkIn) {
      setFormError('Mandatory fields missing.');
      return;
    }

    // Auto-calculate status and late mins
    const { isLate, lateMinutes } = calculateLateMinutes(formData.checkIn, formData.shift, formData.gracePeriod);
    const calculatedStatus = isLate ? 'Late' : 'Present';
    const finalStatus = formData.status === 'Absent' || formData.status === 'On Leave' ? formData.status : calculatedStatus;

    const diff = calculateWorkingHours(formData.checkIn, formData.checkOut || null);

    if (editingLog) {
      onUpdateAttendance({
        ...editingLog,
        employeeId: formData.employeeId,
        date: formData.date,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut || null,
        status: finalStatus,
        workingHours: diff,
        shift: formData.shift,
        gracePeriod: formData.gracePeriod,
        lateMinutes: finalStatus === 'Late' ? lateMinutes : 0
      });
    } else {
      const nextId = `ATT-${Date.now()}`;
      onAddAttendance({
        id: nextId,
        employeeId: formData.employeeId,
        date: formData.date,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut || null,
        status: finalStatus,
        workingHours: diff,
        shift: formData.shift,
        gracePeriod: formData.gracePeriod,
        lateMinutes: finalStatus === 'Late' ? lateMinutes : 0,
        regularizationStatus: 'None'
      });
    }

    setShowFormModal(false);
  };

  const pendingRequests = attendance.filter(a => a.regularizationStatus === 'Pending');

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Simulation Punch Clock Widget with Shift & Grace Settings */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-750 rounded-2xl p-6 text-white border border-blue-500/20 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-3 text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-sm font-bold tracking-wide">Live Punch Clock Terminal</h4>
          </div>
          <p className="text-xs text-blue-100 max-w-md leading-relaxed">
            Logged in as <b>{username}</b> ({userRole}). Quick-log attendance with biometric simulation:
          </p>
          
          <div className="block">
            <span className="inline-block bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 mb-2">
              Linked Profile: {linkedEmployee ? `${linkedEmployee.firstName} ${linkedEmployee.lastName} (${linkedEmployee.id})` : `${currentUser?.firstName || currentUser?.username || username} (${currentUser?.id || 'N/A'})`}
            </span>
          </div>

          {/* Simulated Shift Assign dropdowns */}
          {!todayLog && (
            <div className="flex flex-wrap gap-3 bg-white/5 border border-white/10 p-3 rounded-xl max-w-lg">
              <div className="flex-1 min-w-[130px] text-left">
                <label className="text-[9px] font-bold uppercase text-blue-200 tracking-wide block mb-1">Simulated Shift</label>
                <select
                  id="sim-shift-select"
                  value={simulatedShift}
                  onChange={(e) => setSimulatedShift(e.target.value as any)}
                  className="w-full bg-slate-800 border border-white/20 text-white rounded-lg px-2.5 py-1 text-[11px] outline-none cursor-pointer focus:border-white/40 font-medium"
                >
                  <option value="General">General (09:00 AM)</option>
                  <option value="Morning">Morning (06:00 AM)</option>
                  <option value="Afternoon">Afternoon (02:00 PM)</option>
                  <option value="Night">Night (10:00 PM)</option>
                </select>
              </div>
              <div className="flex-1 min-w-[130px] text-left">
                <label className="text-[9px] font-bold uppercase text-blue-200 tracking-wide block mb-1">Set Grace Period</label>
                <select
                  id="sim-grace-select"
                  value={simulatedGrace}
                  onChange={(e) => setSimulatedGrace(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-white/20 text-white rounded-lg px-2.5 py-1 text-[11px] outline-none cursor-pointer focus:border-white/40 font-medium"
                >
                  <option value={0}>No Grace</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4.5">
          <div className="text-center sm:text-right">
            {!todayLog ? (
              <span className="text-xs text-blue-200 block font-semibold">Status: Not Clocked In</span>
            ) : !todayLog.checkOut ? (
              <div className="space-y-1">
                <span className="text-xs text-emerald-200 block font-bold">Clocked In at {todayLog.checkIn}</span>
                <span className="text-[10px] text-blue-200/90 block bg-blue-900/40 px-2 py-0.5 rounded">
                  Shift: {todayLog.shift || 'General'} (Grace: {todayLog.gracePeriod || 0}m)
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-xs text-slate-200 block font-semibold">Finished: {todayLog.checkIn} - {todayLog.checkOut} ({todayLog.workingHours} hrs)</span>
                <span className="text-[10px] text-emerald-400 block font-bold">Status: {todayLog.status}</span>
              </div>
            )}
          </div>

          <button
            id="btn-punch-clock"
            onClick={handlePunchClock}
            className={`px-6 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shadow-lg shadow-blue-900/20 cursor-pointer ${
              !todayLog 
                ? 'bg-white text-blue-800 hover:bg-slate-50' 
                : !todayLog.checkOut 
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
            disabled={todayLog && todayLog.checkOut ? true : false}
          >
            <Clock className="w-4 h-4" />
            <span>
              {!todayLog ? 'Punch In (Start Shift)' : !todayLog.checkOut ? 'Punch Out (End Shift)' : 'Shift Completed'}
            </span>
          </button>
        </div>
      </div>

      {/* PENDING REGULARIZATION REQUESTS (Manager Review Desk) */}
      {canModify && pendingRequests.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">Pending Regularization Requests ({pendingRequests.length})</h3>
              <p className="text-[11px] text-amber-700/90">Review employee requests to update check-in logs and eliminate late markings.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map(req => (
              <div key={req.id} className="bg-white border border-amber-200/60 rounded-xl p-4.5 space-y-3.5 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{getEmpName(req.employeeId)}</h4>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{req.employeeId} • Date: {req.date}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {req.shift || 'General'} Shift
                  </span>
                </div>
                
                <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-[10px] pb-2 border-b border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block font-bold uppercase tracking-wider text-[8px] mb-0.5">Actual Times</span>
                      <span className="font-mono text-rose-600 font-bold block">In: {req.checkIn}</span>
                      <span className="font-mono text-rose-600 font-bold block">Out: {req.checkOut || '--:--'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold uppercase tracking-wider text-[8px] mb-0.5">Requested Correct</span>
                      <span className="font-mono text-emerald-600 font-bold block">In: {req.regularizationCheckIn || '09:00'}</span>
                      <span className="font-mono text-emerald-600 font-bold block">Out: {req.regularizationCheckOut || '--:--'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">Reason for Regularization:</span>
                    <p className="italic text-slate-600 leading-normal">" {req.regularizationReason || 'No reason specified' } "</p>
                  </div>
                </div>
                
                <div className="flex space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleActionRegularization(req.id, 'Rejected')}
                    className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Reject Request
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActionRegularization(req.id, 'Approved')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Approve & Correct DB</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Biometric Tracking</p>
          <h3 className="text-lg font-bold text-slate-800">Attendance Log Database</h3>
        </div>
        {canModify && (
          <button
            id="btn-add-attendance"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Attendance Manually</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="attendance-search"
            type="text"
            placeholder="Search employee by name, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Month Selector */}
        <div className="w-full md:w-52">
          <input
            id="attendance-month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none cursor-pointer"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <select
            id="attendance-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Table listing with "Late by mins" and "Shift" */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">ID / Employee</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Shift</th>
                <th className="py-4 px-4">Check In</th>
                <th className="py-4 px-4">Check Out</th>
                <th className="py-4 px-4 text-center">Late by mins</th>
                <th className="py-4 px-4 text-center">Working Hours</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const statusColors = {
                    Present: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    Late: 'bg-amber-50 text-amber-700 border-amber-200',
                    Absent: 'bg-rose-50 text-rose-700 border-rose-100',
                    'On Leave': 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  }[log.status];

                  const isOwnRecord = linkedEmployee?.id === log.employeeId;
                  const canRegularize = isOwnRecord && (!log.regularizationStatus || log.regularizationStatus === 'None');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 px-6 flex items-center space-x-3.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 uppercase border border-slate-200 flex-shrink-0">
                          {log.employeeId.replace('EMP-', '')}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{getEmpName(log.employeeId)}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{log.employeeId}</span>
                        </div>
                      </td>
                      <td className="py-4.5 px-4 font-semibold text-slate-600">{log.date}</td>
                      <td className="py-4.5 px-4 font-bold text-slate-500">
                        <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-200/60 uppercase">
                          {log.shift || 'General'}
                        </span>
                      </td>
                      <td className="py-4.5 px-4">
                        <div className="font-mono font-medium text-slate-500">
                          {log.checkIn === '00:00' ? '--:--' : log.checkIn}
                        </div>
                        {log.regularizationStatus && log.regularizationStatus !== 'None' && (
                          <span className={`inline-block text-[9px] font-bold mt-1 px-2 py-0.5 rounded border ${
                            log.regularizationStatus === 'Pending' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : log.regularizationStatus === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            Reg: {log.regularizationStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-4.5 px-4 font-mono font-medium text-slate-500">
                        {log.checkOut || (log.status === 'Present' || log.status === 'Late' ? (
                          <span className="text-emerald-500 font-bold text-[10px] animate-pulse flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 block" />
                            Active Shift
                          </span>
                        ) : '--:--')}
                      </td>
                      {/* LATE BY MINS COLUMN */}
                      <td className="py-4.5 px-4 text-center">
                        <span className={`font-mono text-xs font-bold ${log.status === 'Late' ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60' : 'text-slate-400'}`}>
                          {getDisplayLateMinutes(log)}
                        </span>
                      </td>
                      <td className="py-4.5 px-4 text-center font-mono font-bold text-slate-700">
                        {log.workingHours > 0 ? `${log.workingHours} hrs` : '--'}
                      </td>
                      <td className="py-4.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${statusColors}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Regularize button for logged in Late employee */}
                          {canRegularize && (
                            <button
                              id={`btn-reg-req-${log.id}`}
                              onClick={() => openRegularizeModal(log)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                              title="Request shift correction/regularization"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>Regularize</span>
                            </button>
                          )}
                          
                          {/* HR & Manager controls */}
                          {canModify && (
                            <>
                              <button
                                id={`btn-edit-att-${log.id}`}
                                onClick={() => openEditModal(log)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Modify Log"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-att-${log.id}`}
                                onClick={() => {
                                  if (confirm(`Remove this attendance record?`)) {
                                    onDeleteAttendance(log.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Remove Log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">No records logged for this filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT/ADD MANUAL LOG MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowFormModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50 animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingLog ? `Adjust Log: ${getEmpName(editingLog.employeeId)}` : 'Create Attendance Record'}
              </h3>
              <button 
                id="close-att-modal"
                onClick={() => setShowFormModal(false)} 
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* Employee Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee *</label>
                <select
                  id="att-field-employee"
                  required
                  disabled={editingLog ? true : false}
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.id})</option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date *</label>
                <input
                  id="att-field-date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none"
                />
              </div>

              {/* Shift Timing Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Timing *</label>
                  <select
                    id="att-field-shift"
                    value={formData.shift}
                    onChange={(e) => setFormData(prev => ({ ...prev, shift: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="General">General (09:00 AM)</option>
                    <option value="Morning">Morning (06:00 AM)</option>
                    <option value="Afternoon">Afternoon (02:00 PM)</option>
                    <option value="Night">Night (10:00 PM)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grace Period *</label>
                  <select
                    id="att-field-grace"
                    value={formData.gracePeriod}
                    onChange={(e) => setFormData(prev => ({ ...prev, gracePeriod: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    <option value={0}>No Grace Period</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>

              {/* Check in & Check out */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check In (HH:MM) *</label>
                  <input
                    id="att-field-checkIn"
                    type="text"
                    placeholder="09:00"
                    required
                    value={formData.checkIn}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check Out (HH:MM)</label>
                  <input
                    id="att-field-checkOut"
                    type="text"
                    placeholder="17:00"
                    value={formData.checkOut}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Log Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Override (Status)</label>
                <select
                  id="att-field-status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer font-medium"
                >
                  <option value="Present">Auto-Calculate (Present/Late)</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                </select>
                <p className="text-[9px] text-slate-400 mt-1">
                  Selecting Auto-Calculate automatically computes status & late minutes based on check-in time, shift type, and grace period setup.
                </p>
              </div>

              {/* Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-att-cancel"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-att-save"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
                >
                  {editingLog ? 'Save Adjustments' : 'Log Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGULARIZATION MODAL (EMPLOYEE SIDE) */}
      {showRegularizeModal && regularizingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowRegularizeModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50 animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Raise Regularization Request</h3>
                <p className="text-[10px] text-slate-400 font-medium">Request correction for Late check-in log</p>
              </div>
              <button 
                id="close-reg-modal"
                onClick={() => setShowRegularizeModal(false)} 
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRegularization} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs leading-normal">
                You are requesting correction for your log on <b>{regularizingLog.date}</b> (Actual In: <b>{regularizingLog.checkIn}</b>, Out: <b>{regularizingLog.checkOut || '--:--'}</b> under <b>{regularizingLog.shift || 'General'}</b> Shift).
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Requested In-time */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested In-Time *</label>
                  <input
                    id="reg-field-time"
                    type="text"
                    required
                    value={regCheckIn}
                    onChange={(e) => setRegCheckIn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none font-mono"
                    placeholder="09:00"
                  />
                </div>

                {/* Requested Out-time */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested Out-Time *</label>
                  <input
                    id="reg-field-checkout"
                    type="text"
                    required
                    value={regCheckOut}
                    onChange={(e) => setRegCheckOut(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none font-mono"
                    placeholder="17:00"
                  />
                </div>
              </div>
              <p className="text-[9px] text-slate-400">Specify correct timings to adjust attendance status and calculate working hours correctly.</p>

              {/* Reason for regularization */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason for Correction *</label>
                <textarea
                  id="reg-field-reason"
                  required
                  rows={3}
                  value={regReason}
                  onChange={(e) => setRegReason(e.target.value)}
                  placeholder="e.g. Client site meeting / transit delays / biometric device sync error"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-reg-cancel"
                  onClick={() => setShowRegularizeModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-reg-submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
