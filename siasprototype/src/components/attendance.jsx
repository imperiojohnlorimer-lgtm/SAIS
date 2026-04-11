import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ArrowRight, CheckCircle2, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar } from './calendar';
import { ConfirmDialog } from './ui/confirmDialog';

export const Attendance = ({ 
  attendance, 
  currentTime, 
  onTimeIn, 
  onTimeOut,
  onDelete,
  role,
  schedule = []
}) => {
  const [view, setView] = useState('log'); // 'log' or 'schedule'
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, record: null });
  
  // Debug logging
  console.log('📊 Attendance component received:', {
    recordCount: attendance.length,
    records: attendance.map(r => ({
      _id: r._id,
      id: r.id,
      timeIn: r.timeIn,
      timeOut: r.timeOut,
      date: r.date,
      studentName: r.studentName
    }))
  });
  
  const activeRecord = attendance.find(r => !r.timeOut);
  console.log('🟢 Active record:', activeRecord);

  // Calculate weekly hours from attendance data
  const calculateWeeklyHours = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayHours = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    // Get Monday of current week
    const today = new Date(currentTime);
    const monday = new Date(today);
    monday.setDate(monday.getDate() - (monday.getDay() || 7) + 1);
    
    // Sum hours for each day of the current week
    attendance.forEach(record => {
      if (record.date && record.totalHours) {
        const recordDate = new Date(record.date);
        // Check if record is in current week
        const recordWeekStart = new Date(recordDate);
        recordWeekStart.setDate(recordWeekStart.getDate() - (recordWeekStart.getDay() || 7) + 1);
        
        if (recordWeekStart.toDateString() === monday.toDateString()) {
          const dayIndex = recordDate.getDay();
          dayHours[dayIndex] = (dayHours[dayIndex] || 0) + (record.totalHours || 0);
        }
      }
    });
    
    return Object.entries(dayHours)
      .filter(([idx]) => idx !== 0 && idx !== 6) // Exclude Sunday and Saturday
      .map(([idx, hours], i) => {
        const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i];
        const color = hours >= 8 ? 'bg-maroon-500' : hours > 0 ? 'bg-maroon-300' : 'bg-slate-100';
        return { day: dayName, hours: Math.round(hours * 10) / 10, color };
      });
  };

  const weeklyData = calculateWeeklyHours();
  const totalWeeklyHours = weeklyData.reduce((sum, d) => sum + d.hours, 0);

  // Check for discrepancy: if clocked in during scheduled class
  const checkDiscrepancy = (record) => {
    if (!record.timeIn) return false;
    
    const recordDate = new Date(record.date);
    const dayIndex = recordDate.getDay();
    const daySchedule = schedule.filter(s => s.day === dayIndex && s.hasClass);
    
    if (daySchedule.length === 0) return false;

    const parseTime = (timeStr) => {
      if (!timeStr) return null;
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 100 + minutes;
    };

    const recordIn = parseTime(record.timeIn);
    const recordOut = parseTime(record.timeOut) || parseTime(currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

    return daySchedule.some(s => {
      const classIn = parseInt(s.startTime.replace(':', ''));
      const classOut = parseInt(s.endTime.replace(':', ''));
      return (recordIn < classOut && recordOut > classIn);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-900">Attendance</h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setView('log')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'log' ? 'bg-white text-maroon-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Log
              </button>
              <button 
                onClick={() => setView('schedule')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'schedule' ? 'bg-white text-maroon-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Schedule
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              <CalendarIcon size={14} />
              {currentTime.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </button>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {view === 'log' ? (
            <motion.div
              key="log"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <Card>
                <div className="divide-y divide-slate-50">
                  {attendance.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-slate-400 text-sm font-medium">No attendance records found.</p>
                    </div>
                  ) : (
                    attendance.map((record) => {
                      const hasDiscrepancy = checkDiscrepancy(record);
                      return (
                        <div key={record._id || record.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${record.timeOut ? 'bg-slate-50 text-slate-400' : 'bg-maroon-50 text-maroon-600 animate-pulse'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-tighter">
                                {new Date(record.date).toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                              <span className="text-lg font-bold leading-none">
                                {new Date(record.date).toLocaleDateString('en-US', { day: 'numeric' })}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800">{record.studentName}</p>
                                {hasDiscrepancy && (
                                  <div className="group relative">
                                    <AlertTriangle size={14} className="text-amber-500 cursor-help" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                      Discrepancy detected: Clocked in during scheduled class hours.
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={record.timeOut ? 'success' : 'warning'}>
                                  {record.timeOut ? 'Completed' : 'On Duty'}
                                </Badge>
                                {record.timeOut && (
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {record.date}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-center">
                              <p className="text-sm font-bold text-slate-700">{record.timeIn}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">In</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-slate-700">{record.timeOut || '--:--'}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Out</p>
                            </div>
                            <div className="w-px h-8 bg-slate-100 hidden md:block"></div>
                            {['Supervisor', 'Admin'].includes(role) && (
                              <button 
                                onClick={() => setDeleteDialog({ isOpen: true, record })}
                                className="p-2 text-slate-300 hover:text-red-600 transition-colors hidden md:block"
                                title="Delete attendance record"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                            <button className="p-2 text-slate-300 hover:text-maroon-600 transition-colors hidden md:block">
                              <ArrowRight size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <Calendar schedule={schedule} />
              
              <Card className="p-4 bg-amber-50 border border-amber-100">
                <div className="flex gap-3">
                  <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-800">About the Schedule</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      This calendar reflects your academic schedule. Clocking in during scheduled class hours will trigger a discrepancy alert for supervisor review.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        <Card className="p-8 text-center bg-white">
          <div className="mb-6">
            <div className={`w-24 h-24 rounded-full border-4 mx-auto flex items-center justify-center mb-4 transition-colors ${activeRecord ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-maroon-50 bg-maroon-50 text-maroon-600'}`}>
              <Clock size={40} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          
          {role === 'Student Assistant' && (
            <div className="space-y-3">
              {!activeRecord ? (
                <button 
                  onClick={onTimeIn}
                  className="w-full py-4 bg-maroon-600 text-white rounded-2xl font-bold shadow-xl shadow-maroon-200 hover:bg-maroon-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ArrowRight size={18} />
                  Time In
                </button>
              ) : (
                <button 
                  onClick={() => onTimeOut(activeRecord._id || activeRecord.id)}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Time Out
                </button>
              )}
            </div>
          )}
          
          {activeRecord && (
            <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Currently on duty
            </div>
          )}
          
          <p className="mt-6 text-[10px] text-slate-400 font-medium leading-relaxed">
            Please ensure you are within the campus premises.
          </p>
        </Card>

        <Card className="p-6">
          <h4 className="font-bold text-slate-800 mb-4">Weekly Summary</h4>
          <div className="space-y-4">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 w-8">{d.day}</span>
                <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                  <div className={`h-full ${d.color}`} style={{ width: `${(d.hours / 8) * 100}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-slate-600 w-6">{d.hours}h</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
              <p className="text-lg font-bold text-slate-800">{totalWeeklyHours.toFixed(1)}h</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</p>
              <p className="text-lg font-bold text-maroon-600">40.0h</p>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Attendance Record"
        message={deleteDialog.record ? `Are you sure you want to delete the attendance record for ${deleteDialog.record.studentName} on ${new Date(deleteDialog.record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={() => {
          if (deleteDialog.record && onDelete) {
            onDelete(deleteDialog.record._id || deleteDialog.record.id);
          }
          setDeleteDialog({ isOpen: false, record: null });
        }}
        onCancel={() => setDeleteDialog({ isOpen: false, record: null })}
      />
    </motion.div>
  );
};

