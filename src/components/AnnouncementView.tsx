import React, { useState } from 'react';
import { Plus, Search, Trash2, Megaphone, X, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementViewProps {
  announcements: Announcement[];
  onAddAnnouncement: (a: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  userRole: string;
}

export default function AnnouncementView({
  announcements,
  onAddAnnouncement,
  onDeleteAnnouncement,
  userRole
}: AnnouncementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General' as 'General' | 'Event' | 'Policy' | 'Urgent',
    targetAudience: 'All' as 'All' | 'HR' | 'Managers' | 'Employees'
  });

  const canModify = userRole === 'Super Admin' || userRole === 'HR';

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Employee can see All + Employees, Managers can see All + Managers etc.
    const isOwner = a.targetAudience === 'All' || 
                    (userRole === 'Employee' && a.targetAudience === 'Employees') ||
                    (userRole === 'Manager' && a.targetAudience === 'Managers') ||
                    (userRole === 'HR' && a.targetAudience === 'HR') ||
                    userRole === 'Super Admin';

    return matchesSearch && isOwner;
  });

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title || !formData.content) {
      setFormError('Mandatory fields missing.');
      return;
    }

    const nextId = `ANN-${announcements.length + 1}`;
    onAddAnnouncement({
      id: nextId,
      title: formData.title,
      content: formData.content,
      category: formData.category,
      targetAudience: formData.targetAudience,
      date: new Date().toISOString().split('T')[0]
    });

    setShowModal(false);
    setFormData({ title: '', content: '', category: 'General', targetAudience: 'All' });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Broadcast Hub</p>
          <h3 className="text-lg font-bold text-slate-800">Operational Announcements</h3>
        </div>
        {canModify && (
          <button
            id="btn-add-announcement"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Post Bulletin</span>
          </button>
        )}
      </div>

      {/* Filter search */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="announcement-search"
            type="text"
            placeholder="Search announcements content or titles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Bulletins Feed list */}
      <div className="space-y-4">
        {sortedAnnouncements.length > 0 ? (
          sortedAnnouncements.map((ann) => {
            const catColors = {
              Urgent: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
              Policy: 'bg-indigo-50 text-indigo-700 border-indigo-200',
              Event: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              General: 'bg-blue-50 text-blue-700 border-blue-200'
            }[ann.category];

            return (
              <div key={ann.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex gap-6">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 h-11 w-11 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-slate-400" />
                </div>

                <div className="flex-1 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md ${catColors}`}>
                        {ann.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">ID: {ann.id}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-[10px] text-slate-400 font-bold">Audience: <b className="text-slate-500">{ann.targetAudience}</b></span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">{ann.date}</span>
                      {canModify && (
                        <button
                          id={`btn-delete-ann-${ann.id}`}
                          onClick={() => {
                            if (confirm('Delete this announcement permanent?')) {
                              onDeleteAnnouncement(ann.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove Bulletin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{ann.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2.5 whitespace-pre-line">
                      {ann.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-col items-center space-y-2">
              <Megaphone className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-sm">No announcements posted for your role category</p>
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL (POST BULLETIN) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50 animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Post Announcement</h3>
              <button 
                id="close-ann-modal"
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Announcement Title *</label>
                <input
                  id="ann-field-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Annual Mid-Year Policy Update"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    id="ann-field-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Policy">Policy</option>
                    <option value="Event">Event</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Audience</label>
                  <select
                    id="ann-field-audience"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="All">All Staff (Broadcast)</option>
                    <option value="Employees">Employees Only</option>
                    <option value="Managers">Managers Only</option>
                    <option value="HR">HR Staff Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Announcement Content *</label>
                <textarea
                  id="ann-field-content"
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write clear operational guidelines or event details..."
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-ann-cancel"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-ann-save"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
                >
                  Post Bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
