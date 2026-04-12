import React, { useState, useEffect } from 'react';
import { Users, Clock, FileText, Clock3, Activity, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import axios from 'axios';

export const Dashboard = () => {
  const [health, setHealth] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/health`);
        setHealth(response.data);
      } catch (error) {
        console.error('Failed to fetch health status:', error);
        setHealth({
          status: 'error',
          services: {
            database: { status: 'unknown' },
            auth: { status: 'unknown' },
            reports: { status: 'unknown' },
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    // Refresh health status every 15 seconds
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard statistics from MongoDB
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDashboardData(response.data.data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setError('Failed to load dashboard data');
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Total Students', value: dashboardData?.stats?.totalStudents?.toString() || '-', icon: Users },
    { label: 'Active Today', value: dashboardData?.stats?.activeToday?.toString() || '-', icon: Clock },
    { label: 'Pending Reports', value: dashboardData?.stats?.pendingReports?.toString() || '-', icon: FileText },
    { label: 'Avg. Hours/Week', value: dashboardData?.stats?.averageHoursPerWeek?.toString() || '-', icon: Clock3 },
  ];

  const recentAttendance = dashboardData?.recentAttendance || [];

  const getStatusIcon = (status) => {
    if (status === 'healthy') return <CheckCircle2 size={14} className="text-emerald-600" />;
    if (status === 'unhealthy') return <AlertCircle size={14} className="text-red-600" />;
    return <AlertCircle size={14} className="text-amber-600" />;
  };

  const getStatusColor = (status) => {
    if (status === 'healthy') return 'text-emerald-600';
    if (status === 'unhealthy') return 'text-red-600';
    return 'text-amber-600';
  };

  const services = [
    { label: 'Database', key: 'database', icon: '🗄️' },
    { label: 'Auth Service', key: 'auth', icon: '🔐' },
    { label: 'Reports', key: 'reports', icon: '📊' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">Overview of student assistant activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="rounded-2xl shadow-sm hover:shadow-lg transition border-l-4 border-l-gold-500 border-slate-100 bg-white hover:border-l-8">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-maroon-50 to-maroon-100 text-maroon-600 rounded-xl flex-shrink-0 border-2 border-gold-300">
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-600">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Attendance */}
        <Card className="lg:col-span-2 rounded-2xl shadow-sm border-slate-100 bg-white">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-900">Recent Attendance</h2>
              <button className="text-sm text-maroon-600 hover:underline font-medium">View All</button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentAttendance.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-sm">No attendance records</p>
                </div>
              ) : (
                recentAttendance.map((record) => (
                  <div key={record._id || record.id} className="flex justify-between items-center p-6 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-maroon-100 text-maroon-600 flex items-center justify-center text-xs font-bold">
                        {record.studentName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{record.studentName}</p>
                        <p className="text-xs text-slate-400">{record.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{record.timeIn}</p>
                        <span className="text-slate-400">In</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{record.timeOut || '--:--'}</p>
                        <span className="text-slate-400">Out</span>
                      </div>
                      <Badge variant={record.timeOut && record.timeOut !== '--:--' ? 'default' : 'secondary'}>
                        {record.timeOut && record.timeOut !== '--:--' ? 'Completed' : 'On Duty'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Status */}
          <Card className="rounded-2xl shadow-sm border-slate-100 bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900">System Status</h3>
                {loading && <Loader size={16} className="text-maroon-600 animate-spin" />}
              </div>
              <div className="space-y-3">
                {health ? (
                  services.map((service) => {
                    const serviceData = health.services?.[service.key];
                    const status = serviceData?.status || 'unknown';
                    return (
                      <div key={service.key} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span>{service.icon}</span>
                          <span className="text-sm text-slate-600">{service.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className={`text-xs font-medium capitalize ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-400 text-sm py-4">
                    Unable to load status
                  </div>
                )}
              </div>
              {health?.totalResponseTime && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Response time: {health.totalResponseTime}ms
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </motion.div>
  );
};

