import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCourseById, subscribeToLessons } from "../services/courseService";
import {
  subscribeToEnrollment,
  saveQuizAttempt,
} from "../services/enrollmentService";
import { awardQuizPassXP } from "../services/gamificationService";
import {
  Sparkles,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  BookOpen,
  Lock,
  Compass,
  Lightbulb,
  CheckSquare,
} from "lucide-react";

export default function QuizPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quiz Generation State
  const [numQuestions, setNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [questions, setQuestions] = useState([]);

  // Quiz Taking State
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [certificateId, setCertificateId] = useState(null);

  // AI Performance Coach State
  const [coachData, setCoachData] = useState(null);
  const [loadingCoach, setLoadingCoach] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login", { state: { from: { pathname: `/quiz/${courseId}` } } });
      return;
    }

    let unsubscribeLessons = () => {};
    let unsubscribeEnrollment = () => {};

    const loadData = async () => {
      try {
        setLoading(true);
        const courseData = await getCourseById(courseId);
        if (!courseData) {
          navigate("/courses");
          return;
        }
        setCourse(courseData);

        unsubscribeLessons = subscribeToLessons(courseId, (list) => {
          setLessons(list);
        });

        unsubscribeEnrollment = subscribeToEnrollment(currentUser.uid, courseId, (enr) => {
          setEnrollment(enr);
          if (enr?.quizPassed && enr?.certificateId) {
            setCertificateId(enr.certificateId);
          }
        });
      } catch (err) {
        console.error("Error loading quiz prerequisites:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      unsubscribeLessons();
      unsubscribeEnrollment();
    };
  }, [courseId, currentUser, navigate]);

  const completedLessons = enrollment?.completedLessons || [];
  const totalLessons = lessons.length;
  const isUnlocked = totalLessons > 0 && completedLessons.length >= totalLessons;

  // Generate AI Quiz via /api/generate-quiz
  const handleGenerateQuiz = async () => {
    setGenerationError("");
    setGenerating(true);
    setSubmitted(false);
    setSelectedAnswers({});
    setCoachData(null);

    try {
      let idToken = "";
      if (currentUser?.getIdToken) {
        try {
          idToken = await currentUser.getIdToken();
        } catch (tokenErr) {
          console.warn("Token fetch error:", tokenErr);
        }
      }

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken || "demo-token-bypass"}`,
        },
        body: JSON.stringify({
          courseTitle: course.title,
          description: course.description,
          lessonTitles: lessons.map((l) => l.title),
          numQuestions: Number(numQuestions),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.questions) {
        throw new Error(data.error || "Failed to generate AI questions. Please retry.");
      }

      setQuestions(data.questions);
    } catch (err) {
      console.error("AI quiz generation error:", err);
      setGenerationError(err.message || "An unexpected error occurred while contacting Gemma AI.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (qIdx, optionIdx) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optionIdx,
    }));
  };

  // Submit and Auto-Grade Quiz
  const handleSubmitQuiz = async () => {
    const unanswered = questions.some((_, idx) => selectedAnswers[idx] === undefined);
    if (unanswered) {
      alert("Please answer all questions before submitting your exam.");
      return;
    }

    setSubmitting(true);
    try {
      let correctCount = 0;
      const wrongList = [];

      questions.forEach((q, idx) => {
        const userChoice = selectedAnswers[idx];
        if (userChoice === q.correctIndex) {
          correctCount++;
        } else {
          wrongList.push({
            question: q.question,
            chosenAnswer: q.options[userChoice] || "No answer",
            correctAnswer: q.options[q.correctIndex] || "Correct answer",
          });
        }
      });

      const scorePercentage = Math.round((correctCount / questions.length) * 100);
      const isPass = scorePercentage >= 60;
      const currentAttempts = (enrollment?.attempts || 0) + 1;

      setQuizScore(scorePercentage);
      setPassed(isPass);
      setSubmitted(true);

      const result = await saveQuizAttempt({
        uid: currentUser.uid,
        courseId,
        score: scorePercentage,
        passed: isPass,
        attempts: currentAttempts,
        studentName: userProfile?.name || currentUser.displayName || "Learner",
        courseTitle: course.title,
      });

      if (result.certificateId) {
        setCertificateId(result.certificateId);
      }

      // Gamification: Award XP for passing quiz (+50 base, +25 bonus for >=90%)
      if (isPass) {
        await awardQuizPassXP(currentUser, scorePercentage, 1);
      }

      // Feature 2: Fetch AI Performance Coach if score is less than 100%
      if (scorePercentage < 100 && wrongList.length > 0) {
        fetchCoachFeedback(wrongList, scorePercentage);
      }
    } catch (err) {
      console.error("Submit quiz error:", err);
      alert("Failed to record exam results: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Call /api/ai-assist with mode "coach"
  const fetchCoachFeedback = async (wrongQuestions, score) => {
    setLoadingCoach(true);
    try {
      let idToken = "";
      if (currentUser?.getIdToken) {
        try {
          idToken = await currentUser.getIdToken();
        } catch (e) {
          console.warn("Token error:", e);
        }
      }

      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken || "demo-token-bypass"}`,
        },
        body: JSON.stringify({
          mode: "coach",
          courseTitle: course.title,
          wrongQuestions,
          score,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCoachData(data);
      }
    } catch (e) {
      console.warn("Could not load coach feedback:", e);
    } finally {
      setLoadingCoach(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium text-sm">Validating exam eligibility...</p>
        </div>
      </div>
    );
  }

  // Guard 1: Must be enrolled to take the quiz
  if (!enrollment) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-[#5624d0] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Enrollment Required</h2>
          <p className="text-sm text-gray-600 mt-2 mb-6 leading-relaxed">
            You must be enrolled in <strong>{course?.title || "this course"}</strong> before you can take the examination.
          </p>
          <Link
            to={`/course/${courseId}`}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#5624d0] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#401b9c] transition shadow-xs"
          >
            <span>Go to Course Enrollment</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Guard 2: Must complete all lessons before taking quiz (and course must have lessons)
  if (!isUnlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Exam Locked</h2>
          {totalLessons === 0 ? (
            <p className="text-sm text-gray-600 mt-2 mb-6 leading-relaxed">
              This course does not have any curriculum lessons published yet. Lessons must be authored before taking the final exam.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mt-2 mb-4 leading-relaxed">
                You must complete all <strong>{totalLessons} video lessons</strong> before unlocking the final AI comprehension exam.
              </p>
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 mb-6 border border-gray-200">
                Progress: {completedLessons.length} / {totalLessons} lessons marked complete
              </div>
            </>
          )}
          <Link
            to={`/learn/${courseId}`}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#5624d0] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#401b9c] transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Return to Lessons</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5624d0] bg-purple-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                AI Examination
              </span>
              {enrollment?.quizPassed && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Passed ({enrollment.score}%)
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {course.title}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Powered by Google Gemma 31B via NVIDIA NIM
            </p>
          </div>

          <Link
            to={`/learn/${courseId}`}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Classroom</span>
          </Link>
        </div>

        {/* State 1: Generation Screen */}
        {questions.length === 0 && !generating && (
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5624d0] to-purple-400 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/20">
              <Sparkles className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900">
              Ready to Prove Your Knowledge?
            </h2>
            <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">
              Our AI exam engine synthesizes custom questions strictly derived from your {totalLessons} curriculum modules. Pass with <strong>60% or higher</strong> to receive your verified digital certificate.
            </p>

            {generationError && (
              <div className="my-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex flex-col sm:flex-row items-start justify-between gap-3 text-left max-w-lg mx-auto">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-bold">Quiz Generation Notice</p>
                    <p className="text-xs text-red-600 mt-0.5">{generationError}</p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateQuiz}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs self-end sm:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <div className="w-full sm:w-auto">
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-semibold focus:ring-2 focus:ring-[#5624d0] focus:outline-none bg-white"
                >
                  <option value={5}>5 Questions (Express)</option>
                  <option value={10}>10 Questions (Comprehensive)</option>
                </select>
              </div>

              <button
                onClick={handleGenerateQuiz}
                className="w-full sm:w-auto px-6 py-3 bg-[#5624d0] hover:bg-[#401b9c] text-white rounded-xl font-bold text-sm transition shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{generationError ? "Retry AI Quiz Generation" : "Generate My AI Quiz"}</span>
              </button>
            </div>
          </div>
        )}

        {/* State 2: Generating Spinner */}
        {generating && (
          <div className="bg-white p-16 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="w-16 h-16 border-4 border-[#5624d0] border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="w-6 h-6 text-[#5624d0] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">
              Gemma is preparing your exam...
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Analyzing course lectures and formulating validated multiple-choice problems.
            </p>
          </div>
        )}

        {/* State 3: Quiz Questions List & Submissions */}
        {questions.length > 0 && !generating && (
          <div className="space-y-6">
            
            {/* Score Banner when Submitted */}
            {submitted && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border text-center animate-fadeIn ${
                  passed
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-red-50 border-red-200 text-red-950"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm ${
                    passed ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                  }`}
                >
                  {passed ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                </div>

                <span className="text-xs font-bold uppercase tracking-wider">
                  {passed ? "Exam Passed!" : "Exam Failed"}
                </span>

                <h2 className="text-3xl font-extrabold mt-1">
                  Your Score: {quizScore}%
                </h2>

                <p className="text-sm mt-2 max-w-md mx-auto">
                  {passed
                    ? "Congratulations! You successfully cleared the benchmark (60%). Your official verifiable certificate is ready."
                    : "You scored below the 60% passing threshold. Review the answer explanations and AI coaching below, then retake the exam with fresh questions."}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {passed && certificateId && (
                    <Link
                      to={`/certificate/${certificateId}`}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>View Official Certificate</span>
                    </Link>
                  )}

                  {!passed && (
                    <button
                      onClick={handleGenerateQuiz}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retake with New Questions</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Questions Form */}
            <div className="space-y-6">
              {questions.map((q, qIdx) => {
                const userChoice = selectedAnswers[qIdx];
                const isCorrect = userChoice === q.correctIndex;

                let borderStyle = "border-gray-200";
                if (submitted) {
                  borderStyle = isCorrect ? "border-emerald-300 bg-emerald-50/20" : "border-red-200 bg-red-50/20";
                }

                return (
                  <div
                    key={q.id || qIdx}
                    className={`bg-white p-6 sm:p-8 rounded-2xl border shadow-xs transition ${borderStyle}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-[#5624d0] font-bold text-xs flex items-center justify-center">
                          {qIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                          Question {qIdx + 1} of {questions.length}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#5624d0] border border-purple-200">
                        <Sparkles className="w-3 h-3" />
                        AI Generated
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mb-4">
                      {q.question}
                    </h3>

                    {/* Options */}
                    <div className="space-y-2.5">
                      {q.options.map((option, optIdx) => {
                        const isSelected = userChoice === optIdx;
                        const isCorrectOption = optIdx === q.correctIndex;

                        let optionStyle = "border-gray-200 bg-white hover:border-purple-300";

                        if (submitted) {
                          if (isCorrectOption) {
                            optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-400/30";
                          } else if (isSelected && !isCorrectOption) {
                            optionStyle = "border-red-400 bg-red-50 text-red-950 font-semibold";
                          } else {
                            optionStyle = "border-gray-200 opacity-60";
                          }
                        } else if (isSelected) {
                          optionStyle = "border-[#5624d0] bg-purple-50/70 text-[#5624d0] font-semibold ring-2 ring-[#5624d0]/20";
                        }

                        return (
                          <button
                            type="button"
                            key={optIdx}
                            disabled={submitted}
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 text-sm cursor-pointer ${optionStyle}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{option}</span>
                            </div>

                            {submitted && (
                              <div className="shrink-0">
                                {isCorrectOption && (
                                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Correct
                                  </span>
                                )}
                                {isSelected && !isCorrectOption && (
                                  <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                    <XCircle className="w-4 h-4 text-red-500" /> Your choice
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* AI Explanation when submitted */}
                    {submitted && (
                      <div className="mt-4 p-3.5 bg-gray-50 rounded-xl text-xs text-gray-700 border border-gray-200">
                        <span className="font-bold text-gray-900 block mb-0.5">
                          💡 AI Explanation:
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FEATURE 2: AI Performance Coach Card (Only if score < 100%) */}
            {submitted && quizScore < 100 && (
              <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50 rounded-2xl border-2 border-purple-200 p-6 sm:p-8 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#5624d0] text-white flex items-center justify-center font-bold shadow-sm">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5624d0] bg-purple-100 px-2 py-0.5 rounded-full">
                        Automated Diagnostic
                      </span>
                      <h3 className="text-lg font-extrabold text-gray-900">
                        AI Performance Coach
                      </h3>
                    </div>
                  </div>
                </div>

                {loadingCoach ? (
                  <div className="py-6 text-center text-xs text-gray-500">
                    <div className="w-6 h-6 border-2 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Gemma is diagnosing your conceptual gaps and assembling a study plan...</span>
                  </div>
                ) : coachData ? (
                  <div className="space-y-4 text-xs sm:text-sm text-gray-700">
                    {/* Weak Topics Chips */}
                    {coachData.weakTopics?.length > 0 && (
                      <div>
                        <span className="font-bold text-gray-900 block mb-1.5">
                          Identified Focus Areas:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {coachData.weakTopics.map((topic, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full font-semibold text-xs"
                            >
                              ⚠️ {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advice Paragraph */}
                    {coachData.advice && (
                      <div className="p-3.5 bg-white rounded-xl border border-purple-100 leading-relaxed text-gray-700">
                        <strong className="text-gray-900 block mb-1">
                          Coach Feedback:
                        </strong>
                        {coachData.advice}
                      </div>
                    )}

                    {/* 3-Step Study Plan */}
                    {coachData.studyPlan?.length > 0 && (
                      <div>
                        <strong className="text-gray-900 block mb-2">
                          Recommended 3-Step Study Plan:
                        </strong>
                        <div className="space-y-2">
                          {coachData.studyPlan.map((step, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200"
                            >
                              <span className="w-5 h-5 rounded-full bg-purple-100 text-[#5624d0] font-bold text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="leading-snug">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Review your missed questions above to master these concepts before re-testing.
                  </p>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            {!submitted && (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-xl z-20">
                <div className="text-xs text-gray-500">
                  {Object.keys(selectedAnswers).length} of {questions.length} questions answered
                </div>

                <button
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3 bg-[#5624d0] hover:bg-[#401b9c] text-white rounded-xl font-bold text-sm transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Evaluating..." : "Submit Examination"}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
