import React, { useState } from 'react';
import { Plus, Search, Trash2, Calendar, X, AlertCircle, Sparkles, AlertTriangle } from 'lucide-react';
import { Holiday } from '../types';

interface HolidayViewProps {
  holidays: Holiday[];
  onAddHoliday: (h: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
  userRole: string;
}

export default function HolidayView({
  holidays,
  onAddHoliday,
  onDeleteHoliday,
  userRole
}: HolidayViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    date: '2026-07-04',
    type: 'National' as 'National' | 'Regional' | 'Optional'
  });

  const canModify = userRole === 'Super Admin' || userRole === 'HR';

  const filteredHolidays = holidays.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.date.includes(searchTerm)
  );

  // Sort holidays chronologically
  const sortedHolidays = [...filteredHolidays].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.date) {
      setFormError('Mandatory fields missing.');
      return;
    }

    const nextId = `HOL-0${holidays.length + 1}`;
    onAddHoliday({
      id: nextId,
      ...formData
    });

    setShowModal(false);
    setFormData({ name: '', date: '2026-07-04', type: 'National' });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Calendar Events</p>
          <h3 className="text-lg font-bold text-slate-800">Company Holiday Calendar</h3>
        </div>
        {canModify && (
          <button
            id="btn-add-holiday"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
          </button>
        )}
      </div>

      {/* Filter search */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="holiday-search"
            type="text"
            placeholder="Search holidays by name or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedHolidays.length > 0 ? (
          sortedHolidays.map((h) => {
            const dateObj = new Date(h.date);
            const monthName = dateObj.toLocaleDateString(undefined, { month: 'short' });
            const dayNum = dateObj.getDate();
            const yearNum = dateObj.getFullYear();

            const typeColor = {
              National: 'bg-blue-50 text-blue-700 border-blue-100',
              Regional: 'bg-purple-50 text-purple-700 border-purple-100',
              Optional: 'bg-amber-50 text-amber-700 border-amber-200'
            }[h.type];

            return (
              <div key={h.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center space-x-4 justify-between">
                <div className="flex items-center space-x-4">
                  {/* Calendar Icon simulation */}
                  <div className="w-12 h-14 rounded-xl border border-slate-200 flex flex-col overflow-hidden text-center shadow-sm flex-shrink-0 select-none">
                    <span className="bg-rose-500 text-white text-[9px] font-bold uppercase py-0.5 tracking-wider">
                      {monthName}
                    </span>
                    <span className="font-extrabold text-slate-800 text-lg flex-1 flex items-center justify-center bg-slate-50 leading-none">
                      {dayNum}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight">{h.name}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-1">{yearNum} • ID: {h.id}</span>
                    <span className={`inline-block mt-2 px-2 py-0.5 text-[9px] font-bold border rounded-md ${typeColor}`}>
                      {h.type} Holiday
                    </span>
                  </div>
                </div>

                {canModify && (
                  <button
                    id={`btn-delete-holiday-${h.id}`}
                    onClick={() => {
                      if (confirm(`Remove ${h.name} from holiday calendar?`)) {
                        onDeleteHoliday(h.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Remove Holiday"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
            <div className="flex flex-col items-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-sm">No holidays match this search criteria</p>
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL (ADD HOLIDAY) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50 animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Add Holiday Event</h3>
              <button 
                id="close-holiday-modal"
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Holiday Title *</label>
                <input
                  id="holiday-field-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Independence Day"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Date *</label>
                <input
                  id="holiday-field-date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Holiday Type</label>
                <select
                  id="holiday-field-type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="National">National Holiday</option>
                  <option value="Regional">Regional Holiday</option>
                  <option value="Optional">Optional Leave Day</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-holiday-cancel"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-holiday-save"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
