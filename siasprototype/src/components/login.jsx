import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, User, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from './ui/card';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const Login = ({ onShowRegister, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Clear form on component mount
  useEffect(() => {
    // Clear React state
    setEmail('');
    setPassword('');
    setError(null);
    
    // Clear browser's form restoration cache
    sessionStorage.clear();
    
    // Reset HTML form element
    if (formRef.current) {
      formRef.current.reset();
    }
    
    // Force clear input fields immediately and with delays
    const clearInputs = () => {
      if (emailRef.current) {
        emailRef.current.value = '';
      }
      if (passwordRef.current) {
        passwordRef.current.value = '';
      }
      setEmail('');
      setPassword('');
    };
    
    clearInputs();
    setTimeout(clearInputs, 0);
    setTimeout(clearInputs, 50);
    setTimeout(clearInputs, 100);
  }, []);

  const handlePasswordFocus = (e) => {
    // Clear any autofilled value when focused
    e.target.value = '';
    setPassword('');
  };

  const handleEmailFocus = (e) => {
    // Clear any autofilled value when focused
    e.target.value = '';
    setEmail('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Call backend login endpoint
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, data } = response.data;
      const user = { ...data, id: data.userId };
      
      // Store token in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Clear form data
      setEmail('');
      setPassword('');
      
      // Call onLogin with user data
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-white flex flex-row overflow-hidden">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden shadow-xl"
            >
              <img src="/university-seal.jpg" alt="University Logo" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-600 text-sm">Sign in to your account to continue</p>
          </div>

          <Card className="p-8 bg-white shadow-xl border border-slate-200">
            {(error) && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
            <form ref={formRef} onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon-500" size={18} />
                  <input
                    ref={emailRef}
                    type="email"
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    onFocus={handleEmailFocus}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent transition-all text-sm text-slate-900 placeholder-slate-500"
                    placeholder="name@univ.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon-500" size={18} />
                  <input
                    ref={passwordRef}
                    type="password"
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                    onFocus={handlePasswordFocus}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent transition-all text-sm text-slate-900 placeholder-slate-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-2 border-slate-300 text-maroon-600 focus:ring-maroon-500 w-4 h-4" />
                  <span className="text-xs text-slate-700 font-medium">Remember me</span>
                </label>
                <a href="#" className="text-xs font-bold text-maroon-600 hover:text-maroon-700 transition">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-maroon-600 to-maroon-500 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl hover:from-maroon-700 hover:to-maroon-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <button 
                onClick={onShowRegister}
                className="text-xs font-bold text-slate-600 hover:text-maroon-600 transition"
              >
                Don't have an account? <span className="text-maroon-600">Register</span>
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
            <h2 className="text-5xl font-bold mb-2 text-gold-300">SAIS</h2>
            <p className="text-gold-200 text-lg">Student Assistant Information System</p>
          </div>

          <div className="space-y-6 mt-12">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-300 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} className="text-gold-300" />
              </div>
              <div className="text-left">
                <p className="font-bold mb-1">Secure & Reliable</p>
                <p className="text-gold-100 text-sm">Enterprise-grade security for your data</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-300 flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-gold-300" />
              </div>
              <div className="text-left">
                <p className="font-bold mb-1">Easy Management</p>
                <p className="text-gold-100 text-sm">Streamlined interface for all roles</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-300 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={20} className="text-gold-300" />
              </div>
              <div className="text-left">
                <p className="font-bold mb-1">Real-time Tracking</p>
                <p className="text-gold-100 text-sm">Monitor attendance and tasks in real-time</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

