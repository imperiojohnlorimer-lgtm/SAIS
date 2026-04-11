import React, { useState } from 'react';
import { Plus, CheckCircle2, Clock, AlertCircle, Calendar, User, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ConfirmDialog } from './ui/confirmDialog';

export const Tasks = ({ tasks, students, role, currentUser, onAddTask, onUpdateTaskStatus, onDeleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, taskId: null, taskTitle: null });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    studentId: '',
    priority: 'Medium',
    dueDate: ''
  });

  // Filter to only show Student Assistants in task assignment
  const assignableStudents = students.filter(s => {
    // Check if student has a userId reference with role, or has a direct role field
    const isStudentAssistant = s.userId?.role === 'Student Assistant' || s.role === 'Student Assistant';
    return isStudentAssistant && s.name; // Also ensure student has a name
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newTask.title || !newTask.description || !newTask.studentId || !newTask.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Pass all required fields to the API handler
    onAddTask({
      title: newTask.title,
      description: newTask.description,
      studentId: newTask.studentId,
      priority: newTask.priority || 'Medium',
      dueDate: newTask.dueDate
    });
    
    setIsModalOpen(false);
    setNewTask({ title: '', description: '', studentId: '', priority: 'Medium', dueDate: '' });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-600 border-red-100';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Low': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'In Progress': return <Clock size={16} className="text-amber-500" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  const handleDeleteClick = (taskId, taskTitle) => {
    setDeleteConfirm({ isOpen: true, taskId, taskTitle });
  };

  const handleConfirmDelete = () => {
    onDeleteTask(deleteConfirm.taskId);
    setDeleteConfirm({ isOpen: false, taskId: null, taskTitle: null });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Task Management</h2>
          <p className="text-sm text-slate-600 mt-1">Assign and track student assistant duties</p>
        </div>
        {role === 'Supervisor' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-maroon-600 text-white rounded-xl font-bold text-sm hover:bg-maroon-700 transition-colors shadow-lg shadow-maroon-100"
          >
            <Plus size={18} />
            Assign Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => {
          const taskId = task._id || task.id;
          const studentName = task.assignedTo?.name || task.studentName || 'Unknown Student';
          const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date';
          
          return (
            <Card key={taskId} className="p-6 flex flex-col h-full hover:shadow-md transition-shadow bg-white border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority} Priority
                </Badge>
                <div className="flex items-center gap-1">
                  {getStatusIcon(task.status)}
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{task.status}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2">{task.title}</h3>
              <p className="text-sm text-slate-600 mb-6 flex-1 line-clamp-3">{task.description}</p>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <User size={14} />
                  <span className="font-medium">Assigned to: {studentName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Calendar size={14} />
                  <span className="font-medium">Due: {dueDate}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-2">
                {role === 'Student Assistant' && task.status !== 'Completed' && (
                  <button 
                    onClick={() => {
                      const nextStatus = task.status === 'Not Started' ? 'In Progress' : 'Completed';
                      onUpdateTaskStatus(taskId, nextStatus);
                    }}
                    className="flex-1 py-2 bg-maroon-50 text-maroon-600 rounded-lg text-xs font-bold hover:bg-maroon-100 transition-colors"
                  >
                    {task.status === 'Not Started' ? 'Start Task' : 'Mark Completed'}
                  </button>
                )}
                {role === 'Supervisor' && (
                  <>
                    <button 
                      onClick={() => handleDeleteClick(taskId, task.title)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Clock size={24} />
          </div>
          <h3 className="text-slate-800 font-bold">No tasks assigned yet</h3>
          <p className="text-slate-500 text-sm">Tasks assigned by supervisors will appear here.</p>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Assign New Task</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Task Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lab Maintenance"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Provide details about the task..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm resize-none"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assign To</label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm"
                      value={newTask.studentId}
                      onChange={(e) => setNewTask({ ...newTask, studentId: e.target.value })}
                    >
                      <option value="">Select Student Assistant</option>
                      {assignableStudents.map(student => (
                        <option key={student._id || student.id} value={student._id || student.id}>{student.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Due Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
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
                    Assign Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${deleteConfirm.taskTitle}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, taskId: null, taskTitle: null })}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
      />
    </motion.div>
  );
};

