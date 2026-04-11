import React, { useState } from 'react';
import { Plus, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

export const Reports = ({ 
  reports, 
  role, 
  onSubmitReport, 
  onUpdateStatus 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [newReport, setNewReport] = useState({ title: '', content: '', studentName: 'Current User' });
  const [filter, setFilter] = useState('All');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitReport(newReport);
    setIsModalOpen(false);
    setNewReport({ title: '', content: '', studentName: 'Current User' });
  };

  const filteredReports = reports.filter(r => filter === 'All' || r.status === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-slate-900">Accomplishment Reports</h3>
          <div className="flex gap-1">
            {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-maroon-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {role === 'Student Assistant' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-maroon-600 text-white rounded-xl font-bold text-sm hover:bg-maroon-700 transition-colors"
          >
            <Plus size={18} />
            Submit Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReports.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} />
            </div>
            <p className="text-slate-400 font-medium">No reports found for this category.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <Card key={report._id || report.id} className="p-6 bg-white border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                    {report.studentName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{report.studentName}</h4>
                    <p className="text-xs text-slate-600 font-medium">{report.submittedAt || report.date}</p>
                  </div>
                </div>
                <Badge variant={report.status === 'Approved' ? 'success' : report.status === 'Pending' ? 'warning' : 'destructive'}>
                  {report.status}
                </Badge>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <h5 className="text-sm font-bold text-slate-800 mb-1">{report.title}</h5>
                <p className="text-sm text-slate-600 leading-relaxed italic">"{report.content}"</p>
              </div>
              {report.feedback && (
                <div className="flex items-start gap-3 pl-4 border-l-2 border-maroon-200">
                  <div className="mt-1 text-maroon-500">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-maroon-600 uppercase tracking-widest mb-1">Supervisor Feedback</p>
                    <p className="text-xs text-slate-500">{report.feedback}</p>
                  </div>
                </div>
              )}
              {role === 'Supervisor' && report.status === 'Pending' && (
                <div className="mt-6 flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setSelectedReportId(report._id || report.id);
                      setSelectedAction('Approved');
                      setFeedback('');
                      setIsApproveModalOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedReportId(report._id || report.id);
                      setSelectedAction('Rejected');
                      setFeedback('');
                      setIsApproveModalOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Submit Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Submit Accomplishment Report</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Report Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Weekly Accomplishment - March Week 3"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm"
                    value={newReport.title}
                    onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description / Content</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder="Describe your tasks and accomplishments for this period..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm resize-none"
                    value={newReport.content}
                    onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-maroon-600 text-white rounded-xl font-bold text-sm hover:bg-maroon-700 transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isApproveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedAction === 'Approved' ? 'Approve Report' : 'Reject Report'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Feedback (Optional)</label>
                  <textarea 
                    rows={4}
                    placeholder={selectedAction === 'Approved' ? 'Add any comments or notes...' : 'Please explain why this report is being rejected...'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm resize-none"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsApproveModalOpen(false);
                      setFeedback('');
                      setSelectedReportId(null);
                      setSelectedAction(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      onUpdateStatus(selectedReportId, selectedAction, feedback);
                      setIsApproveModalOpen(false);
                      setFeedback('');
                      setSelectedReportId(null);
                      setSelectedAction(null);
                    }}
                    className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold text-sm transition-colors ${
                      selectedAction === 'Approved' 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {selectedAction === 'Approved' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

