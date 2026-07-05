import React, { useState } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Eye, X, Check, AlertCircle, Filter, 
  MapPin, Calendar, Mail, Phone, Briefcase, Award, ShieldAlert, User, FileText
} from 'lucide-react';
import { Employee, Department, Designation, SystemUser } from '../types';

interface EmployeeViewProps {
  employees: Employee[];
  departments: Department[];
  designations: Designation[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  userRole: string;
  currentUser?: SystemUser;
}

export default function EmployeeView({
  employees,
  departments,
  designations,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  userRole,
  currentUser
}: EmployeeViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  
  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    email: '',
    mobile: '',
    address: '',
    joiningDate: '',
    departmentId: '',
    designationId: '',
    salary: 5000,
    status: 'Active' as 'Active' | 'Inactive',
    profilePhoto: '',
    branch: 'Main Head Office',
    managerId: ''
  });

  const [formError, setFormError] = useState('');

  // Find linked profile of logged-in user
  const loggedInEmployee = employees.find(e => e.id === currentUser?.employeeId || e.firstName.toLowerCase() === currentUser?.username?.toLowerCase());
  const hrBranch = loggedInEmployee?.branch || currentUser?.branch || "Main Head Office";
  const userDeptId = loggedInEmployee?.departmentId || currentUser?.departmentId || "";
  const userEmpId = loggedInEmployee?.id || currentUser?.employeeId || "";

  // Role permissions: Only HR and Super Admin can modify employee profiles
  const canModify = userRole === 'Super Admin' || userRole === 'HR';

  const canModifyEmployee = (emp: Employee) => {
    if (userRole === 'Super Admin') return true;
    if (userRole === 'HR') {
      return (emp.branch || 'Main Head Office') === hrBranch;
    }
    return false;
  };

  // Filter design details dynamically
  const filteredDesignations = formData.departmentId 
    ? designations.filter(d => d.departmentId === formData.departmentId)
    : designations;

  // Filter Employees
  const filteredEmployees = employees.filter(emp => {
    // Apply role-based data visibility:
    // - Employee: can see their own profile only
    // - Manager: can see their department's employee profiles
    // - HR: can see their branch's employee profiles
    // - Admin: can see all employee profiles
    if (userRole === 'Employee') {
      if (emp.id !== userEmpId) return false;
    } else if (userRole === 'Manager') {
      if (emp.departmentId !== userDeptId) return false;
    } else if (userRole === 'HR') {
      if ((emp.branch || 'Main Head Office') !== hrBranch) return false;
    } // Admin sees all

    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter === 'All' || emp.departmentId === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'All' || emp.status === selectedStatusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormError('');
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'Male',
      dob: '1995-01-01',
      email: '',
      mobile: '',
      address: '',
      joiningDate: new Date().toISOString().split('T')[0],
      departmentId: departments[0]?.id || '',
      designationId: designations.find(d => d.departmentId === departments[0]?.id)?.id || designations[0]?.id || '',
      salary: 5000,
      status: 'Active',
      profilePhoto: '',
      branch: userRole === 'HR' ? hrBranch : 'Main Head Office',
      managerId: ''
    });
    setShowFormModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormError('');
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      gender: emp.gender,
      dob: emp.dob,
      email: emp.email,
      mobile: emp.mobile,
      address: emp.address,
      joiningDate: emp.joiningDate,
      departmentId: emp.departmentId,
      designationId: emp.designationId,
      salary: emp.salary,
      status: emp.status,
      profilePhoto: emp.profilePhoto || '',
      branch: emp.branch || 'Main Head Office',
      managerId: emp.managerId || ''
    });
    setShowFormModal(true);
  };

  const openDetailModal = (emp: Employee) => {
    setViewingEmployee(emp);
    setShowDetailModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'departmentId') {
      // Auto assign first valid designation when department changes
      const associatedDesg = designations.find(d => d.departmentId === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        designationId: associatedDesg ? associatedDesg.id : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'salary' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.mobile || !formData.joiningDate) {
      setFormError('Please fill out all mandatory fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please provide a valid email address.');
      return;
    }

    if (editingEmployee) {
      onUpdateEmployee({
        ...editingEmployee,
        ...formData
      });
    } else {
      // Generate automatic code e.g. EMP-108
      const maxNum = employees.reduce((max, emp) => {
        if (emp.id && emp.id.startsWith('EMP-')) {
          const parsed = parseInt(emp.id.substring(4), 10);
          return (!isNaN(parsed) && parsed > max) ? parsed : max;
        }
        return max;
      }, 100);
      const nextIdNum = maxNum + 1;
      const paddedId = `EMP-${String(nextIdNum).padStart(3, '0')}`;
      
      onAddEmployee({
        id: paddedId,
        ...formData
      });
    }

    setShowFormModal(false);
  };

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';
  const getDesgName = (id: string) => designations.find(d => d.id === id)?.name || 'N/A';

  const handleDownloadAllEmployees = () => {
    // Super Admin gets all, HR gets their branch only
    const targetEmployees = userRole === 'Super Admin' 
      ? employees 
      : employees.filter(e => (e.branch || 'Main Head Office') === hrBranch);

    if (targetEmployees.length === 0) {
      alert("No employee records to download.");
      return;
    }

    const headers = ['Employee ID', 'First Name', 'Last Name', 'Gender', 'DOB', 'Email', 'Mobile', 'Department', 'Designation', 'Branch/Location', 'Monthly Salary', 'Joining Date', 'Status', 'Reporting Manager ID'];
    const rows = targetEmployees.map(emp => [
      emp.id,
      emp.firstName,
      emp.lastName,
      emp.gender,
      emp.dob,
      emp.email,
      emp.mobile,
      getDeptName(emp.departmentId),
      getDesgName(emp.designationId),
      emp.branch || 'Main Head Office',
      emp.salary.toString(),
      emp.joiningDate,
      emp.status,
      emp.managerId || 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = userRole === 'Super Admin' 
      ? 'All_Branches_Employees_Details.csv' 
      : `Employees_Details_${hrBranch.replace(/\s+/g, '_')}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team Directory</p>
          <h3 className="text-lg font-bold text-slate-800">Staff Records & Profiles</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(userRole === 'Super Admin' || userRole === 'HR') && (
            <button
              id="btn-download-employees"
              onClick={handleDownloadAllEmployees}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 flex items-center space-x-2 transition-all cursor-pointer animate-fadeIn"
              title={userRole === 'Super Admin' ? 'Download All Branches Employees Details' : `Download ${hrBranch} Employees Details`}
            >
              <FileText className="w-4 h-4" />
              <span>Download Details</span>
            </button>
          )}
          {canModify ? (
            <button
              id="btn-add-employee"
              onClick={openAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          ) : (
            <div className="flex items-center text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg select-none">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
              <span>View Only Access (Contact HR)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="employee-search"
            type="text"
            placeholder="Search employees by ID, name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-52">
          <select
            id="filter-dept"
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-all cursor-pointer"
          >
            <option value="All">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <select
            id="filter-status"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4.5 px-6">ID / Employee</th>
                <th className="py-4.5 px-4">Contact Info</th>
                <th className="py-4.5 px-4">Department & Designation</th>
                <th className="py-4.5 px-4">Joining Date</th>
                <th className="py-4.5 px-4 text-right">Monthly Salary</th>
                <th className="py-4.5 px-4 text-center">Status</th>
                <th className="py-4.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm uppercase flex-shrink-0">
                        {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 leading-tight">
                          {emp.firstName} {emp.lastName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{emp.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 space-y-1">
                      <div className="text-slate-700 leading-none">{emp.email}</div>
                      <div className="text-[10px] text-slate-400 font-medium leading-none">{emp.mobile}</div>
                    </td>
                    <td className="py-4 px-4 space-y-0.5">
                      <div className="font-semibold text-slate-700 leading-none">{getDeptName(emp.departmentId)}</div>
                      <div className="text-[10px] text-slate-400 font-bold leading-none">{getDesgName(emp.designationId)}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-semibold">{emp.joiningDate}</td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-slate-700">
                      ₹{emp.salary.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                        emp.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          id={`btn-view-${emp.id}`}
                          onClick={() => openDetailModal(emp)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canModify && (
                          <>
                            {canModifyEmployee(emp) ? (
                              <button
                                id={`btn-edit-${emp.id}`}
                                onClick={() => openEditModal(emp)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Employee"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="p-1.5 text-slate-300 cursor-not-allowed opacity-50"
                                title="Employee belongs to another branch (Editing Restricted)"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {(userRole === 'Super Admin' || (userRole === 'HR' && canModifyEmployee(emp))) && (
                              <button
                                id={`btn-delete-${emp.id}`}
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove ${emp.firstName} ${emp.lastName} from records?`)) {
                                    onDeleteEmployee(emp.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Remove Employee"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">No employee records found</p>
                      <p className="text-xs text-slate-300">Try loosening your search terms or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (ADD / EDIT) */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowFormModal(false)} />
          
          {/* Modal box */}
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative z-50 animate-scaleUp flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingEmployee ? `Update Profile: ${editingEmployee.firstName} (${editingEmployee.id})` : 'Register New Employee'}
              </h3>
              <button 
                id="close-form-modal"
                onClick={() => setShowFormModal(false)} 
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-250 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form scrollable container */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* Row 1: Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name *</label>
                  <input
                    id="emp-field-firstName"
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="e.g., Jane"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Name *</label>
                  <input
                    id="emp-field-lastName"
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="e.g., Smith"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Gender & DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                  <select
                    id="emp-field-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                  <input
                    id="emp-field-dob"
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
                  <input
                    id="emp-field-email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="jane.smith@company.com"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number *</label>
                  <input
                    id="emp-field-mobile"
                    type="tel"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Row 4: Department & Designation selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                  <select
                    id="emp-field-department"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</label>
                  <select
                    id="emp-field-designation"
                    name="designationId"
                    value={formData.designationId}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    {filteredDesignations.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Salary & Join Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Base Salary (₹) *</label>
                  <input
                    id="emp-field-salary"
                    type="number"
                    name="salary"
                    required
                    value={formData.salary}
                    onChange={handleInputChange}
                    min={0}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joining Date *</label>
                  <input
                    id="emp-field-joiningDate"
                    type="date"
                    name="joiningDate"
                    required
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none"
                  />
                </div>
              </div>

              {/* Row 6: Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</label>
                <textarea
                  id="emp-field-address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g., 101 Oak Dr, Palo Alto, CA"
                  rows={2}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all resize-none"
                />
              </div>

              {/* Row: Branch & Manager Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Branch / Location</label>
                  {userRole === 'Super Admin' ? (
                    <select
                      id="emp-field-branch"
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="Main Head Office">Main Head Office</option>
                      <option value="Mumbai Branch">Mumbai Branch</option>
                      <option value="Bangalore Branch">Bangalore Branch</option>
                      <option value="Delhi Branch">Delhi Branch</option>
                    </select>
                  ) : (
                    <input
                      id="emp-field-branch"
                      type="text"
                      name="branch"
                      readOnly
                      value={formData.branch}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-500 outline-none cursor-not-allowed"
                    />
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assign Reporting Manager</label>
                  <select
                    id="emp-field-managerId"
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="">-- No Manager / Head --</option>
                    {employees
                      .filter(e => e.id !== editingEmployee?.id) // Can't report to themselves
                      .map(e => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.id})</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Row 7: Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment Status</label>
                <div className="flex items-center space-x-6 pt-1">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={formData.status === 'Active'}
                      onChange={handleInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Active Staff</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Inactive"
                      checked={formData.status === 'Inactive'}
                      onChange={handleInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Inactive / Suspended</span>
                  </label>
                </div>
              </div>

              {/* Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-form-cancel"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-form-save"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
                >
                  {editingEmployee ? 'Update Profile' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (VIEW PROFILE) */}
      {showDetailModal && viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowDetailModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative z-50 animate-scaleUp flex flex-col">
            {/* Elegant Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white relative">
              <button 
                id="close-detail-modal"
                onClick={() => setShowDetailModal(false)} 
                className="text-slate-400 hover:text-white p-1.5 rounded-lg absolute right-4 top-4 hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 border-2 border-blue-400 flex items-center justify-center font-bold text-xl uppercase">
                  {viewingEmployee.firstName.charAt(0)}{viewingEmployee.lastName.charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase block leading-none">
                    {viewingEmployee.id}
                  </span>
                  <h3 className="text-lg font-extrabold tracking-tight mt-1">
                    {viewingEmployee.firstName} {viewingEmployee.lastName}
                  </h3>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20 rounded">
                    {viewingEmployee.status} Staff
                  </span>
                </div>
              </div>
            </div>

            {/* Content list */}
            <div className="p-6 space-y-6 text-slate-700 text-xs">
              
              {/* Grid: Details */}
              <div className="grid grid-cols-2 gap-4.5">
                <div className="flex items-start space-x-2.5">
                  <Briefcase className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</span>
                    <p className="font-semibold text-slate-800">{getDeptName(viewingEmployee.departmentId)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Award className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</span>
                    <p className="font-semibold text-slate-800">{getDesgName(viewingEmployee.designationId)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Mail className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                    <p className="font-semibold text-slate-800 truncate select-all">{viewingEmployee.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Phone className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile</span>
                    <p className="font-semibold text-slate-800 select-all">{viewingEmployee.mobile}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Calendar className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</span>
                    <p className="font-semibold text-slate-800">{viewingEmployee.joiningDate}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Calendar className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DOB & Gender</span>
                    <p className="font-semibold text-slate-800">{viewingEmployee.dob} ({viewingEmployee.gender})</p>
                  </div>
                </div>
              </div>

              {/* Branch & Reporting Manager */}
              <div className="grid grid-cols-2 gap-4.5 border-t border-slate-100 pt-4">
                <div className="flex items-start space-x-2.5">
                  <MapPin className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Branch / Location</span>
                    <p className="font-semibold text-slate-800">{viewingEmployee.branch || 'Main Head Office'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <User className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reporting Manager</span>
                    <p className="font-semibold text-slate-800">
                      {employees.find(e => e.id === viewingEmployee.managerId) 
                        ? `${employees.find(e => e.id === viewingEmployee.managerId)?.firstName} ${employees.find(e => e.id === viewingEmployee.managerId)?.lastName}` 
                        : 'N/A (Direct Head)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-2.5 border-t border-slate-100 pt-4">
                <MapPin className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Residence</span>
                  <p className="font-semibold text-slate-800 mt-0.5 leading-normal">{viewingEmployee.address || 'No residential address on file.'}</p>
                </div>
              </div>

              {/* Compensation */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Salary</span>
                  <span className="text-xl font-mono font-extrabold text-slate-800 mt-1 block">
                    ₹{viewingEmployee.salary.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 font-bold rounded">
                  Paid Monthly
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
