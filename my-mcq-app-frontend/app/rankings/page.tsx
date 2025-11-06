// app/rankings/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout'; // Adjust path if needed
import axiosInstance from '../../lib/axios'; // Adjust path if needed
import { Trophy, ShieldCheck, Award, Star } from 'lucide-react'; // Icons for awards

// Define the shape of a single leaderboard entry
interface LeaderboardEntry {
  userId: string; // Although not displayed, it might be useful later
  name: string;
  award: 'None' | 'Silver' | 'Gold' | 'Platinum';
  averageScore: number; // Backend sends this as a percentage
}

export default function RankingsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data when the component mounts
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get<LeaderboardEntry[]>('/users/leaderboard');
        setLeaderboard(response.data);
      } catch (err: any) {
        console.error("Failed to fetch leaderboard:", err);
        setError(err.response?.data?.message || "Could not load rankings. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []); // Empty dependency array means this runs once on mount

  // Helper function to get medal icon/color based on award
  const getAwardVisuals = (award: LeaderboardEntry['award']) => {
    switch (award) {
      case 'Platinum':
        return { icon: <Trophy size={18} />, color: 'text-cyan-400', label: 'Platinum' };
      case 'Gold':
        return { icon: <Award size={18} />, color: 'text-yellow-400', label: 'Gold' };
      case 'Silver':
        return { icon: <Star size={18} />, color: 'text-gray-400', label: 'Silver' };
      default:
        return { icon: <ShieldCheck size={18} />, color: 'text-gray-500', label: 'None' };
    }
  };

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Loading rankings...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500 dark:text-red-400 mt-8">{error}</p>;
    }

    if (leaderboard.length === 0) {
      return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No ranking data available yet. Take some quizzes!</p>;
    }

    return (
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-6">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Award
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Avg. Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboard.map((entry, index) => {
              const awardVisuals = getAwardVisuals(entry.award);
              return (
                <tr key={entry.userId || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {entry.name}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${awardVisuals.color}`}>
                    <span className='flex items-center gap-2'>
                       {awardVisuals.icon}
                       {awardVisuals.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-semibold">
                    {entry.averageScore.toFixed(1)}% {/* Display score as percentage */}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Layout>
      {/* Title Section */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white flex items-center justify-center gap-3">
          <Trophy className="text-yellow-500" /> Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          See how you stack up against other learners based on average score.
        </p>
      </div>

      {/* Leaderboard Content */}
      {renderContent()}

    </Layout>
  );
}