import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { apiService } from '../services/apiService';

// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '10:00';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================================================
// CALENDAR COMPONENT
// ============================================================================
export const Calendar = ({ 
  onDateSelect, 
  schedule = [], 
  onUpdateSchedule,
  role = 'Student Assistant',
  user,
  viewingStudent = null
}) => {
  // --------------------------------------------------------------------------
  // STATE: Calendar Navigation & Selection
  // --------------------------------------------------------------------------
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 27));
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 27));

  // --------------------------------------------------------------------------
  // STATE: Schedule Data
  // --------------------------------------------------------------------------
  const [schedules, setSchedules] = useState([]);
  const [temporarySchedules, setTemporarySchedules] = useState([]);

  // --------------------------------------------------------------------------
  // STATE: User & Role Based Viewing
  // --------------------------------------------------------------------------
  const [viewingUserId, setViewingUserId] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // --------------------------------------------------------------------------
  // STATE: Editing & Modal
  // --------------------------------------------------------------------------
  const [editingDay, setEditingDay] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newClass, setNewClass] = useState({ 
    subject: '', 
    startTime: DEFAULT_START_TIME, 
    endTime: DEFAULT_END_TIME, 
    description: '' 
  });

  // --------------------------------------------------------------------------
  // STATE: Loading & Error
  // --------------------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --------------------------------------------------------------------------
  // DERIVED STATE
  // --------------------------------------------------------------------------
  // Can edit own schedule or viewed user's schedule (API handles permission validation)
  const canEdit = !viewingStudent;

  // --------------------------------------------------------------------------
  // UTILITY FUNCTIONS: Date & Calendar Calculations
  // --------------------------------------------------------------------------
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // Organize users by role for dropdown display
  const organizeUsersByRole = (users) => {
    const grouped = {
      'Admin': [],
      'Supervisor': [],
      'Student Assistant': []
    };

    users.forEach(user => {
      if (grouped[user.role]) {
        grouped[user.role].push(user);
      }
    });

    return grouped;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get schedules for a specific day
  const getSchedulesForDate = (day) => {
    if (!day) return [];
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return schedules.filter(s => s.date.split('T')[0] === dateStr);
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    if (!day) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  // --------------------------------------------------------------------------
  // EFFECTS: Data Fetching
  // --------------------------------------------------------------------------
  // Fetch available users to view based on role
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (role === 'Student Assistant') return; // Student Assistants can't view others' schedules
      
      try {
        setUsersLoading(true);
        const response = await apiService.get('/users?limit=100');
        
        if (response.data && response.data.success) {
          const users = response.data.data || [];
          let filtered = [];

          if (role === 'Admin') {
            filtered = users.filter(u => (u.role === 'Supervisor' || u.role === 'Student Assistant') && u._id !== user?._id);
          } else if (role === 'Supervisor') {
            filtered = users.filter(u => (u.role === 'Admin' || u.role === 'Student Assistant') && u._id !== user?._id);
          }

          setAvailableUsers(filtered);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchAvailableUsers();
  }, [role, user?._id]);

  // Fetch schedules from database
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const params = new URLSearchParams({
          startDate: monthStart.toISOString().split('T')[0],
          endDate: monthEnd.toISOString().split('T')[0],
        });

        if (viewingUserId) {
          params.append('userId', viewingUserId);
        }

        if (viewingStudent && viewingStudent._id) {
          params.append('studentId', viewingStudent._id);
        }

        const response = await apiService.get(`/schedule?${params.toString()}`);
        if (response.data && response.data.success) {
          setSchedules(response.data.data || []);
          setError('');
        } else {
          setError(response.data?.message || 'Failed to load schedules');
        }
      } catch (err) {
        console.error('Error fetching schedules:', err);
        setError(err.response?.data?.message || 'Failed to load schedules from database');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [currentDate, viewingStudent, viewingUserId]);

  // --------------------------------------------------------------------------
  // EVENT HANDLERS: Calendar Navigation
  // --------------------------------------------------------------------------
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    if (day) {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(newDate);
      if (onDateSelect) onDateSelect(newDate);
    }
  };

  // --------------------------------------------------------------------------
  // EVENT HANDLERS: Modal & Editing
  // --------------------------------------------------------------------------
  const handleEditDay = (day) => {
    setEditingDay(day);
    setEditingSchedule(null);
    setNewClass({ 
      subject: '', 
      startTime: DEFAULT_START_TIME, 
      endTime: DEFAULT_END_TIME, 
      description: '' 
    });
    setTemporarySchedules([]);
  };

  const handleCloseModal = () => {
    setEditingDay(null);
    setEditingSchedule(null);
    setNewClass({ 
      subject: '', 
      startTime: DEFAULT_START_TIME, 
      endTime: DEFAULT_END_TIME, 
      description: '' 
    });
    setTemporarySchedules([]);
  };

  const handleEditClass = (scheduleItem) => {
    setEditingDay(new Date(scheduleItem.date).getDate());
    setEditingSchedule(scheduleItem);
    setNewClass({
      subject: scheduleItem.subject,
      startTime: scheduleItem.startTime,
      endTime: scheduleItem.endTime,
      description: scheduleItem.description || '',
    });
  };

  // --------------------------------------------------------------------------
  // EVENT HANDLERS: Schedule CRUD Operations
  // --------------------------------------------------------------------------

  const handleAddClass = async () => {
    if (!newClass.subject.trim()) {
      alert('Please enter a subject');
      return;
    }

    try {
      setLoading(true);
      const scheduleDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), editingDay);
      
      const payload = {
        date: scheduleDate.toISOString().split('T')[0],
        subject: newClass.subject.trim(),
        startTime: newClass.startTime,
        endTime: newClass.endTime,
        description: newClass.description.trim(),
      };

      if (editingSchedule) {
        // Update existing schedule
        const response = await apiService.put(`/schedule/${editingSchedule._id}`, payload);
        if (response.data && response.data.success) {
          setSchedules(schedules.map(s => s._id === editingSchedule._id ? response.data.data : s));
          setEditingDay(null);
          setEditingSchedule(null);
          setNewClass({ 
            subject: '', 
            startTime: DEFAULT_START_TIME, 
            endTime: DEFAULT_END_TIME, 
            description: '' 
          });
          setTemporarySchedules([]);
        } else {
          alert(response.data?.message || 'Failed to update schedule');
        }
      } else {
        // Create new schedule
        // If viewing another user's schedule, assign it to that user
        if (viewingUserId) {
          payload.createdByUserId = viewingUserId;
        }
        const response = await apiService.post('/schedule', payload);
        if (response.data && response.data.success) {
          setSchedules([...schedules, response.data.data]);
          setTemporarySchedules([...temporarySchedules, response.data.data]);
          setNewClass({ 
            subject: '', 
            startTime: DEFAULT_START_TIME, 
            endTime: DEFAULT_END_TIME, 
            description: '' 
          });
        } else {
          alert(response.data?.message || 'Failed to create schedule');
        }
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert('Error saving schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.delete(`/schedule/${scheduleId}`);
      if (response.data && response.data.success) {
        setSchedules(schedules.filter(s => s._id !== scheduleId));
      } else {
        alert(response.data?.message || 'Failed to delete schedule');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert(err.response?.data?.message || 'Error deleting schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTemporarySchedule = async (scheduleId) => {
    if (!confirm('Remove this schedule?')) {
      return;
    }
    try {
      setLoading(true);
      const response = await apiService.delete(`/schedule/${scheduleId}`);
      if (response.data && response.data.success) {
        setSchedules(schedules.filter(s => s._id !== scheduleId));
        setTemporarySchedules(temporarySchedules.filter(s => s._id !== scheduleId));
      } else {
        alert(response.data?.message || 'Failed to delete schedule');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('Error deleting schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Calendar Card */}
      <Card className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{monthName}</h2>
            {viewingStudent && role === 'Supervisor' && (
              <p className="text-sm text-slate-600">{viewingStudent.name}'s Schedule</p>
            )}
            
            {/* User selector dropdown for Supervisors and Admins */}
            {(role === 'Admin' || role === 'Supervisor') && !viewingStudent && (
              <div className="mt-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  View Schedule
                </label>
                <select
                  value={viewingUserId || ''}
                  onChange={(e) => setViewingUserId(e.target.value || null)}
                  disabled={usersLoading}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-maroon-500/20 disabled:bg-slate-100"
                >
                  <option value="">My Schedule</option>
                  {(() => {
                    const grouped = organizeUsersByRole(availableUsers);
                    const rolesToShow = role === 'Admin' 
                      ? ['Supervisor', 'Student Assistant'] 
                      : ['Admin', 'Student Assistant'];
                    
                    return rolesToShow.map(roleGroup => {
                      const usersInRole = grouped[roleGroup];
                      if (usersInRole.length === 0) return null;
                      
                      return (
                        <optgroup key={roleGroup} label={`${roleGroup}s (${usersInRole.length})`}>
                          {usersInRole.map(user => (
                            <option key={user._id} value={user._id}>
                              {user.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    });
                  })()}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAY_NAMES.map((day) => (
            <div key={day} className="text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest py-2">{day}</p>
            </div>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="col-span-7 text-center py-8">
            <p className="text-slate-500">Loading schedules...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="col-span-7 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Calendar grid */}
        {!loading && (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const schedules = getSchedulesForDate(day);
            const today = isToday(day);
            const selected = isSelected(day);

            return (
              <button
                key={idx}
                onClick={() => handleDateClick(day)}
                disabled={!day}
                className={`
                  p-2 rounded-lg border-2 transition-all min-h-[100px] flex flex-col
                  ${!day ? 'bg-transparent border-transparent' : ''}
                  ${selected
                    ? 'bg-maroon-600 border-maroon-600'
                    : today
                    ? 'bg-maroon-50 border-maroon-200'
                    : 'bg-white border-slate-200 hover:border-maroon-300'
                  }
                `}
              >
                {day && (
                  <div className="flex flex-col gap-1 w-full items-start text-left">
                    <span
                      className={`text-sm font-bold ${
                        selected
                          ? 'text-white'
                          : today
                          ? 'text-maroon-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {day}
                    </span>

                    <div className="flex-1 w-full">
                      {schedules.length > 0 ? (
                        <div className="space-y-0.5">
                          {schedules.slice(0, 3).map((s, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <p
                                className={`text-[10px] font-semibold leading-tight truncate flex-1 ${
                                  selected
                                    ? 'text-maroon-100'
                                    : 'text-maroon-600'
                                }`}
                              >
                                {s.subject}
                              </p>
                              {canEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClass(s);
                                  }}
                                  className={`p-0.5 rounded text-[9px] ${
                                    selected
                                      ? 'text-maroon-100 hover:text-white'
                                      : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  <Edit2 size={10} />
                                </button>
                              )}
                            </div>
                          ))}
                          {schedules.length > 3 && (
                            <p
                              className={`text-[9px] font-medium ${
                                selected
                                  ? 'text-maroon-100'
                                  : 'text-slate-400'
                              }`}
                            >
                              +{schedules.length - 3} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <p
                          className={`text-[9px] font-medium italic ${
                            selected ? 'text-maroon-100' : 'text-slate-300'
                          }`}
                        >
                          No class
                        </p>
                      )}
                    </div>

                    {canEdit && !viewingStudent && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDay(day);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            handleEditDay(day);
                          }
                        }}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 cursor-pointer transition-colors ${
                          selected
                            ? 'bg-maroon-500 text-white hover:bg-maroon-700'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Edit
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100 flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-maroon-600 rounded"></div>
            <span className="text-slate-600">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-maroon-50 border border-maroon-200 rounded"></div>
            <span className="text-slate-600">Today</span>
          </div>
        </div>
      </Card>

      {/* Day Details Card */}
      {getSchedulesForDate(selectedDate.getDate()).length > 0 && (
        <Card className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Schedule Details</h3>
          <div className="space-y-3">
            {getSchedulesForDate(selectedDate.getDate()).map((cls) => (
              <div key={cls._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{cls.subject}</p>
                  <p className="text-sm text-slate-600">{cls.startTime} - {cls.endTime}</p>
                  {cls.description && (
                    <p className="text-xs text-slate-500 mt-1">{cls.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(cls.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditClass(cls)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <h2 className="font-bold text-lg text-slate-900">
                    {editingSchedule ? 'Edit Schedule' : 'Add Classes'}
                  </h2>
                  {temporarySchedules.length > 0 && (
                    <p className="text-sm text-slate-500 mt-1">{temporarySchedules.length} class(es) added</p>
                  )}
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Form to add new class */}
                <div className="space-y-4 pb-6 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">New Class</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject Name</label>
                    <input
                      type="text"
                      value={newClass.subject}
                      onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                      placeholder="e.g., English, Math, Science"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Start Time</label>
                      <input
                        type="time"
                        value={newClass.startTime}
                        onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">End Time</label>
                      <input
                        type="time"
                        value={newClass.endTime}
                        onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description (Optional)</label>
                    <textarea
                      value={newClass.description}
                      onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                      placeholder="e.g., Room 101, Classroom A, Online"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20"
                      rows="2"
                    />
                  </div>
                  
                  <button
                    onClick={handleAddClass}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-maroon-600 text-white rounded-xl font-semibold hover:bg-maroon-700 disabled:bg-maroon-400 transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus size={16} /> {editingSchedule ? 'Update Schedule' : 'Add Class'}
                      </>
                    )}
                  </button>
                </div>

                {/* List of added classes in this session */}
                {temporarySchedules.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900">Added Classes Today</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {temporarySchedules.map((cls) => (
                        <div key={cls._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{cls.subject}</p>
                            <p className="text-sm text-slate-600">{cls.startTime} - {cls.endTime}</p>
                            {cls.description && (
                              <p className="text-xs text-slate-500 mt-1">{cls.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveTemporarySchedule(cls._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex gap-3 sticky bottom-0">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

