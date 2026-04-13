import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, Mail, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from './ui/card';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const Register = ({ onRegister, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const defaultDepartments = [
    { name: 'College of Education', code: 'COE' },
    { name: 'College of Engineering', code: 'CENG' },
    { name: 'College of Industrial Technology', code: 'CIT' },
    { name: 'College of Information and Computing Sciences', code: 'CICS' }
  ];

  // Fetch departments from database
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${API_URL}/departments`);
        let deptList = [];
        
        if (response.data.success && response.data.data?.length > 0) {
          deptList = response.data.data;
          console.log('📚 Departments fetched from database:', response.data.data);
        }
        
        // Combine with default departments to show all options
        const allDepts = [...deptList, ...defaultDepartments];
        
        // Deduplicate by name
        const uniqueDepts = Array.from(
          new Map(allDepts.map(d => [d.name, d])).values()
        );
        
        setDepartments(uniqueDepts);
        console.log('📚 Combined departments:', uniqueDepts);
      } catch (error) {
        console.error('Error fetching departments, using defaults:', error);
        // Fallback to default departments if API fails
        setDepartments(defaultDepartments);
      } finally {
        setLoadingDepts(false);
      }
    };
    
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call backend register endpoint
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.department,
        role: 'Student Assistant' // Default role for new users
      });
      
      const { token, data } = response.data;
      const user = { ...data, id: data.userId };
      
      // Store token and user
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Call onRegister with user data
      onRegister(user);
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-white flex flex-row overflow-hidden">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 bg-white flex items-start justify-center p-4 md:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-4"
        >
          <div className="text-center mb-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-14 h-14 mx-auto mb-3 rounded-full overflow-hidden shadow-xl"
            >
              <img src="/university-seal.jpg" alt="University Logo" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="text-slate-600 mt-2 text-sm">Join SIAS - Student Assistant Information System</p>
          </div>

          <Card className="p-6 bg-white border border-slate-200 shadow-xl">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon-500" size={16} />
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent transition-all text-sm text-slate-900 placeholder-slate-500"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon-500" size={16} />
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent transition-all text-sm text-slate-900 placeholder-slate-500"
                    placeholder="name@univ.edu"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Department
                </label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon-500" size={16} />
                  <select
                    name="department"
                    required
                    disabled={loadingDepts}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent transition-all text-sm text-slate-900 appearance-none disabled:opacity-50"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">
                      {loadingDepts ? 'Loading departments...' : 'Select Department'}
                    </option>
                    {departments.map((dept) => (
                      <option key={dept._id || dept.name} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon-500" size={16} />
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent transition-all text-sm text-slate-900 placeholder-slate-500"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Confirm
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon-500" size={16} />
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent transition-all text-sm text-slate-900 placeholder-slate-500"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-maroon-600 to-maroon-500 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl hover:from-maroon-700 hover:to-maroon-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-200 text-center">
              <button 
                onClick={onBackToLogin}
                className="text-xs font-bold text-slate-600 hover:text-maroon-600 transition"
              >
                Already have an account? <span className="text-maroon-600">Sign In</span>
              </button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Right Side - Design Panel */}
      <div className="hidden md:flex md:w-1/2 h-full bg-gradient-to-br from-maroon-600 to-maroon-800 items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative elements with gold accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-400 rounded-full opacity-10 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-300 rounded-full opacity-8 -ml-40 -mb-40"></div>
        <div className="absolute top-20 right-20 w-32 h-32 border-2 border-gold-400 rounded-full opacity-20"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 text-center text-white max-w-md"
        >
          <div className="mb-8">
            <h2 className="text-5xl font-bold mb-4 text-gold-300">Join Us</h2>
            <p className="text-gold-200 text-lg">Become part of our community</p>
          </div>

          <div className="space-y-6 mt-12">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-300 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-gold-300" />
              </div>
              <div className="text-left">
                <p className="font-bold mb-1">Quick Setup</p>
                <p className="text-gold-100 text-sm">Get started in minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-300 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} className="text-gold-300" />
              </div>
              <div className="text-left">
                <p className="font-bold mb-1">Secure & Safe</p>
                <p className="text-gold-100 text-sm">Your data is protected</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-300 flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-gold-300" />
              </div>
              <div className="text-left">
                <p className="font-bold mb-1">Support Ready</p>
                <p className="text-gold-100 text-sm">Help when you need it</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

