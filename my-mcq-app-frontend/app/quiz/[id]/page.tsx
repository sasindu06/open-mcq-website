// app/quiz/[id]/page.tsx

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '../../../lib/axios';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock, BookOpen, Loader2, AlertTriangle, Home, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

// --- Interfaces ---
interface OptionData { text: string | null; imageUrl: string | null; }
interface QuestionData {
  questionId: string; questionText: string; options: OptionData[];
  userAnswer: string | null; contextImageUrl?: string | null; contextText?: string | null;
}
interface AttemptDetails {
  _id: string; grade: string; subject: string; year: number;
  totalQuestions: number; questions: QuestionData[];
}
interface ReviewItem {
  questionId: string; questionText: string; yourAnswer: string;
  correctAnswer: string; isCorrect: boolean;
}
interface SubmissionResult {
  message: string; score: number; totalQuestions: number; reviewData: ReviewItem[];
}
// --------------------

const TIME_PER_QUESTION_SECONDS = 90;

const formatTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || totalSeconds < 0) { return '00:00'; }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const attemptId = params.id as string;

  const [attemptData, setAttemptData] = useState<AttemptDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<SubmissionResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Fetch attempt details ---
  useEffect(() => {
    if (!attemptId) { setError("No attempt ID provided."); setIsLoading(false); return; }
    const fetchAttemptData = async () => {
      setIsLoading(true); setError(null);
      try {
        const response = await axiosInstance.get<AttemptDetails>(`/attempts/${attemptId}`);
        const data = response.data;
        if (!data || !data.questions || data.questions.length === 0) {
             setError("This quiz attempt has no questions."); setIsLoading(false); return;
        }
        setAttemptData(data);
        if (data.totalQuestions > 0 && timeLeft === null) {
          const totalTime = data.totalQuestions * TIME_PER_QUESTION_SECONDS; setTimeLeft(totalTime);
        }
        const initialAnswers: { [key: string]: string } = {};
        data.questions.forEach(q => { if (q.userAnswer && q.userAnswer !== '') { initialAnswers[q.questionId] = q.userAnswer; } });
        setSelectedAnswers(initialAnswers);
      } catch (err: any) {
        console.error("Fetch err:", err);
        setError(err.response?.data?.message || "Failed to load quiz data.");
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      } finally { setIsLoading(false); }
    };
    fetchAttemptData();
  }, [attemptId]);
  // -------------------------

  // --- Countdown Timer Logic ---
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSubmitting || quizResult) {
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); } return;
    }
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = (prevTime || 0) - 1;
        if (newTime <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleSubmitQuiz(true); return 0;
        }
        return newTime;
      });
    }, 1000);
    return () => { if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); } };
  }, [timeLeft, isSubmitting, quizResult]);
  // -------------------------

  // --- Event Handlers ---
  const handleSelectAnswer = (questionId: string, option: OptionData) => {
      if (isSubmitting || quizResult) return;
      const valueToStore = option.text || option.imageUrl;
      if (valueToStore) { setSelectedAnswers(prev => ({ ...prev, [questionId]: valueToStore })); }
      else { console.warn("Clicked an empty option."); }
  };
  const handleNext = () => { if (attemptData && currentQuestionIndex < attemptData.totalQuestions - 1) { setCurrentQuestionIndex(prev => prev + 1); } };
  const handlePrevious = () => { if (currentQuestionIndex > 0) { setCurrentQuestionIndex(prev => prev - 1); } };
  const handleSubmitQuiz = async (autoSubmit = false) => {
      if (!attemptData || isSubmitting) return;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (!autoSubmit) setTimeLeft(0);
      const confirmation = autoSubmit ? true : confirm("Are you sure you want to submit your quiz?");
      if (!confirmation) { return; }
      setIsSubmitting(true); setError(null);
      const answersToSubmit = attemptData.questions.map(q => ({ questionId: q.questionId, userAnswer: selectedAnswers[q.questionId] || "" }));
      const submissionPayload = { attemptId: attemptData._id, answers: answersToSubmit, grade: attemptData.grade, subject: attemptData.subject, year: attemptData.year };
      try {
          const response = await axiosInstance.post<SubmissionResult>(`/attempts/submit`, submissionPayload);
          setQuizResult(response.data);
      } catch (err: any) {
          console.error("Submit err:", err);
          setError(err.response?.data?.message || "An error occurred during submission.");
          setIsSubmitting(false);
      }
  };
  // ----------------------

  // ======================== RENDER LOGIC ========================

  if (isLoading) {
    return ( <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900"> <Loader2 className="h-10 w-10 animate-spin text-blue-600" /> <p className="ml-3 text-lg text-gray-700 dark:text-gray-300">Loading Quiz...</p> </div> );
  }
  if (error && !quizResult && !isSubmitting) {
    return ( <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4"> <AlertTriangle className="h-12 w-12 text-red-500" /> <p className="mt-4 text-xl text-center text-red-600 dark:text-red-400 font-semibold">Error Loading Quiz</p> <p className="mt-2 text-center text-gray-700 dark:text-gray-300">{error}</p> <button onClick={() => router.push('/papers')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors" > Back to Papers </button> </div> );
  }
  if (!attemptData && !isLoading) {
       return ( <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4"> <AlertTriangle className="h-12 w-12 text-gray-500" /> <p className="mt-4 text-xl text-center text-gray-700 dark:text-gray-300">Could not find quiz data.</p> <button onClick={() => router.push('/papers')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors" > Back to Papers </button> </div> );
  }

  // --- Results Screen ---
  if (quizResult) {
    const scorePercentage = (quizResult.score / quizResult.totalQuestions) * 100;
    const scoreColor = scorePercentage >= 80 ? 'text-green-500' : scorePercentage >= 50 ? 'text-yellow-500' : 'text-red-500';
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400">Quiz Completed!</h1>
          <p className="text-center text-lg text-gray-600 dark:text-gray-300 mt-2">{attemptData?.subject} - {attemptData?.year}</p>
          <div className={`text-center my-8 p-6 bg-gray-100 dark:bg-gray-700 rounded-lg`}>
            <p className="text-sm uppercase text-gray-500 dark:text-gray-400">Your Score</p>
            <p className={`text-6xl font-bold ${scoreColor}`}>{quizResult.score} / {quizResult.totalQuestions}</p>
            <p className={`text-2xl font-semibold ${scoreColor}`}>({scorePercentage.toFixed(1)}%)</p>
          </div>
          <div className="flex justify-center gap-4 mb-8">
             <button onClick={() => router.push('/history')} className="flex items-center gap-2 px-5 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors" > View History </button>
             <button onClick={() => router.push('/papers')} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors" > <Home size={18} /> Back to Papers </button>
          </div>
          <div className="border-t dark:border-gray-600 pt-6">
            <h2 className="text-2xl font-semibold mb-4">Review Your Answers</h2>
            <div className="space-y-6">
              {quizResult.reviewData.map((item, index) => (
                <div key={item.questionId} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border dark:border-gray-600">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2"> Q{index + 1}: {item.questionText} </p>
                  <div className={`flex items-start gap-2 text-sm ${ item.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }`}>
                    {item.isCorrect ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" /> : <XCircle size={16} className="flex-shrink-0 mt-0.5" />}
                    <div>Your Answer: <span className="font-medium break-all">{item.yourAnswer || '(No answer)'}</span></div>
                  </div>
                  {!item.isCorrect && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1 ml-6">
                      <span className="flex-shrink-0">Correct Answer:</span> <span className="font-medium break-all">{item.correctAnswer}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  // ---------------------------------------------------------------------

  // --- Display Quiz Question Section ---
   if (!attemptData || !attemptData.questions || !attemptData.questions[currentQuestionIndex]) {
       return ( <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4"> <AlertTriangle className="h-12 w-12 text-gray-500" /> <p className="mt-4 text-xl text-center text-gray-700 dark:text-gray-300">Error loading question data.</p> </div> );
   }

  const currentQuestion = attemptData.questions[currentQuestionIndex];
  const currentQuestionId = currentQuestion.questionId;
  const selectedAnswerValue = selectedAnswers[currentQuestionId];
  const timerColor = timeLeft !== null && timeLeft <= 60 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 md:p-8">
      {/* --- FIX: Removed invalid comment --- */}
       <div className="text-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{attemptData.subject}</h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300">{attemptData.year} - {attemptData.grade}</p>
       </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          {/* --- FIX: Removed invalid comment --- */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-600">
             <div className="flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                <BookOpen size={20} />
                <span>Question {currentQuestionIndex + 1} / {attemptData.totalQuestions}</span>
             </div>
             <div className={`flex items-center gap-2 text-lg font-semibold ${timerColor}`}>
                <Clock size={20} />
                <span>{formatTime(timeLeft)}</span>
             </div>
          </div>
      
          {/* --- FIX: Removed invalid comment --- */}
          <h2 className="text-lg md:text-xl mb-4 font-medium whitespace-pre-wrap">
             {currentQuestion.questionText}
          </h2>
          
          {/* --- FIX: Removed invalid comment --- */}
          {(currentQuestion.contextImageUrl || currentQuestion.contextText) && (
            <div className="mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
              {currentQuestion.contextImageUrl && (
                <img src={currentQuestion.contextImageUrl} alt="Question Context" className="max-w-full h-auto rounded mx-auto border dark:border-gray-600" />
              )}
              {currentQuestion.contextText && (
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap italic"> {currentQuestion.contextText} </p>
              )}
            </div>
          )}

          {/* --- Options Mapping (Image size fix is still here) --- */}
          <div className="space-y-3 mt-4">
            {Array.isArray(currentQuestion.options) ? (
                currentQuestion.options.map((option, index) => {
                    const optionValue = option.text || option.imageUrl;
                    const isSelected = !!(optionValue && selectedAnswerValue === optionValue);
                    const isDisabled = isSubmitting || !!quizResult;
                    const buttonClasses = `w-full text-left p-3 md:p-4 rounded-lg transition-colors duration-150 border-2 disabled:opacity-70 whitespace-pre-wrap text-sm md:text-base flex items-start gap-3 ${
                        isSelected ? 'bg-blue-600 border-blue-700 text-white font-semibold shadow-md dark:bg-blue-600 dark:border-blue-700'
                          : 'bg-gray-100 border-transparent text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                    } ${isDisabled && !isSelected ? 'cursor-not-allowed opacity-60' : ''}`;

                    return (
                        <button key={index} onClick={() => handleSelectAnswer(currentQuestionId, option)} disabled={isDisabled || !optionValue} className={buttonClasses} >
                            <span className="font-semibold mt-0.5">{String.fromCharCode(65 + index)}) </span>
                            {option.text && ( <span className="flex-1">{option.text}</span> )}
                            {option.imageUrl && !option.text && (
                                <div className="mt-1 mb-1 w-full flex-1 flex justify-center">
                                    <img src={option.imageUrl} alt={`Option ${String.fromCharCode(65 + index)}`}
                                        className="max-h-20 w-auto rounded border dark:border-gray-600 object-contain" // Keep small image size
                                    />
                                </div>
                            )}
                        </button>
                    );
                })
            ) : ( <p className='text-sm text-red-500'>Error: Options data is invalid.</p> )}
          </div>
          {/* ----------------------------- */}

          {/* --- FIX: Removed invalid comment --- */}
          <div className="flex justify-between items-center mt-6 md:mt-8 pt-4 border-t dark:border-gray-600">
            <button onClick={handlePrevious} disabled={currentQuestionIndex === 0 || isSubmitting || !!quizResult} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50" >
              <ArrowLeft size={18} /> Previous
            </button>
            {currentQuestionIndex === attemptData.totalQuestions - 1 ? (
              <button onClick={() => handleSubmitQuiz(false)} disabled={isSubmitting || !!quizResult} className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors disabled:opacity-50 disabled:bg-green-800" >
                {isSubmitting ? ( <Loader2 className="h-5 w-5 animate-spin" /> ) : ( <>Submit Quiz <CheckCircle size={18} /></> )}
              </button>
            ) : (
              <button onClick={handleNext} disabled={isSubmitting || !!quizResult} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-50" >
                Next <ArrowRight size={18} />
              </button>
            )}
          </div>
          
          {error && isSubmitting && !quizResult && ( <p className="text-center text-red-500 dark:text-red-400 mt-4">{error}</p> )}
      </div>
    </div>
  );
}