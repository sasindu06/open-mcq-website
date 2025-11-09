// app/papers/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import axiosInstance from '../../lib/axios';
import { ChevronDown, ArrowRight, BookOpen, Calendar, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function PapersPage() {
  const router = useRouter(); // Get the router instance
  
  const [grades, setGrades] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const [isGradesLoading, setIsGradesLoading] = useState(true);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [isYearsLoading, setIsYearsLoading] = useState(false);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false); 
  
  const [apiError, setApiError] = useState<string | null>(null);

  // 1. Fetch initial grades on component mount
  useEffect(() => {
    const fetchGrades = async () => {
      console.log("--- FRONTEND v5: Fetching grades ---"); // New debug line
      setIsGradesLoading(true);
      setApiError(null);
      try {
        const response = await axiosInstance.get('/papers/filters');
        setGrades(response.data.grades || []);
        console.log("--- FRONTEND v5: Grades loaded:", response.data.grades); // New debug line
      } catch (err) {
        setApiError('Failed to load grade options. Please try again later.');
        console.error(err);
      } finally {
        setIsGradesLoading(false);
      }
    };
    fetchGrades();
  }, []); // Runs only once on mount

  // 2. Fetch subjects *whenever selectedGrade changes*
  useEffect(() => {
    if (!selectedGrade) {
      setSubjects([]);
      return;
    }
    
    // --- THIS IS THE KEY FUNCTION ---
    const fetchSubjects = async () => {
      console.log(`--- FRONTEND v5: Grade changed to "${selectedGrade}". Fetching subjects... ---`); // New debug line
      setIsSubjectsLoading(true);
      setApiError(null);
      try {
        const response = await axiosInstance.get(`/papers/filters?grade=${selectedGrade}`);
        setSubjects(response.data.subjects || []);
        console.log("--- FRONTEND v5: Subjects loaded:", response.data.subjects); // New debug line
      } catch (err) {
        setApiError('Failed to load subject options. Please try again later.');
        console.error("--- FRONTEND v5 ERROR fetching subjects:", err); // New debug line
      } finally {
        setIsSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, [selectedGrade]); // This hook depends on selectedGrade

  // 3. Fetch years *whenever selectedSubject or selectedGrade changes*
  useEffect(() => {
    if (!selectedGrade || !selectedSubject) {
      setYears([]);
      return;
    }

    const fetchYears = async () => {
      console.log(`--- FRONTEND v5: Subject changed to "${selectedSubject}". Fetching years... ---`); // New debug line
      setIsYearsLoading(true);
      setApiError(null);
      try {
        const response = await axiosInstance.get(`/papers/filters?grade=${selectedGrade}&subject=${selectedSubject}`);
        setYears(response.data.years || []);
        console.log("--- FRONTEND v5: Years loaded:", response.data.years); // New debug line
      } catch (err) {
        setApiError('Failed to load year options. Please try again later.');
        console.error("--- FRONTEND v5 ERROR fetching years:", err); // New debug line
      } finally {
        setIsYearsLoading(false);
      }
    };
    fetchYears();
  }, [selectedGrade, selectedSubject]); // This hook depends on both values

  // --- Handler Functions ---

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrade(e.target.value);
    setSelectedSubject('');
    setSelectedYear('');
    setSubjects([]); 
    setYears([]); 
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
    setSelectedYear('');
    setYears([]); 
  };

  const handleStartQuiz = async () => {
    if (!selectedGrade || !selectedSubject || !selectedYear) {
      alert("Please make all selections before starting.");
      return;
    }
    setApiError(null);
    setIsStartingQuiz(true); 

    try {
      const response = await axiosInstance.post('/papers/start', {
        grade: selectedGrade,
        subject: selectedSubject,
        year: selectedYear,
      });

      const { attemptId } = response.data;
      router.push(`/quiz/${attemptId}`);

    } catch (err: any) {
      console.error("Failed to start quiz:", err);
      setApiError(err.response?.data?.message || "Failed to start quiz. Please try again.");
      setIsStartingQuiz(false); 
    }
  };

  // --- JSX (Rendering) ---
  return (
    <Layout>
      {/* Title Section */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          Select Your Paper 📝
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose the grade, subject, and year to start your quiz.
        </p>
      </div>

      {/* Main Content Area */}
      {isGradesLoading ? ( 
        <p className="text-center text-gray-500">Loading paper options...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-10 mb-6 max-w-2xl mx-auto">
          
          {/* Grade Selection */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              <GraduationCap size={18} /> Grade Level
            </label>
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={handleGradeChange} // Use new handler
                className="w-full px-4 py-4 rounded-xl appearance-none cursor-pointer bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none pr-10"
              >
                <option value="">Select Grade Level</option>
                {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>

          {/* Subject Selection */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              <BookOpen size={18} /> Subject
            </label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={handleSubjectChange} 
                disabled={!selectedGrade || isSubjectsLoading} 
                className="w-full px-4 py-4 rounded-xl appearance-none cursor-pointer bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{isSubjectsLoading ? 'Loading...' : 'Select Subject'}</option>
                {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>

          {/* Year Selection */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              <Calendar size={18} /> Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)} 
                disabled={!selectedSubject || isYearsLoading} 
                className="w-full px-4 py-4 rounded-xl appearance-none cursor-pointer bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{isYearsLoading ? 'Loading...' : 'Select Year'}</option>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartQuiz}
            disabled={!selectedGrade || !selectedSubject || !selectedYear || isStartingQuiz} 
            className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isStartingQuiz ? "Starting..." : "Start Quiz"} <ArrowRight size={20} />
          </button>

          {/* Display API errors here */}
          {apiError && (
            <p className="text-center text-red-500 mt-4">{apiError}</p>
          )}
        </div>
      )}
    </Layout>
  );
}