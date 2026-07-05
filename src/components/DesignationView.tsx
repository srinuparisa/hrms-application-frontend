import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, Tag, Building } from 'lucide-react';
import { Designation, Department, Employee } from '../types';

interface DesignationViewProps {
  designations: Designation[];
  departments: Department[];
  employees: Employee[];
  onAddDesignation: (desg: Designation) => void;
  onUpdateDesignation: (desg: Designation) => void;
  onDeleteDesignation: (id: string) => void;
  userRole: string;
}

export default function DesignationView({
  designations,
  departments,
  employees,
  onAddDesignation,
  onUpdateDesignation,
  onDeleteDesignation,
  userRole
}: DesignationViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingDesg, setEditingDesg] = useState<Designation | null>(null);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    departmentId: ''
  });

  const canModify = userRole === 'Super Admin' || userRole === 'HR';

  const filteredDesgs = designations.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter === 'All' || d.departmentId === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const getDeptName = (deptId: string) => {
    return departments.find(dept => dept.id === deptId)?.name || 'N/A';
  };

  const getEmployeeCount = (desgId: string) => {
    return employees.filter(emp => emp.designationId === desgId).length;
  };

  const openAddModal = () => {
    setEditingDesg(null);
    setFormError('');
    setFormData({
      name: '',
      departmentId: departments[0]?.id || ''
    });
    setShowModal(true);
  };

  const openEditModal = (desg: Designation) => {
    setEditingDesg(desg);
    setFormError('');
    setFormData({
      name: desg.name,
      departmentId: desg.departmentId
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.departmentId) {
      setFormError('Please fill out all mandatory fields.');
      return;
    }

    if (editingDesg) {
      onUpdateDesignation({
        ...editingDesg,
        name: formData.name,
        departmentId: formData.departmentId
      });
    } else {
      const nextIdNum = designations.reduce((max, d) => {
        const num = parseInt(d.id.replace('DESG-', ''));
        return num > max ? num : max;
      }, 0) + 1;

      const formattedNum = nextIdNum < 10 ? `0${nextIdNum}` : `${nextIdNum}`;

      onAddDesignation({
        id: `DESG-${formattedNum}`,
        name: formData.name,
        departmentId: formData.departmentId
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
          <h3 className="text-lg font-bold text-slate-800">Designations Library</h3>
        </div>
        {canModify && (
          <button
            id="btn-add-desg"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Designation</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="desg-search"
            type="text"
            placeholder="Search designations by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Dept filter */}
        <div className="w-full sm:w-60">
          <select
            id="desg-dept-filter"
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
      </div>

      {/* Designation list Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4.5 px-6">ID / Designation Title</th>
                <th className="py-4.5 px-4">Associated Department</th>
                <th className="py-4.5 px-4 text-center">Active Staff Count</th>
                {canModify && <th className="py-4.5 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              {filteredDesgs.length > 0 ? (
                filteredDesgs.map((desg) => {
                  const empCount = getEmployeeCount(desg.id);
                  return (
                    <tr key={desg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 px-6 flex items-center space-x-3.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{desg.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{desg.id}</span>
                        </div>
                      </td>
                      <td className="py-4.5 px-4">
                        <span className="flex items-center text-slate-700 font-semibold">
                          <Building className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                          {getDeptName(desg.departmentId)}
                        </span>
                      </td>
                      <td className="py-4.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/60 rounded-lg">
                          {empCount} Employee{empCount === 1 ? '' : 's'}
                        </span>
                      </td>
                      {canModify && (
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              id={`btn-edit-desg-${desg.id}`}
                              onClick={() => openEditModal(desg)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit Designation"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-desg-${desg.id}`}
                              onClick={() => {
                                if (empCount > 0) {
                                  alert(`Cannot delete this Designation. There are ${empCount} employees assigned to it. Please reassign them first.`);
                                  return;
                                }
                                if (confirm(`Are you sure you want to remove designation: ${desg.name}?`)) {
                                  onDeleteDesignation(desg.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Remove Designation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canModify ? 4 : 3} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">No designations found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50 animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingDesg ? `Edit Designation: ${editingDesg.name}` : 'Create New Designation'}
              </h3>
              <button 
                id="close-desg-modal"
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation Title *</label>
                <input
                  id="desg-field-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Lead Developer"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Associated Department *</label>
                <select
                  id="desg-field-department"
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-desg-cancel"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-desg-save"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
                >
                  {editingDesg ? 'Update Designation' : 'Create Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
