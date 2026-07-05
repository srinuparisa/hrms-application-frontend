import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Search, Filter, AlertCircle, Sparkles, Printer, ArrowRight, ShieldCheck } from 'lucide-react';
import { Employee, Department, Designation, Attendance, LeaveRequest, Payroll, AuditLog } from '../types';

interface ReportViewProps {
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  payrollList: Payroll[];
  auditLogs?: AuditLog[];
}

type ReportTab = 'Employee' | 'Attendance' | 'Leave' | 'Payroll' | 'Audit';

export default function ReportView({
  employees,
  departments,
  designations,
  attendance,
  leaves,
  payrollList,
  auditLogs = []
}: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('Employee');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('2026-07-02'); // Defaults to today
  const [monthFilter, setMonthFilter] = useState('June 2026');

  // Helper getters
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';
  const getDesgName = (id: string) => designations.find(d => d.id === id)?.name || 'N/A';
  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
  };

  // --- 1. FILTER REPORT DATA ---
  
  // A. Employee Report
  const employeeReportData = employees.filter(emp => {
    const matchesDept = deptFilter === 'All' || emp.departmentId === deptFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    return matchesDept && matchesStatus;
  });

  // B. Attendance Report
  const attendanceReportData = attendance.filter(log => {
    const emp = employees.find(e => e.id === log.employeeId);
    const matchesDept = deptFilter === 'All' || emp?.departmentId === deptFilter;
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
    const matchesDate = !dateFilter || log.date === dateFilter;
    return matchesDept && matchesStatus && matchesDate;
  });

  // C. Leave Report
  const leaveReportData = leaves.filter(l => {
    const emp = employees.find(e => e.id === l.employeeId);
    const matchesDept = deptFilter === 'All' || emp?.departmentId === deptFilter;
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesDept && matchesStatus;
  });

  // D. Payroll Report
  const payrollReportData = payrollList.filter(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    const matchesDept = deptFilter === 'All' || emp?.departmentId === deptFilter;
    const matchesMonth = p.month === monthFilter;
    return matchesDept && matchesMonth;
  });

  // E. Audit Report
  const auditReportData = auditLogs.filter(log => {
    const matchesAction = deptFilter === 'All' || log.actionType === deptFilter;
    const matchesActorRole = statusFilter === 'All' || log.actorRole === statusFilter;
    return matchesAction && matchesActorRole;
  });

  // --- 2. COMPILE EXPORTS (Excel/CSV simulation and trigger download!) ---
  const handleExportExcel = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `${activeTab}_Report_${new Date().toISOString().split('T')[0]}`;

    if (activeTab === 'Employee') {
      headers = ['Employee ID', 'Full Name', 'Gender', 'Email', 'Mobile', 'Department', 'Designation', 'Joining Date', 'Monthly Salary', 'Status'];
      rows = employeeReportData.map(emp => [
        emp.id,
        `${emp.firstName} ${emp.lastName}`,
        emp.gender,
        emp.email,
        emp.mobile,
        getDeptName(emp.departmentId),
        getDesgName(emp.designationId),
        emp.joiningDate,
        emp.salary.toString(),
        emp.status
      ]);
    } else if (activeTab === 'Attendance') {
      headers = ['ID', 'Employee Name', 'Date', 'Check In', 'Check Out', 'Hours Logged', 'Status'];
      rows = attendanceReportData.map(log => [
        log.id,
        getEmpName(log.employeeId),
        log.date,
        log.checkIn,
        log.checkOut || '--:--',
        log.workingHours.toString(),
        log.status
      ]);
    } else if (activeTab === 'Leave') {
      headers = ['ID', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Reason', 'Status', 'Applied Date'];
      rows = leaveReportData.map(l => [
        l.id,
        getEmpName(l.employeeId),
        l.leaveType,
        l.startDate,
        l.endDate,
        l.reason,
        l.status,
        l.appliedDate
      ]);
    } else if (activeTab === 'Payroll') {
      headers = ['ID', 'Employee Name', 'Month', 'Basic Salary', 'HRA', 'Allowances', 'Deductions', 'Net Salary', 'Status'];
      rows = payrollReportData.map(p => [
        p.id,
        getEmpName(p.employeeId),
        p.month,
        p.basicSalary.toString(),
        p.hra.toString(),
        p.allowances.toString(),
        p.deductions.toString(),
        p.netSalary.toString(),
        p.status
      ]);
    } else if (activeTab === 'Audit') {
      headers = ['Log ID', 'Timestamp', 'Operator', 'Role', 'Action Type', 'Affected Entity', 'Record ID', 'Modification Details'];
      rows = auditReportData.map(log => [
        log.id,
        log.timestamp,
        log.actorUsername,
        log.actorRole,
        log.actionType,
        log.affectedTable,
        log.affectedRecordId,
        log.details
      ]);
    }

    // Generate CSV string
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    // Elegant system-level print view trigger
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn print:bg-white print:p-8">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-4 scrollbar-none print:hidden">
        {(['Employee', 'Attendance', 'Leave', 'Payroll', 'Audit'] as ReportTab[]).map(tab => (
          <button
            key={tab}
            id={`tab-report-${tab}`}
            onClick={() => {
              setActiveTab(tab);
              // Reset filters that might interfere
              setStatusFilter('All');
              setDeptFilter('All');
            }}
            className={`py-3 px-1.5 border-b-2 font-bold text-xs tracking-tight transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-700' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>{tab === 'Audit' ? 'System Audit Log' : `${tab} Register Report`}</span>
          </button>
        ))}
      </div>

      {/* Control Filters Block */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-2" />
          Filter Configuration
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Department Filter / Action Type for Audit */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {activeTab === 'Audit' ? 'Action Type' : 'Department'}
            </label>
            {activeTab === 'Audit' ? (
              <select
                id="report-action-filter"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Actions</option>
                <option value="INSERT">INSERT (Create)</option>
                <option value="UPDATE">UPDATE (Modify)</option>
                <option value="DELETE">DELETE (Remove)</option>
                <option value="ROLE_SWITCH">ROLE_SWITCH (Clearance Adjustments)</option>
                <option value="LEAVE_APPROVAL">LEAVE_APPROVAL (Approvals)</option>
                <option value="PASSWORD_RESET">PASSWORD_RESET</option>
                <option value="USER_APPROVAL">USER_APPROVAL (Access Approvals)</option>
              </select>
            ) : (
              <select
                id="report-dept-filter"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Tab Specific Filter 1: Status / Actor Role for Audit */}
          {activeTab !== 'Payroll' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {activeTab === 'Audit' ? 'Operator Role' : 'Status'}
              </label>
              <select
                id="report-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">{activeTab === 'Audit' ? 'All Roles' : 'All Statuses'}</option>
                {activeTab === 'Employee' && (
                  <>
                    <option value="Active">Active Staff</option>
                    <option value="Inactive">Inactive Staff</option>
                  </>
                )}
                {activeTab === 'Attendance' && (
                  <>
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </>
                )}
                {activeTab === 'Leave' && (
                  <>
                    <option value="Pending">Pending Approval</option>
                    <option value="Approved">Approved Leaves</option>
                    <option value="Rejected">Rejected</option>
                  </>
                )}
                {activeTab === 'Audit' && (
                  <>
                    <option value="Super Admin">Super Admin</option>
                    <option value="HR">HR Officer</option>
                    <option value="Manager">Manager</option>
                    <option value="Employee">Employee</option>
                    <option value="System">System Automated</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Tab Specific Filter 2: Dates */}
          {activeTab === 'Attendance' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specific Date</label>
              <input
                id="report-date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none cursor-pointer"
              />
            </div>
          )}

          {/* Tab Specific Filter 3: Payroll month */}
          {activeTab === 'Payroll' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accounting Month</label>
              <select
                id="report-month-filter"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none cursor-pointer"
              >
                <option value="June 2026">June 2026</option>
                <option value="May 2026">May 2026</option>
                <option value="April 2026">April 2026</option>
              </select>
            </div>
          )}

          {/* Export Actions Box */}
          <div className="flex items-end justify-end space-x-2 md:col-span-1 ml-auto">
            <button
              id="btn-export-excel"
              onClick={handleExportExcel}
              className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Download Excel Sheet"
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              id="btn-export-pdf"
              onClick={handleExportPDF}
              className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Print PDF Document"
            >
              <FileText className="w-4.5 h-4.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Title block */}
      <div className="hidden print:block space-y-2 border-b-2 border-slate-900 pb-6 mb-8 text-xs text-slate-800">
        <h2 className="text-xl font-extrabold text-slate-900">HRMS ERP SYSTEMS INC.</h2>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          OFFICIAL {activeTab.toUpperCase()} REPORT REGISTER
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          Generated automatically: {new Date().toLocaleDateString()} • Classified Internal Document • Filters: Dept: {deptFilter}, Period: {activeTab === 'Payroll' ? monthFilter : activeTab === 'Attendance' ? dateFilter : 'All'}
        </p>
      </div>

      {/* Interactive Report View Tables */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          {/* TAB 1: EMPLOYEE */}
          {activeTab === 'Employee' && (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4.5 px-6">ID / Name</th>
                  <th className="py-4.5 px-4">Contact Details</th>
                  <th className="py-4.5 px-4">Department</th>
                  <th className="py-4.5 px-4">Designation</th>
                  <th className="py-4.5 px-4">Join Date</th>
                  <th className="py-4.5 px-4 text-right">Base Salary</th>
                  <th className="py-4.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
                {employeeReportData.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-6 font-bold text-slate-800">{emp.firstName} {emp.lastName} ({emp.id})</td>
                    <td className="py-4.5 px-4">{emp.email} • {emp.mobile}</td>
                    <td className="py-4.5 px-4 font-semibold text-slate-700">{getDeptName(emp.departmentId)}</td>
                    <td className="py-4.5 px-4 font-medium text-slate-500">{getDesgName(emp.designationId)}</td>
                    <td className="py-4.5 px-4 font-mono font-medium">{emp.joiningDate}</td>
                    <td className="py-4.5 px-4 text-right font-mono font-bold">₹{emp.salary.toLocaleString()}</td>
                    <td className="py-4.5 px-4 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-bold border rounded-full bg-slate-50 text-slate-600 border-slate-200">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'Attendance' && (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4.5 px-6">Log ID</th>
                  <th className="py-4.5 px-4">Employee</th>
                  <th className="py-4.5 px-4">Log Date</th>
                  <th className="py-4.5 px-4">Check In</th>
                  <th className="py-4.5 px-4">Check Out</th>
                  <th className="py-4.5 px-4 text-center">Working Hours</th>
                  <th className="py-4.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
                {attendanceReportData.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-6 font-mono font-bold text-slate-800">{log.id}</td>
                    <td className="py-4.5 px-4 font-bold text-slate-700">{getEmpName(log.employeeId)} ({log.employeeId})</td>
                    <td className="py-4.5 px-4 font-semibold text-slate-600">{log.date}</td>
                    <td className="py-4.5 px-4 font-mono">{log.checkIn}</td>
                    <td className="py-4.5 px-4 font-mono">{log.checkOut || '--:--'}</td>
                    <td className="py-4.5 px-4 text-center font-mono font-bold">{log.workingHours} hrs</td>
                    <td className="py-4.5 px-4 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-bold border border-slate-200 rounded bg-slate-50">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 3: LEAVE */}
          {activeTab === 'Leave' && (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4.5 px-6">Leave ID</th>
                  <th className="py-4.5 px-4">Employee</th>
                  <th className="py-4.5 px-4">Leave Type</th>
                  <th className="py-4.5 px-4">Date Range</th>
                  <th className="py-4.5 px-4">Reason Statement</th>
                  <th className="py-4.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
                {leaveReportData.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-6 font-mono font-bold text-slate-800">{l.id}</td>
                    <td className="py-4.5 px-4 font-bold text-slate-700">{getEmpName(l.employeeId)}</td>
                    <td className="py-4.5 px-4 font-semibold text-slate-600">{l.leaveType}</td>
                    <td className="py-4.5 px-4 font-mono">{l.startDate} to {l.endDate}</td>
                    <td className="py-4.5 px-4 italic max-w-sm truncate text-slate-500">"{l.reason}"</td>
                    <td className="py-4.5 px-4 text-center font-bold">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 4: PAYROLL */}
          {activeTab === 'Payroll' && (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4.5 px-6">Ledger ID</th>
                  <th className="py-4.5 px-4">Employee</th>
                  <th className="py-4.5 px-4 text-right">Basic Pay</th>
                  <th className="py-4.5 px-4 text-right">HRA</th>
                  <th className="py-4.5 px-4 text-right">Allowances</th>
                  <th className="py-4.5 px-4 text-right text-rose-500">Deductions</th>
                  <th className="py-4.5 px-4 text-right font-extrabold text-slate-900">Net Salary</th>
                  <th className="py-4.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
                {payrollReportData.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-6 font-mono font-bold text-slate-800">{p.id}</td>
                    <td className="py-4.5 px-4 font-bold text-slate-700">{getEmpName(p.employeeId)}</td>
                    <td className="py-4.5 px-4 text-right font-mono">₹{p.basicSalary.toLocaleString()}</td>
                    <td className="py-4.5 px-4 text-right font-mono">₹{p.hra.toLocaleString()}</td>
                    <td className="py-4.5 px-4 text-right font-mono">₹{p.allowances.toLocaleString()}</td>
                    <td className="py-4.5 px-4 text-right font-mono text-rose-500">-₹{p.deductions.toLocaleString()}</td>
                    <td className="py-4.5 px-4 text-right font-mono font-extrabold text-slate-900">₹{p.netSalary.toLocaleString()}</td>
                    <td className="py-4.5 px-4 text-center">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 5: AUDIT LOG */}
          {activeTab === 'Audit' && (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4.5 px-6">Timestamp / ID</th>
                  <th className="py-4.5 px-4">Operator</th>
                  <th className="py-4.5 px-4">Operator Role</th>
                  <th className="py-4.5 px-4">Action Type</th>
                  <th className="py-4.5 px-4">Affected Resource</th>
                  <th className="py-4.5 px-4">Affected ID</th>
                  <th className="py-4.5 px-6">Modification Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 text-xs font-mono">
                {auditReportData.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 px-6 text-slate-500 whitespace-nowrap">
                      <span className="font-bold text-slate-700 block">{log.timestamp}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{log.id}</span>
                    </td>
                    <td className="py-4.5 px-4 font-bold text-slate-800 font-sans">{log.actorUsername}</td>
                    <td className="py-4.5 px-4">
                      <span className="px-2 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600 border border-slate-200 font-sans font-medium">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-4.5 px-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        log.actionType === 'DELETE' ? 'bg-red-50 text-red-700 border border-red-100' :
                        log.actionType === 'INSERT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        log.actionType === 'ROLE_SWITCH' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        log.actionType === 'LEAVE_APPROVAL' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        log.actionType === 'PASSWORD_RESET' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-4.5 px-4 font-semibold text-slate-600">{log.affectedTable}</td>
                    <td className="py-4.5 px-4 font-bold text-slate-700">{log.affectedRecordId}</td>
                    <td className="py-4.5 px-6 font-sans text-slate-600 leading-relaxed max-w-md">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Empty state handles */}
          {((activeTab === 'Employee' && employeeReportData.length === 0) ||
            (activeTab === 'Attendance' && attendanceReportData.length === 0) ||
            (activeTab === 'Leave' && leaveReportData.length === 0) ||
            (activeTab === 'Payroll' && payrollReportData.length === 0) ||
            (activeTab === 'Audit' && auditReportData.length === 0)) && (
            <div className="py-12 text-center text-slate-400">
              <div className="flex flex-col items-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                <p className="font-semibold text-sm">No report rows available for current filters</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
