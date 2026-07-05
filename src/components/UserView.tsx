import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ShieldCheck, X, AlertCircle, ShieldAlert, UserCheck } from 'lucide-react';
import { SystemUser, UserRole, Employee, Department, Designation } from '../types';

interface UserViewProps {
  users: SystemUser[];
  employees: Employee[];
  departments?: Department[];
  designations?: Designation[];
  onAddUser: (u: SystemUser) => void;
  onUpdateUser: (u: SystemUser) => void;
  onDeleteUser: (id: string) => void;
  onAddEmployee?: (emp: Employee) => void;
  userRole: string;
}

export default function UserView({
  users,
  employees,
  departments = [],
  designations = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddEmployee,
  userRole
}: UserViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'Employee' as UserRole,
    employeeId: '',
    status: 'Active' as 'Active' | 'Suspended'
  });

  const isSuperAdmin = userRole === 'Super Admin';
  const isHR = userRole === 'HR';
  const canManageUsers = isSuperAdmin || isHR;

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEmpName = (empId?: string) => {
    if (!empId) return 'No Linked Employee';
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.firstName} ${emp.lastName} (${empId})` : 'Linked Employee Missing';
  };

  // Pending employee registrations
  const pendingRegistrations = users.filter(u => u.status === 'Pending Approval');

  const handleApproveRegistration = (pendingUser: SystemUser) => {
    // Check if there is an existing employee profile linked to this user
    const existingEmp = pendingUser.employeeId ? employees.find(e => e.id === pendingUser.employeeId) : null;
    
    if (existingEmp) {
      // The employee profile already exists (e.g. created by backend self-registration)
      // We only need to approve the system user account
      onUpdateUser({
        ...pendingUser,
        status: 'Active'
      });
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
      onUpdateUser({
        ...pendingUser,
        employeeId: nextEmpId,
        status: 'Active'
      });
    }
  };

  const handleRejectRegistration = (pendingUser: SystemUser) => {
    if (confirm(`Are you sure you want to decline and remove the registration request for ${pendingUser.firstName || ''} ${pendingUser.lastName || ''} (${pendingUser.username})?`)) {
      onDeleteUser(pendingUser.id);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormError('');
    setFormData({
      username: '',
      email: '',
      role: 'Employee',
      employeeId: employees[0]?.id || '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const openEditModal = (u: SystemUser) => {
    setEditingUser(u);
    setFormError('');
    setFormData({
      username: u.username,
      email: u.email,
      role: u.role,
      employeeId: u.employeeId || '',
      status: u.status
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.username || !formData.email) {
      setFormError('Mandatory fields missing.');
      return;
    }

    if (isHR && formData.role !== 'Manager' && formData.role !== 'Employee') {
      setFormError('HR users are only permitted to assign Manager and Employee roles.');
      return;
    }

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        employeeId: formData.employeeId || undefined,
        status: formData.status
      });
    } else {
      let maxUserNum = 0;
      users.forEach(u => {
        if (u.id) {
          const match = u.id.match(/^USR-(\d+)$/i);
          if (match) {
            const parsed = parseInt(match[1], 10);
            if (!isNaN(parsed) && parsed > maxUserNum) {
              maxUserNum = parsed;
            }
          }
        }
      });
      const nextUserIdNum = maxUserNum + 1;
      const nextId = `USR-${String(nextUserIdNum).padStart(2, '0')}`;
      onAddUser({
        id: nextId,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        employeeId: formData.employeeId || undefined,
        status: formData.status
      });
    }

    setShowModal(false);
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
    <div className="space-y-6 animate-fadeIn">
      {/* Admin Safety Alert Banner */}
      {!canManageUsers && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-800 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Administrative Guard active</h4>
            <p className="text-amber-700 leading-relaxed font-medium">
              Only users assigned the <b>Super Admin</b> or <b>HR</b> role can view, create, or alter secure system accounts. Use the Role Switcher dropdown in the top navbar to swap context for auditing.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Access Control</p>
          <h3 className="text-lg font-bold text-slate-800">ERP User Administration</h3>
        </div>
        {canManageUsers && (
          <button
            id="btn-add-user"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create User Account</span>
          </button>
        )}
      </div>

      {/* PENDING EMPLOYEE REGISTRATION REQUESTS */}
      {canManageUsers && pendingRegistrations.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-100 text-amber-850 rounded-xl">
              <UserCheck className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">Pending Employee Registrations ({pendingRegistrations.length})</h3>
              <p className="text-[11px] text-amber-700/90">Verify new employee registrations, assigned Branch/Location, and approve to grant access.</p>
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
                <div key={req.id} className="bg-white border border-amber-200/60 rounded-xl p-4.5 space-y-3.5 shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{firstName} {lastName}</h4>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Username: {req.username} • Email: {req.email}</span>
                    </div>
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Pending Approval
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-600 bg-slate-50/75 p-3 rounded-xl border border-slate-100">
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
                  
                  <div className="flex space-x-2 justify-end">
                    <button
                      type="button"
                      onClick={() => handleRejectRegistration(req)}
                      className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Decline Request
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveRegistration(req)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve & Grant Access</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter search */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="user-search"
            type="text"
            disabled={!canManageUsers}
            placeholder={canManageUsers ? "Search accounts by username, email or role..." : "Protected Directory - Access Restricted"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 disabled:bg-slate-100 border border-slate-200 focus:border-blue-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table listing */}
      {canManageUsers && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4.5 px-6">ID / Username</th>
                  <th className="py-4.5 px-4">Email Credentials</th>
                  <th className="py-4.5 px-4">Assigned Role</th>
                  <th className="py-4.5 px-4">Linked Staff Record</th>
                  <th className="py-4.5 px-4 text-center">Status</th>
                  <th className="py-4.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const roleColor = {
                      'Super Admin': 'bg-rose-50 text-rose-700 border-rose-200',
                      HR: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                      Manager: 'bg-blue-50 text-blue-700 border-blue-200',
                      Employee: 'bg-slate-50 text-slate-600 border-slate-200'
                    }[u.role];

                    const isEditableByCurrentUser = isSuperAdmin || (isHR && u.role !== 'Super Admin' && u.role !== 'HR');

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 flex items-center space-x-3.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{u.username}</h4>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{u.id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-700 select-all">{u.email}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${roleColor}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-500">
                          {getEmpName(u.employeeId)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            u.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : u.status === 'Pending Approval'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {isEditableByCurrentUser ? (
                              <>
                                <button
                                  id={`btn-edit-user-${u.id}`}
                                  onClick={() => openEditModal(u)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Edit Permissions"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`btn-delete-user-${u.id}`}
                                  onClick={() => {
                                    if (u.username === 'admin') {
                                      alert('Protected Root: Cannot delete root Admin account.');
                                      return;
                                    }
                                    if (confirm(`Revoke security credentials for ${u.username}?`)) {
                                      onDeleteUser(u.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Revoke Credentials"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold italic">Protected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-sm">No accounts found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showModal && canManageUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50 animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingUser ? `Adjust Credentials: ${editingUser.username}` : 'Register Secure Account'}
              </h3>
              <button 
                id="close-user-modal"
                onClick={() => setShowModal(false)} 
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

              {/* Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username *</label>
                <input
                  id="user-field-username"
                  type="text"
                  required
                  disabled={editingUser?.username === 'admin'}
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="e.g., JaneS_Corp"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all font-mono"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
                <input
                  id="user-field-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="jane.smith@company.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Access Level (Role)</label>
                <select
                  id="user-field-role"
                  disabled={editingUser?.username === 'admin'}
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  {isSuperAdmin && <option value="Super Admin">Super Admin</option>}
                  {isSuperAdmin && <option value="HR">HR</option>}
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              {/* Link Employee */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link Employee Record (Optional)</label>
                <select
                  id="user-field-link"
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">Do Not Link (External Profile)</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.id})</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credential Status</label>
                <div className="flex items-center space-x-6 pt-1">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Active"
                      checked={formData.status === 'Active'}
                      onChange={() => setFormData(prev => ({ ...prev, status: 'Active' }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Active Account</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      disabled={editingUser?.username === 'admin'}
                      value="Suspended"
                      checked={formData.status === 'Suspended'}
                      onChange={() => setFormData(prev => ({ ...prev, status: 'Suspended' }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Suspended</span>
                  </label>
                </div>
              </div>

              {/* Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-user-cancel"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-user-save"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
                >
                  Apply Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
