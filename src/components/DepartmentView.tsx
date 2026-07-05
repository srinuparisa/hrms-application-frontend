import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, Building2, Users } from 'lucide-react';
import { Department, Employee } from '../types';

interface DepartmentViewProps {
  departments: Department[];
  employees: Employee[];
  onAddDepartment: (dept: Department) => void;
  onUpdateDepartment: (dept: Department) => void;
  onDeleteDepartment: (id: string) => void;
  userRole: string;
}

export default function DepartmentView({
  departments,
  employees,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  userRole
}: DepartmentViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const canModify = userRole === 'Super Admin' || userRole === 'HR';

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEmployeeCount = (deptId: string) => {
    return employees.filter(emp => emp.departmentId === deptId).length;
  };

  const openAddModal = () => {
    setEditingDept(null);
    setFormError('');
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormError('');
    setFormData({ name: dept.name, description: dept.description });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.description) {
      setFormError('Please fill out all mandatory fields.');
      return;
    }

    if (editingDept) {
      onUpdateDepartment({
        ...editingDept,
        name: formData.name,
        description: formData.description
      });
    } else {
      const nextIdNum = departments.reduce((max, d) => {
        const num = parseInt(d.id.replace('DEPT-', ''));
        return num > max ? num : max;
      }, 0) + 1;

      onAddDepartment({
        id: `DEPT-0${nextIdNum}`,
        name: formData.name,
        description: formData.description
      });
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organizational Schema</p>
          <h3 className="text-lg font-bold text-slate-800">Departments Management</h3>
        </div>
        {canModify && (
          <button
            id="btn-add-dept"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="dept-search"
            type="text"
            placeholder="Search departments by name, ID or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepts.length > 0 ? (
          filteredDepts.map((dept) => {
            const empCount = getEmployeeCount(dept.id);
            return (
              <div key={dept.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{dept.id}</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{dept.name}</h4>
                    <p className="text-xs text-slate-500 leading-normal mt-2 line-clamp-3 h-15">
                      {dept.description}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 mt-6 pt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{empCount} Assigned Staff</span>
                  </div>

                  {canModify && (
                    <div className="flex items-center space-x-1">
                      <button
                        id={`btn-edit-dept-${dept.id}`}
                        onClick={() => openEditModal(dept)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Department"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-dept-${dept.id}`}
                        onClick={() => {
                          if (empCount > 0) {
                            alert(`Cannot delete this department. There are ${empCount} employees assigned to it. Please reassign them first.`);
                            return;
                          }
                          if (confirm(`Are you sure you want to remove department: ${dept.name}?`)) {
                            onDeleteDepartment(dept.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Remove Department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="flex flex-col items-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-sm">No departments matching your filters</p>
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL (ADD / EDIT) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50 animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Department'}
              </h3>
              <button 
                id="close-dept-modal"
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Name *</label>
                <input
                  id="dept-field-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Engineering"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description *</label>
                <textarea
                  id="dept-field-description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Summarize the core operational scope..."
                  rows={4}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-dept-cancel"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-dept-save"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
                >
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
