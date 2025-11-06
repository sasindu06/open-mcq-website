// app/dashboard/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../lib/axios';
import { FileText, Target, TrendingUp, Trophy, History, Calendar, CheckCircle, Coffee, Sun, Moon, Zap, Loader2, PieChart, BarChart } from 'lucide-react';

// --- Chart.js Imports (Unchanged) ---
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// --- Import useTheme (Unchanged) ---
import { useTheme } from '../../context/ThemeContext'; //

// --- Register Chart.js components (Unchanged) ---
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// --- UserStats type (Unchanged) ---
type UserStats = {
  totalAttempts: number;
  highestScore: string;
  averageScore: string;
  rank: string;
  award: string;
  scoreDistribution: { [key: string]: number };
  subjectAverages: { subject: string; average: number; count: number }[];
};

// --- AttemptHistoryEntry type (Unchanged) ---
interface AttemptHistoryEntry {
  _id: string;
  grade: string;
  subject: string;
  year: number;
  score: number;
  totalQuestions: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // --- THE FIX: Use `isDark` (boolean) instead of `theme` (string) ---
  const { isDark } = useTheme(); //

  // State (Unchanged)
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<AttemptHistoryEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- getGreeting (Unchanged) ---
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    const userName = user?.firstName || 'User';
    if (currentHour >= 0 && currentHour < 4) {
      return { message: `Still awake, ${userName}?`, quote: "The early bird... or the dedicated night owl? 🦉", icon: <Moon className="h-6 w-6 text-indigo-400" /> };
    } else if (currentHour >= 4 && currentHour < 12) {
      return { message: `Good morning, ${userName}!`, quote: "Let's get some questions done! ☕", icon: <Coffee className="h-6 w-6 text-yellow-500" /> };
    } else if (currentHour >= 12 && currentHour < 18) {
      return { message: `Good afternoon, ${userName}!`, quote: "Keep up the great work! 💪", icon: <Sun className="h-6 w-6 text-orange-500" /> };
    } else {
      return { message: `Good evening, ${userName}!`, quote: "Time for a final review session? 📚", icon: <Zap className="h-6 w-6 text-purple-500" /> };
    }
  };
  // -------------------------------------

  // --- useEffect (Unchanged) ---
  useEffect(() => {
    if (!isAuthLoading && user) {
        const fetchData = async () => {
          setIsLoadingData(true);
          setError(null);
          try {
            const [statsResponse, attemptsResponse] = await Promise.all([
              axiosInstance.get<UserStats>('/users/stats'),
              axiosInstance.get<AttemptHistoryEntry[]>('/users/attempts')
            ]);
            setStats(statsResponse.data);
            setRecentAttempts(attemptsResponse.data.slice(0, 5));
          } catch (err: any) {
            console.error("Failed to fetch dashboard data:", err);
            const errorMsg = err.response?.data?.message || err.message || "Could not load dashboard data. Please try again later.";
            setError(errorMsg);
          } finally {
            setIsLoadingData(false);
          }
        };
        fetchData();
    } else if (!isAuthLoading && !user) {
        setIsLoadingData(false);
    }
  }, [user, isAuthLoading]);

  // --- formatDate (Unchanged) ---
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit'
      });
    } catch (e) {
        return "Invalid Date";
    }
  };

  // --- Loading/Error UI (Unchanged) ---
  if (isAuthLoading) {
    return (
        <Layout>
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-900 dark:text-white" />
                <p className="ml-3 text-gray-900 dark:text-white">Loading dashboard...</p>
            </div>
        </Layout>
    );
  }
  if (!user) {
    return (
        <Layout>
            <div className="p-4 md:p-8">
                <p className="text-red-500 dark:text-red-400">
                    User not found. Please log in.
                </p>
            </div>
        </Layout>
    );
  }

  const greeting = getGreeting();

  // --- renderStats (Unchanged) ---
  const renderStats = () => {
    if (isLoadingData && !stats) {
       return (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl p-6 h-36"></div>
            ))}
         </div>
       );
    }
    if (error && !stats && !isLoadingData) {
        return <p className="text-center text-red-500 mb-8">Could not load statistics.</p>;
    }
    if (!stats && !isLoadingData) {
       return <p className="text-center text-gray-500 mb-8">Statistics are currently unavailable.</p>;
    }
    if (!stats) return null;
    const statsCards = [
      { icon: FileText, label: 'Total Attempts', value: stats.totalAttempts, color: 'blue' },
      { icon: Target, label: 'Highest Score', value: stats.highestScore, color: 'green' },
      { icon: TrendingUp, label: 'Average Score', value: stats.averageScore, color: 'purple' },
      { icon: Trophy, label: 'Award', value: stats.award || 'None', color: 'yellow' }
    ];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl dark:hover:shadow-blue-900/30 hover:scale-[1.03] transition-all duration-200"
          >
            <div className={`inline-flex p-3 rounded-lg mb-4 ${
              stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400' :
              stat.color === 'green' ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
              stat.color === 'purple' ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' :
              'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400'
            }`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm mb-1 text-gray-600 dark:text-gray-400">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    );
  };
  
  // --- renderRecentAttempts (Unchanged) ---
  const renderRecentAttempts = () => {
      if (isLoadingData && recentAttempts.length === 0) {
        return <p className="p-6 text-gray-500 dark:text-gray-400">Loading recent attempts...</p>;
      }
       if (error && recentAttempts.length === 0 && !isLoadingData) {
          return <p className="p-6 text-red-500 dark:text-red-400">Could not load recent attempts.</p>;
       }
      if (recentAttempts.length === 0 && !isLoadingData) {
        return <p className="p-6 text-gray-500 dark:text-gray-400">No recent attempts found.</p>;
      }
      return (
         <div className="flow-root">
            <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentAttempts.map((attempt) => (
                    <li key={attempt._id} className="py-4 px-1 sm:px-0">
                       <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                   <History size={18} />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">
                                    {attempt.subject} - {attempt.year} <span className="font-normal text-gray-500 dark:text-gray-400">({attempt.grade})</span>
                                </p>
                                <p className="text-sm text-gray-500 truncate dark:text-gray-400 flex items-center gap-1.5 mt-1">
                                    <Calendar size={13} /> {formatDate(attempt.createdAt)}
                                </p>
                            </div>
                            <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                                 {attempt.score} / {attempt.totalQuestions}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      );
  };

  // --- UPDATED: Chart Rendering Components ---

  const renderScoreDistribution = () => {
    if (isLoadingData) {
        return <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>;
    }
    if (!stats || !stats.scoreDistribution) {
        return <p className="text-gray-500 text-center p-4">No score data available.</p>;
    }

    const labels = ['A (90-100%)', 'B (80-89%)', 'C (70-79%)', 'D (60-69%)', 'F (<60%)'];
    const dataValues = [
        stats.scoreDistribution['A'],
        stats.scoreDistribution['B'],
        stats.scoreDistribution['C'],
        stats.scoreDistribution['D'],
        stats.scoreDistribution['F'],
    ];

    if (dataValues.every(val => val === 0)) {
         return <p className="text-gray-500 text-center p-4">Complete an attempt to see your score distribution.</p>;
    }
    
    // --- THE FIX: Check `isDark` (boolean) ---
    const textColor = isDark ? '#fff' : '#374151';
    const pieBorderColor = isDark ? '#1f2937' : '#ffffff'; // Match card bg (dark:bg-gray-800)

    const data = {
        labels: labels,
        datasets: [{
            label: 'Attempts',
            data: dataValues,
            backgroundColor: [
                'rgba(59, 130, 246, 0.7)', // Blue-500
                'rgba(34, 197, 94, 0.7)', // Green-500
                'rgba(234, 179, 8, 0.7)',  // Yellow-500
                'rgba(249, 115, 22, 0.7)', // Orange-500
                'rgba(239, 68, 68, 0.7)',  // Red-500
            ],
            borderColor: pieBorderColor, // Use dynamic border color
            borderWidth: 2,
        }],
    };
    
    return (
        <div className="relative h-64 md:h-80">
            <Pie 
              data={data}
              options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: {
                          position: 'top' as const,
                          labels: {
                            color: textColor // Use dynamic text color
                          }
                      }
                  }
              }}
              // --- NEW: Add key to force re-render on theme change ---
              key={isDark ? 'pie-dark' : 'pie-light'}
            />
        </div>
    );
  };
  
  const renderSubjectAverages = () => {
      if (isLoadingData) {
          return <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>;
      }
      if (!stats || !stats.subjectAverages || stats.subjectAverages.length === 0) {
          return <p className="text-gray-500 text-center p-4">Complete an attempt to see your subject averages.</p>;
      }

      const labels = stats.subjectAverages.map(s => s.subject);
      const dataValues = stats.subjectAverages.map(s => s.average);
      
      // --- THE FIX: Check `isDark` (boolean) ---
      const textColor = isDark ? '#fff' : '#374151';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

      const data = {
          labels,
          datasets: [{
              label: 'Average Score (%)',
              data: dataValues,
              backgroundColor: 'rgba(139, 92, 246, 0.7)', // Purple-500
              borderColor: 'rgba(139, 92, 246, 1)',
              borderWidth: 1,
          }],
      };
      
      return (
          <div className="relative h-64 md:h-80">
              <Bar
                  data={data}
                  options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y' as const,
                      scales: {
                          x: {
                              beginAtZero: true,
                              max: 100,
                              ticks: {
                                color: textColor // Use dynamic text color
                              },
                              grid: {
                                color: gridColor // Use dynamic grid color
                              }
                          },
                          y: {
                              ticks: {
                                color: textColor // Use dynamic text color
                              },
                              grid: {
                                display: false
                              }
                          }
                      },
                      plugins: {
                          legend: {
                              display: false
                          }
                      }
                  }}
                  // --- NEW: Add key to force re-render on theme change ---
                  key={isDark ? 'bar-dark' : 'bar-light'}
              />
          </div>
      );
  };
  // ---------------------------------


  // --- Page Return (Unchanged) ---
  return (
    <Layout>
      {/* --- Greeting Card --- */}
      <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 shadow p-6 flex items-center space-x-4">
        <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
          {greeting.icon}
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {greeting.message}
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {greeting.quote}
          </p>
        </div>
      </div>
      {/* --- End Greeting Card --- */}


       {/* Display general error */}
       {error && !isLoadingData && <p className="text-center text-red-500 mb-4">{error}</p>}

      {/* --- Render Stats --- */}
      {renderStats()}

      {/* --- Render Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Score Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <PieChart size={20}/> Score Distribution
                </h2>
            </div>
            <div className="p-5">
                {renderScoreDistribution()}
            </div>
        </div>
        
        {/* Subject Averages Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart size={20}/> Average Score by Subject
                </h2>
            </div>
            <div className="p-5">
                {renderSubjectAverages()}
            </div>
        </div>

      </div>
      {/* --- End Charts --- */}


      {/* --- Render Recent Attempts --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mt-8">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History size={20}/> Recent Attempts
            </h2>
            </div>
            <div className="px-5 py-2">
                {renderRecentAttempts()}
            </div>
             {recentAttempts.length > 0 && !isLoadingData && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 text-center border-t dark:border-gray-700">
                      <a href="/history" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                          View All Attempts &rarr;
                      </a>
                  </div>
             )}
        </div>
      {/* --- End Recent Attempts --- */}

    </Layout>
  );
}