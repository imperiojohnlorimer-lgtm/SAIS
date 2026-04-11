import React, { useState } from 'react';
import { Search, Plus, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export const Students = ({ 
  students = [], 
  searchQuery, 
  setSearchQuery, 
  onAddStudent, 
  onDeleteStudent,
  role,
  onViewStudent,
  currentUser
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', email: '', department: currentUser?.department || '', status: 'Active' });

  // Get unique departments from students
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];

  // Filter students by search and department
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !filterDepartment || student.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddStudent(newStudent);
    setIsModalOpen(false);
    setNewStudent({ name: '', email: '', department: '', status: 'Active' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-600 mt-1">Manage student assistants</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {role === 'Admin' && (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="flex-1 md:flex-none md:w-48 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl shadow-sm border-slate-100 bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Hours</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                      <p className="text-sm">No students found</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr 
                      key={student._id || student.id} 
                      onClick={() => onViewStudent && onViewStudent(student)}
                      className="hover:bg-maroon-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-maroon-100 text-maroon-600 flex items-center justify-center text-xs font-bold">
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600 text-sm">{student.department}</td>

                      <td className="px-6 py-4">
                        <Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>
                          {student.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{student.totalHours}h</span>
                          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-maroon-500" style={{ width: `${Math.min(student.totalHours, 100)}%` }}></div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {role === 'Supervisor' && (
                            <button 
                              onClick={() => onDeleteStudent(student._id || student.id)}
                              title="Delete student - Removes this student from the system"
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <button 
                            title="More options - View student details or perform additional actions"
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-xl"
            >
              <div className="p-6 border-b border-slate-100">
                <h2 className="font-bold text-lg text-slate-900">
                  {role === 'Supervisor' ? 'Register New Student' : 'Add New Student'}
                </h2>
                {role === 'Supervisor' && (
                  <p className="text-xs text-slate-600 mt-1">Register to {currentUser?.department}</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter email"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Department</label>
                  {role === 'Supervisor' ? (
                    <input
                      type="text"
                      disabled
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm opacity-60"
                      value={currentUser?.department || 'Not specified'}
                    />
                  ) : (
                    <select
                      required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all"
                      value={newStudent.department}
                      onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                    >
                      <option value="">Select a department</option>
                      <option value="IT Services">IT Services</option>
                      <option value="Library">Library</option>
                      <option value="Registrar">Registrar</option>
                      <option value="Student Affairs">Student Affairs</option>
                    </select>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 bg-maroon-600 text-white rounded-lg font-semibold text-sm hover:bg-maroon-700 transition-colors"
                  >
                    {role === 'Supervisor' ? 'Register Student' : 'Save Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

