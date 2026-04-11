import React, { useState, useEffect } from 'react';
import { Search, Plus, UserCog, Shield, User, Trash2, Mail, Building, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ConfirmDialog } from './ui/confirmDialog';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const Accounts = ({ users, onAddUser, onDeleteUser, onViewProfile, onRoleChange }) => {
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [roleChangeConfirm, setRoleChangeConfirm] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [deleteDeptConfirm, setDeleteDeptConfirm] = useState(null);
  const [creatingDept, setCreatingDept] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ 
    name: ''
  });

  const defaultDepartments = [
    { name: 'College of Education', code: 'COE' },
    { name: 'College of Engineering', code: 'CENG' },
    { name: 'College of Industrial Technology', code: 'CIT' },
    { name: 'College of Information and Computing Sciences', code: 'CICS' }
  ];

  // Fetch departments from database
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      // Start with departments from database
      const response = await axios.get(`${API_URL}/departments`);
      let deptList = [];
      
      if (response.data.success && response.data.data?.length > 0) {
        deptList = response.data.data;
        console.log('📚 Departments fetched from database:', response.data.data);
      }
      
      // Also add any departments from existing users (for those registered but not formally created)
      const extractedFromUsers = new Set();
      const extractedDepts = [];
      
      (users || []).forEach(user => {
        if (user.department && !extractedFromUsers.has(user.department)) {
          extractedFromUsers.add(user.department);
          // Check if this department is already in deptList
          const alreadyExists = deptList.some(d => d.name === user.department || d === user.department);
          if (!alreadyExists) {
            const defaultDept = defaultDepartments.find(d => d.name === user.department);
            extractedDepts.push(defaultDept || { name: user.department, code: user.department.split(' ').map(w => w[0]).join('').toUpperCase() });
          }
        }
      });
      
      // Combine and deduplicate
      const combinedDepts = [...deptList, ...extractedDepts];
      const uniqueDepts = Array.from(new Map(combinedDepts.map(d => [d.name || d, d])).values());
      
      setDepartments(uniqueDepts);
      console.log('📚 Combined departments:', uniqueDepts);
      
    } catch (error) {
      console.error('Error fetching departments, extracting from users:', error);
      
      // Fallback: extract from users only
      const existingDepts = new Set();
      const deptArray = [];
      
      (users || []).forEach(user => {
        if (user.department && !existingDepts.has(user.department)) {
          existingDepts.add(user.department);
          const defaultDept = defaultDepartments.find(d => d.name === user.department);
          deptArray.push(defaultDept || { name: user.department, code: user.department.split(' ').map(w => w[0]).join('').toUpperCase() });
        }
      });
      
      if (deptArray.length > 0) {
        setDepartments(deptArray);
        console.log('📚 Departments extracted from users (fallback):', deptArray);
      } else {
        setDepartments(defaultDepartments);
        console.log('📚 Using default departments');
      }
    }
  };

  // Use users prop from App.jsx - no need to fetch here
  useEffect(() => {
    console.log('📊 [Accounts] Using users prop, count:', users?.length || 0);
    // Re-fetch departments when users change (in case new departments are added through registration)
    fetchDepartments();
  }, [users]);

  const handleChangeRole = (userId, newRole, userName, currentRole) => {
    // Show confirmation dialog instead of immediate change
    setRoleChangeConfirm({
      userId,
      newRole,
      userName,
      currentRole
    });
  };

  const confirmRoleChange = async () => {
    if (!roleChangeConfirm) return;
    
    const { userId, newRole, userName, currentRole } = roleChangeConfirm;
    setUpdatingId(userId);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(
        `${API_URL}/users/${userId}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = response.data.data || { _id: userId, role: newRole };
      
      // Parent (App.jsx) will handle state update via setUsers
      if (onRoleChange) {
        onRoleChange(updatedUser);
      }
      
      setRoleChangeConfirm(null);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setCreatingDept(true);

    try {
      const token = localStorage.getItem('auth_token');
      // Generate code automatically from department name
      const code = newDepartment.name.split(' ').map(w => w[0]).join('').toUpperCase();
      
      const response = await axios.post(
        `${API_URL}/departments`,
        { name: newDepartment.name, code },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setDepartments([...departments, response.data.data]);
        setNewDepartment({ name: '' });
        setIsDeptModalOpen(false);
        alert('Department created successfully!');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      alert(error.response?.data?.message || 'Failed to create department');
    } finally {
      setCreatingDept(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deleteDeptConfirm) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(
        `${API_URL}/departments/${deleteDeptConfirm._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDepartments(departments.filter(d => d._id !== deleteDeptConfirm._id));
      setDeleteDeptConfirm(null);
      alert('Department deleted successfully!');
    } catch (error) {
      console.error('Error deleting department:', error);
      alert(error.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Deleting user with ID:', userId);
      
      await axios.delete(
        `${API_URL}/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Parent (App.jsx) will handle state update via onDeleteUser
      onDeleteUser(userId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete user';
      alert(`Delete failed: ${errorMsg}`);
    }
  };

  const departments_list = departments.map(d => d.name);

  const roles = ['Admin', 'Supervisor', 'Student Assistant'];

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    const matchesDept = filterDepartment === 'All' || user.department === filterDepartment;
    return matchesSearch && matchesRole && matchesDept;
  });

  // Stats
  const stats = {
    admins: (users || []).filter(u => u.role === 'Admin').length,
    supervisors: (users || []).filter(u => u.role === 'Supervisor').length,
    students: (users || []).filter(u => u.role === 'Student Assistant').length,  // Student Assistants ARE students
    total: (users || []).length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-gold-50 to-gold-100 border-l-4 border-l-maroon-600 border-gold-200">
          <p className="text-xs font-bold text-maroon-600 uppercase tracking-widest">Admins</p>
          <p className="text-3xl font-bold text-maroon-900 mt-2">{stats.admins}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-maroon-50 to-maroon-100 border-l-4 border-l-gold-500 border-maroon-200">
          <p className="text-xs font-bold text-maroon-600 uppercase tracking-widest">Supervisors</p>
          <p className="text-3xl font-bold text-maroon-900 mt-2">{stats.supervisors}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-maroon-50 to-maroon-100 border-l-4 border-l-gold-500 border-maroon-200">
          <p className="text-xs font-bold text-maroon-600 uppercase tracking-widest">Students</p>
          <p className="text-3xl font-bold text-maroon-900 mt-2">{stats.students}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-gold-50 to-gold-100 border-l-4 border-l-maroon-600 border-gold-200">
          <p className="text-xs font-bold text-maroon-600 uppercase tracking-widest">Total</p>
          <p className="text-3xl font-bold text-maroon-900 mt-2">{stats.total}</p>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search accounts..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsDeptModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-maroon-600 text-white rounded-xl font-bold text-sm hover:bg-maroon-700 transition-colors shadow-lg shadow-maroon-100"
          >
            <Plus size={18} />
            Create Department
          </button>
        </div>

        {/* Role & Department Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Filter by Role</p>
            <div className="flex gap-2 flex-wrap">
              {['All', ...roles].map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterRole === role
                      ? 'bg-maroon-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Filter by Department</p>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-maroon-500/20"
            >
              <option value="All">All Departments</option>
              {departments_list.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Card className="bg-white border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr 
                  key={user._id || user.id} 
                  onClick={() => onViewProfile(user)}
                  className="hover:bg-maroon-50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        user.role === 'Admin' ? 'bg-purple-50 text-purple-600' : 
                        user.role === 'Supervisor' ? 'bg-blue-50 text-blue-600' : 'bg-maroon-50 text-maroon-600'
                      }`}>
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.role === 'Admin' ? <Shield size={14} className="text-purple-500" /> : 
                       user.role === 'Supervisor' ? <UserCog size={14} className="text-blue-500" /> : 
                       <User size={14} className="text-maroon-500" />}
                      <select
                        value={user.role}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleChangeRole(user._id || user.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={updatingId === (user._id || user.id)}
                        className="text-sm font-medium bg-transparent border-0 focus:outline-none cursor-pointer hover:bg-slate-50 px-2 py-1 rounded"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Student Assistant">Student Assistant</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">{user.department}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role !== 'Admin' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(user);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {isDeptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Create New Department</h3>
              </div>
              <form onSubmit={handleCreateDepartment} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Department Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500/20 focus:border-maroon-500 transition-all text-sm"
                      placeholder="e.g., College of Engineering"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => setIsDeptModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={creatingDept}
                    className="flex-1 px-4 py-2.5 bg-maroon-600 text-white rounded-xl font-bold text-sm hover:bg-maroon-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingDept ? 'Creating...' : 'Create Department'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Departments Table */}
        <Card className="bg-white border border-slate-100 mt-8">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Departments ({departments.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Code</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <tr 
                    key={dept._id} 
                    className="hover:bg-maroon-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{dept.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-maroon-100 text-maroon-700 font-mono text-xs">{dept.code}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setDeleteDeptConfirm(dept)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {departments.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-slate-500">No departments available. Create one using "Create Department" button above.</p>
              </div>
            )}
          </div>
        </Card>

        {deleteDeptConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-red-100 bg-red-50">
                <h3 className="text-lg font-bold text-red-900">Delete Department</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600">
                  Are you sure you want to delete <span className="font-bold text-slate-900">{deleteDeptConfirm.name}</span> department? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700">⚠️ Department code: <span className="font-mono">{deleteDeptConfirm.code}</span></p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setDeleteDeptConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleDeleteDepartment}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                >
                  Delete Department
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {roleChangeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-maroon-100 bg-maroon-50">
                <h3 className="text-lg font-bold text-maroon-900">Change User Role</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600">
                  Are you sure you want to change <span className="font-bold text-slate-900">{roleChangeConfirm.userName}</span>'s role?
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Current Role</p>
                    <p className="text-sm font-bold text-slate-900">{roleChangeConfirm.currentRole}</p>
                  </div>
                  <div className="border-t border-slate-200 my-2"></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">New Role</p>
                    <p className="text-sm font-bold text-maroon-600">{roleChangeConfirm.newRole}</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700">ℹ️ This change will update the user's permissions immediately.</p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setRoleChangeConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={confirmRoleChange}
                  disabled={updatingId === roleChangeConfirm.userId}
                  className="flex-1 px-4 py-2.5 bg-maroon-600 text-white rounded-xl font-bold text-sm hover:bg-maroon-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingId === roleChangeConfirm.userId ? 'Updating...' : 'Change Role'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-red-100 bg-red-50">
                <h3 className="text-lg font-bold text-red-900">Delete Account</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600">
                  Are you sure you want to delete <span className="font-bold text-slate-900">{deleteConfirm.name}</span>'s account? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700">⚠️ This will permanently remove the account and all associated data.</p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => handleDeleteUser(deleteConfirm.id || deleteConfirm._id, deleteConfirm.name)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

