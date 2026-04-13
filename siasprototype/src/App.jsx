/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { userAPI } from './services/apiService';
import { Sidebar } from './components/sidebar';
import { Header } from './components/header';
import { Login } from './components/login';
import { Register } from './components/register';
import { Dashboard } from './components/dashboard';
import { Accounts } from './components/accounts';
import { Students } from './components/student';
import { Attendance } from './components/attendance';
import { Calendar } from './components/calendar';
import { Tasks } from './components/tasks';
import { Profile } from './components/profile';
import { Reports } from './components/reports';

// Get API base URL from environment or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  const [role, setRole] = useState('Supervisor');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // State Management for CRUD
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [reports, setReports] = useState([]);
  const abortControllersRef = useRef({
    users: null,
    students: null,
    attendance: null,
    tasks: null
  });

  // Restore user session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setRole(user.role);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to restore user session:', err);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup all abort controllers on unmount
  useEffect(() => {
    return () => {
      Object.values(abortControllersRef.current).forEach(controller => {
        if (controller) {
          controller.abort();
        }
      });
    };
  }, []);

  // Fetch real users from API when authenticated as Admin
  useEffect(() => {
    const fetchUsers = async () => {
      if (isAuthenticated && role === 'Admin') {
        try {
          // Cancel previous request
          if (abortControllersRef.current.users) {
            abortControllersRef.current.users.abort();
          }

          const controller = new AbortController();
          abortControllersRef.current.users = controller;

          const token = localStorage.getItem('auth_token');
          const response = await axios.get(`${API_BASE_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
            timeout: 30000
          });
          if (response.data.data && Array.isArray(response.data.data)) {
            setUsers(response.data.data);
          }
        } catch (error) {
          if (error.name !== 'CanceledError') {
            console.error('Failed to fetch users from API:', error);
          }
        }
      }
    };

    if (activeTab === 'accounts') {
      fetchUsers();
    }
  }, [activeTab, isAuthenticated, role, refreshKey]);

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      if (isAuthenticated) {
        try {
          // Cancel previous request
          if (abortControllersRef.current.students) {
            abortControllersRef.current.students.abort();
          }

          const controller = new AbortController();
          abortControllersRef.current.students = controller;

          const token = localStorage.getItem('auth_token');
          console.log('🔄 [App] Fetching students...');
          const response = await axios.get(`${API_BASE_URL}/students`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
            timeout: 30000
          });
          console.log('✅ [App] Students response:', response.data);
          if (response.data.data && Array.isArray(response.data.data)) {
            console.log('✔️ [App] Setting students with:', response.data.data.length, 'items');
            setStudents(response.data.data);
          } else {
            console.error('❌ [App] Invalid response format. Got:', response.data);
          }
        } catch (error) {
          if (error.name !== 'CanceledError') {
            console.error('❌ [App] Failed to fetch students from API:', error.response?.data || error.message);
          }
        }
      }
    };

    if (activeTab === 'students' || activeTab === 'attendance' || activeTab === 'tasks') {
      fetchStudents();
    }
  }, [activeTab, isAuthenticated, refreshKey]);

  // Fetch attendance from API
  useEffect(() => {
    const fetchAttendance = async () => {
      if (isAuthenticated) {
        try {
          // Cancel previous request
          if (abortControllersRef.current.attendance) {
            abortControllersRef.current.attendance.abort();
          }

          const controller = new AbortController();
          abortControllersRef.current.attendance = controller;

          const token = localStorage.getItem('auth_token');
          // Student Assistants see their own records via /me endpoint
          // Supervisors/Admins see all records from the list endpoint
          const endpoint = role === 'Student Assistant' 
            ? `${API_BASE_URL}/attendance/me` 
            : `${API_BASE_URL}/attendance`;
          
          const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
            timeout: 30000
          });
          if (response.data.data && Array.isArray(response.data.data)) {
            setAttendance(response.data.data);
          }
        } catch (error) {
          if (error.name !== 'CanceledError') {
            console.error('Failed to fetch attendance from API:', error);
          }
        }
      }
    };

    if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab, isAuthenticated, role]);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      if (isAuthenticated) {
        try {
          // Cancel previous request
          if (abortControllersRef.current.tasks) {
            abortControllersRef.current.tasks.abort();
          }

          const controller = new AbortController();
          abortControllersRef.current.tasks = controller;

          const token = localStorage.getItem('auth_token');
          const response = await axios.get(`${API_BASE_URL}/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
            timeout: 30000
          });
          console.log('Tasks fetched:', response.data);
          if (response.data.data && Array.isArray(response.data.data)) {
            setTasks(response.data.data);
          }
        } catch (error) {
          if (error.name !== 'CanceledError') {
            console.error('Failed to fetch tasks from API:', error);
          }
        }
      }
    };

    if (activeTab === 'tasks') {
      fetchTasks();
    }
  }, [activeTab, isAuthenticated]);

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      if (isAuthenticated) {
        try {
          const token = localStorage.getItem('auth_token');
          const response = await axios.get(`${API_BASE_URL}/reports`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000
          });
          if (response.data.data && Array.isArray(response.data.data)) {
            setReports(response.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch reports from API:', error);
        }
      }
    };

    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, isAuthenticated]);

  // Handlers for Students
  const handleAddStudent = (newStudent) => {
    // Create a corresponding user record if it doesn't exist
    let userId = newStudent.userId;
    if (!userId) {
      const newUser = {
        id: `u${users.length + 1}`,
        name: newStudent.name,
        email: newStudent.email,
        role: 'Student Assistant',
        department: newStudent.department,
        phone: newStudent.phone || '',
        address: newStudent.address || newStudent.department,
        avatar: `https://picsum.photos/seed/${newStudent.name}/200`
      };
      setUsers([...users, newUser]);
      userId = newUser.id;
    }

    const student = {
      ...newStudent,
      id: (students.length + 1).toString(),
      userId,
      totalHours: 0,
      status: newStudent.status || 'Active',
      avatar: `https://picsum.photos/seed/${newStudent.name}/200`,
      phone: newStudent.phone || '',
      address: newStudent.address || newStudent.department
    };
    setStudents([...students, student]);
  };

  const handleDeleteStudent = (id) => {
    setStudents(students.filter(s => s.id !== id));
  };

  // Handlers for Attendance
  const handleTimeIn = async (studentId, studentName) => {
    try {
      const token = localStorage.getItem('auth_token');
      const timeIn = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      console.log(`⏱️ Clocking in: ${studentName} (${studentId}) at ${timeIn}`);
      
      const response = await axios.post(`${API_BASE_URL}/attendance/clock-in`, 
        {
          studentId: studentId,
          studentName: studentName,
          timeIn: timeIn,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Clock in successful:', response.data.data);
      if (response.data.data) {
        console.log('📝 Adding record to state immediately');
        setAttendance([response.data.data, ...attendance]);
        
        // Refetch attendance to sync with DB
        console.log('⏳ Waiting 500ms before refetch...');
        setTimeout(() => {
          const endpoint = role === 'Student Assistant' 
            ? `${API_BASE_URL}/attendance/me` 
            : `${API_BASE_URL}/attendance`;
          
          console.log(`🔄 Refetching from: ${endpoint}`);
          axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
              console.log('🔄 Refetch response:', res.data);
              if (res.data.data && Array.isArray(res.data.data)) {
                console.log(`🔄 Setting attendance to ${res.data.data.length} records`);
                setAttendance(res.data.data);
              }
            })
            .catch(err => {
              console.error('❌ Failed to refresh:', err.message);
              console.error('Response:', err.response?.data);
            });
        }, 500);
      }
    } catch (error) {
      console.error('❌ Failed to clock in:', error.message);
      alert(`Clock in failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleTimeOut = async (recordId) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const timeOut = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      console.log(`🕐 Clocking out record ${recordId} at ${timeOut}`);
      
      const response = await axios.put(`${API_BASE_URL}/attendance/${recordId}/clock-out`, 
        { timeOut: timeOut },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Clock out successful:', response.data.data);
      if (response.data.data) {
        setAttendance(attendance.map(record => 
          record._id === recordId || record.id === recordId ? response.data.data : record
        ));
        
        // Refetch attendance to ensure sync
        setTimeout(() => {
          const endpoint = role === 'Student Assistant' 
            ? `${API_BASE_URL}/attendance/me` 
            : `${API_BASE_URL}/attendance`;
          axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
              if (res.data.data && Array.isArray(res.data.data)) {
                console.log('🔄 Refreshed attendance after clock-out:', res.data.data);
                setAttendance(res.data.data);
              }
            })
            .catch(err => console.error('Failed to refresh:', err));
        }, 500);
      }
    } catch (error) {
      console.error('❌ Failed to clock out:', error.message);
      alert(`Clock out failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteAttendance = async (recordId) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      console.log(`🗑️ Deleting attendance record ${recordId}`);
      
      await axios.delete(`${API_BASE_URL}/attendance/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Attendance record deleted successfully');
      setAttendance(attendance.filter(record => record._id !== recordId && record.id !== recordId));
      alert('Attendance record deleted successfully.');
    } catch (error) {
      console.error('❌ Failed to delete attendance:', error.message);
      alert(`Failed to delete attendance: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handlers for Tasks
  const handleAddTask = async (newTask) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // The studentId from the form is now the MongoDB _id
      if (!newTask.studentId) {
        alert('Please select a student.');
        return;
      }

      // Convert string date to proper format if needed
      const dueDate = new Date(newTask.dueDate).toISOString();

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        assignedTo: newTask.studentId, // This is already the MongoDB _id from dropdown
        assignedBy: currentUser._id || currentUser.id,
        dueDate: dueDate,
        priority: newTask.priority || 'Medium',
        status: 'Not Started',
      };

      console.log('Sending task data:', taskData);

      const response = await axios.post(`${API_BASE_URL}/tasks`, taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.data) {
        setTasks([response.data.data, ...tasks]);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert(`Failed to create task: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateTaskStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Map frontend status to backend status
      const statusMap = {
        'Pending': 'Not Started',
        'In Progress': 'In Progress',
        'Completed': 'Completed'
      };
      
      const backendStatus = statusMap[status] || status;

      const response = await axios.put(`${API_BASE_URL}/tasks/${id}`, 
        { status: backendStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.data) {
        setTasks(tasks.map(t => t._id === id || t.id === id ? response.data.data : t));
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert(`Failed to update task: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      await axios.delete(`${API_BASE_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTasks(tasks.filter(t => t._id !== id && t.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert(`Failed to delete task: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handlers for Schedule
  const handleUpdateSchedule = (updatedSchedule) => {
    setSchedule(updatedSchedule);
  };

  // Handlers for Reports
  const handleSubmitReport = async (newReport) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const reportData = {
        title: newReport.title,
        content: newReport.content,
        studentId: currentUser._id || currentUser.id,
        studentName: currentUser.name,
        status: 'Pending',
        submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      const response = await axios.post(`${API_BASE_URL}/reports`, reportData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.data) {
        setReports([response.data.data, ...reports]);
        alert('Report submitted successfully!');
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert(`Failed to submit report: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateReportStatus = async (reportId, status, feedback = '') => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const updateData = {
        status: status,
      };
      
      if (feedback) {
        updateData.feedback = feedback;
      }

      const response = await axios.patch(`${API_BASE_URL}/reports/${reportId}/review`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.data) {
        setReports(reports.map(r => r._id === reportId || r.id === reportId ? response.data.data : r));
        alert(`Report ${status.toLowerCase()} successfully!`);
      }
    } catch (error) {
      console.error('Failed to update report:', error);
      alert(`Failed to update report: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handlers for Accounts (Admin)
  const handleAddUser = (newUser) => {
    const user = {
      ...newUser,
      id: `u${users.length + 1}`
    };
    setUsers([...users, user]);
    
    // If it's a student assistant, also add to students list
    if (user.role === 'Student Assistant') {
      const student = {
        id: (students.length + 1).toString(),
        userId: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        status: 'Active',
        totalHours: 0,
        phone: user.phone || '',
        address: user.address || user.department,
        avatar: user.avatar || `https://picsum.photos/seed/${user.name}/200`
      };
      setStudents([...students, student]);
    }
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
    setStudents(students.filter(s => s.userId !== id));
  };

  const handleLogin = (user) => {
    // Set user from backend API response
    setCurrentUser(user);
    setRole(user.role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    // Clear browser's form restoration cache
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', window.location.href);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleViewProfile = (user) => {
    setViewedUser(user);
    setActiveTab('profile');
  };

  const handleRoleChange = (updatedUser) => {
    // Update the users list
    setUsers(users.map(u => (u._id === updatedUser._id || u.id === updatedUser.id) ? updatedUser : u));
    
    // Refresh students list by filtering out users who are no longer Student Assistants
    setStudents(students.filter(s => updatedUser.role === 'Student Assistant' || s.userId !== (updatedUser._id || updatedUser.id)));
  };

  const handleViewStudent = (student) => {
    // Use populated userId field from backend (it contains full user object)
    // or fall back to looking up in users array if userId is just an ID string
    let actualUser;
    
    if (typeof student.userId === 'object' && student.userId !== null) {
      // userId is already a populated user object from backend
      actualUser = {
        ...student.userId,
        id: student.userId._id || student.userId.id
      };
    } else {
      // userId is a string ID, look it up in users array
      actualUser = users.find(u => u._id === student.userId || u.id === student.userId) || {
        id: student.userId || student.id,
        name: student.name,
        email: student.email,
        role: 'Student Assistant',
        department: student.department,
        phone: student.phone || '',
        address: student.address || student.department,
        avatar: student.avatar || `https://picsum.photos/seed/${student.name}/200`
      };
    }
    
    setViewedUser(actualUser);
    setActiveTab('profile');
  };

  const handleUpdateProfile = async (updatedUser) => {
    try {
      console.log('Updating profile with:', updatedUser);
      // Call API to update profile
      const response = await userAPI.updateMyProfile({
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        avatar: updatedUser.avatar,
      });

      console.log('Profile update response:', response);
      const userData = response.data.data;
      const userId = userData._id || userData.id;

      // Update React state
      setCurrentUser({ ...userData, id: userId });
      setUsers(users.map(u => (u._id === userId || u.id === userId) ? { ...userData, id: userId } : u));

      // Update localStorage
      localStorage.setItem('user', JSON.stringify({ ...userData, id: userId }));

      console.log('Profile saved successfully');
      alert('Profile saved successfully!');

      // Update viewedUser if viewing a profile (for supervisors viewing students)
      if (viewedUser && (viewedUser._id === userId || viewedUser.id === userId)) {
        setViewedUser({ ...userData, id: userId });
      }

      // Also update students data if applicable
      if (userData.role === 'Student Assistant') {
        setStudents(students.map(s => s.userId === userId || s.userId === userData._id ? {
          ...s,
          name: userData.name,
          email: userData.email,
          department: userData.department,
          phone: userData.phone || '',
          address: userData.address || '',
          avatar: userData.avatar
        } : s));
      }
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
      alert(`Failed to save profile: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRegister = async (user) => {
    // User data comes from backend API response
    setUsers([...users, user]);

    if (user.role === 'Student Assistant') {
      try {
        // Fetch the real student record from the backend instead of creating a fake one
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/students/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.data) {
          setStudents([...students, response.data.data]);
        }
      } catch (error) {
        console.error('Failed to fetch new student record:', error);
      }
    }
    
    setCurrentUser(user);
    setRole(user.role);
    setIsAuthenticated(true);
    setIsRegistering(false);
    setRefreshKey(prev => prev + 1);
  };

  // Filter data based on role and department
  // Filter data based on role and department
  const filteredStudents = students.filter(s => {
    if (role === 'Admin') return true;
    if (role === 'Supervisor') return s.department === currentUser?.department;
    return s.userId === currentUser?.id;
  });

  const filteredAttendance = attendance.filter(a => {
    // Admin sees all
    if (role === 'Admin') return true;
    
    // Student Assistant: backend already filters via /me endpoint
    if (role === 'Student Assistant') return true;
    
    // Supervisor: filter by department
    const recordStudentId = a.studentId?._id || a.studentId;
    const student = students.find(s => s._id === recordStudentId || s.id === recordStudentId);
    return student?.department === currentUser?.department;
  });

  const filteredTasks = tasks.filter(t => {
    if (role === 'Admin') return false; // Admin should not see tasks
    
    // For Student Assistants, the backend already filters tasks
    // So we just return all tasks (they should only be assigned to this student)
    if (role === 'Student Assistant') {
      return true;
    }
    
    if (role === 'Supervisor') {
      // Supervisors see tasks they assigned - get the assignedTo ID
      const assignedToId = typeof t.assignedTo === 'object' ? t.assignedTo?._id : t.assignedTo;
      
      // Find the student in the students array
      const student = students.find(s => {
        const studentId = s._id || s.id;
        return studentId === assignedToId || studentId?.toString() === assignedToId?.toString();
      });
      
      // Check if student is in supervisor's department
      return student?.department === currentUser?.department;
    }
    
    return false;
  });

  if (!isAuthenticated) {
    if (isRegistering) {
      return (
        <Register 
          onRegister={handleRegister} 
          onBackToLogin={() => setIsRegistering(false)} 
        />
      );
    }
    return (
      <Login 
        onLogin={handleLogin} 
        onShowRegister={() => setIsRegistering(true)} 
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-white font-sans text-slate-900 overflow-hidden">
      <Sidebar 
        role={role} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <Header activeTab={activeTab} currentTime={currentTime} onLogout={handleLogout} setActiveTab={setActiveTab} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <Dashboard key="dashboard" />
            )}

            {activeTab === 'profile' && (
              <Profile 
                key="profile" 
                user={viewedUser || currentUser} 
                onUpdateProfile={handleUpdateProfile} 
                isViewing={!!viewedUser}
                onClose={() => setViewedUser(null)}
              />
            )}

            {activeTab === 'accounts' && role === 'Admin' && (
              <Accounts 
                key="accounts" 
                users={users} 
                onAddUser={handleAddUser} 
                onDeleteUser={handleDeleteUser}
                onViewProfile={handleViewProfile}
                onRoleChange={handleRoleChange}
              />
            )}

            {activeTab === 'students' && (
              <Students 
                key="students" 
                students={filteredStudents.filter(s => 
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.department.toLowerCase().includes(searchQuery.toLowerCase())
                )} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                onAddStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
                role={role}
                onViewStudent={handleViewStudent}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'calendar' && (
              <Calendar 
                key="calendar"
                schedule={schedule}
                onUpdateSchedule={handleUpdateSchedule}
                role={role}
                user={currentUser}
              />
            )}

            {activeTab === 'tasks' && (
              <Tasks 
                key="tasks" 
                tasks={filteredTasks} 
                students={filteredStudents} 
                role={role} 
                currentUser={currentUser} 
                onAddTask={handleAddTask} 
                onUpdateTaskStatus={handleUpdateTaskStatus} 
                onDeleteTask={handleDeleteTask} 
              />
            )}

            {activeTab === 'attendance' && (
              <Attendance 
                key="attendance" 
                attendance={filteredAttendance} 
                currentTime={currentTime} 
                onTimeIn={async () => {
                  try {
                    const token = localStorage.getItem('auth_token');
                    console.log('⏱️ Time In clicked - fetching student record...');
                    // Fetch current user's student record
                    const studentRes = await axios.get(`${API_BASE_URL}/students/me`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    console.log('✅ Student record fetched:', studentRes.data.data);
                    if (studentRes.data.data) {
                      const student = studentRes.data.data;
                      handleTimeIn(student._id || student.id, student.name);
                    }
                  } catch (error) {
                    console.error('❌ Failed to fetch student record:', error.message);
                    console.error('Response error:', error.response?.data);
                    const errorMsg = error.response?.data?.message || error.message;
                    alert(`Student record error: ${errorMsg}`);
                  }
                }}
                onTimeOut={(recordId) => handleTimeOut(recordId)}
                onDelete={(recordId) => handleDeleteAttendance(recordId)}
                role={role}
                schedule={schedule}
              />
            )}

            {activeTab === 'reports' && (
              <Reports 
                key="reports" 
                reports={reports} 
                role={role} 
                onSubmitReport={handleSubmitReport}
                onUpdateStatus={handleUpdateReportStatus}
              />
            )}
          </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}