import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribeToStudentEnrollments } from "../services/enrollmentService";
import {
  subscribeToStudentAssignments,
  calculateAssignmentStatus,
} from "../services/assignmentService";
import {
  subscribeToUserGamification,
  BADGE_DEFINITIONS,
} from "../services/gamificationService";
import {
  BookOpen,
  Award,
  Clock,
  PlayCircle,
  CheckCircle,
  Flame,
  Compass,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribeEnrollments = () => {};
    let unsubscribeAssignments = () => {};
    let unsubscribeGamification = () => {};

    unsubscribeEnrollments = subscribeToStudentEnrollments(currentUser.uid, (list) => {
      setEnrollments(list);
      setLoading(false);
    });

    unsubscribeAssignments = subscribeToStudentAssignments(currentUser.uid, (list) => {
      setAssignments(list);
    });

    unsubscribeGamification = subscribeToUserGamification(currentUser.uid, (data) => {
      setGamification(data);
    });

    return () => {
      unsubscribeEnrollments();
      unsubscribeAssignments();
      unsubscribeGamification();
    };
  }, [currentUser]);

  const passedCertificatesCount = enrollments.filter((e) => e.quizPassed).length;

  // Helper for deadline countdown
  const getDeadlineText = (deadlineStr) => {
    if (!deadlineStr) return "No deadline set";
    const deadline = new Date(deadlineStr);
    deadline.setHours(23, 59, 59, 999);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "day" : "days"}`;
    } else if (diffDays === 0) {
      return "Due today!";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${diffDays} days (${deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#5624d0] to-[#7942ec] rounded-2xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Student Portal
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {userProfile?.name || currentUser?.displayName || "Learner"}! 🎓
            </h1>
            <p className="mt-2 text-purple-100 text-sm sm:text-base">
              Track your coursework progress, complete mandatory compliance training, and earn certified credentials.
            </p>
          </div>
          <div className="absolute right-6 -bottom-10 opacity-10 sm:opacity-20 pointer-events-none">
            <BookOpen className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* FEATURE 3: Gamification Header Strip (XP, Streak, Badges) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-purple-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
            {/* XP Counter */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#5624d0] flex items-center justify-center font-extrabold text-lg shadow-sm">
                ⚡
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Earned XP
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-[#5624d0]">
                  {gamification?.xp || 20} XP
                </span>
              </div>
            </div>

            {/* Streak Flame */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl shadow-sm">
                🔥
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Daily Streak
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-amber-600">
                  {gamification?.streak || 1} Days
                </span>
              </div>
            </div>
          </div>

          {/* Badges Earned */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
            <span className="text-xs font-bold text-gray-500 mr-1">Badges:</span>
            {(gamification?.badges?.length > 0
              ? gamification.badges
              : ["First Step", "Quiz Master"]
            ).map((badgeKey) => {
              const def = BADGE_DEFINITIONS[badgeKey];
              return (
                <div
                  key={badgeKey}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                    def?.color || "bg-purple-100 text-[#5624d0] border-purple-200"
                  }`}
                  title={def?.description}
                >
                  <span>{def?.icon || "🏆"}</span>
                  <span>{badgeKey}</span>
                </div>
              );
            })}
            <Link
              to="/leaderboard"
              className="text-xs font-bold text-[#5624d0] hover:underline ml-2"
            >
              Leaderboard &rarr;
            </Link>
          </div>
        </div>

        {/* Mandatory Training Section (Placed prominently above My Learning) */}
        {assignments.length > 0 && (
          <section className="bg-white rounded-2xl border-2 border-purple-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Mandatory Training
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                  Assigned Compliance & Skill Requirements
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Required curricula assigned by administrators with targeted deadlines
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {assignments.map((assignment) => {
                const statusInfo = calculateAssignmentStatus(assignment, enrollments);
                const isOverdue = statusInfo.status === "Overdue";
                const isCompleted = statusInfo.status === "Completed";
                const deadlineText = getDeadlineText(assignment.deadline);

                return (
                  <div
                    key={assignment.id}
                    className={`p-5 rounded-xl border flex flex-col justify-between transition ${
                      isOverdue
                        ? "border-red-300 bg-red-50/40"
                        : isCompleted
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-purple-200 bg-purple-50/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}
                        >
                          {statusInfo.status}
                        </span>

                        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className={isOverdue ? "text-red-700 font-bold" : ""}>
                            {deadlineText}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-snug mt-1">
                        {assignment.courseTitle}
                      </h3>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-200/60 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500 font-medium">
                        {isCompleted ? "Requirement satisfied" : "Pass AI Exam to certify"}
                      </span>

                      <Link
                        to={`/learn/${assignment.courseId}`}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                          isCompleted
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : isOverdue
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-[#5624d0] hover:bg-[#401b9c] text-white"
                        }`}
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>{isCompleted ? "Review" : "Start / Continue"}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Global Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#5624d0] flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Enrolled Courses</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{enrollments.length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">In Progress</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {enrollments.filter((e) => !e.quizPassed).length}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Certificates Earned</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {passedCertificatesCount} Verified
              </h3>
            </div>
          </div>
        </div>

        {/* My Learning Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">My Learning</h2>
              <p className="text-sm text-gray-500">Resume your enrolled lectures and exams</p>
            </div>
            <Link
              to="/courses"
              className="text-sm font-bold text-[#5624d0] hover:underline flex items-center gap-1"
            >
              <Compass className="w-4 h-4" />
              <span>Browse catalog</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <div className="w-8 h-8 border-3 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Loading your course enrollments...</span>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800">You haven't enrolled in any courses yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
                Explore our catalog of 35+ interactive courses with AI exams and verifiable certificates.
              </p>
              <Link
                to="/courses"
                className="bg-[#5624d0] hover:bg-[#401b9c] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition shadow-xs inline-flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Explore All Courses</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enr) => {
                const completedCount = enr.completedLessons?.length || 0;
                const percent = Math.min(100, Math.round((completedCount / Math.max(completedCount, 4)) * 100));

                return (
                  <div
                    key={enr.id}
                    className="flex flex-col justify-between p-5 rounded-2xl border border-gray-200 hover:border-purple-300 transition hover:shadow-md bg-white group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-[#5624d0] bg-purple-50 px-2 py-0.5 rounded">
                          Enrolled
                        </span>
                        {enr.quizPassed && (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                            <Award className="w-3.5 h-3.5" /> Certified ({enr.score}%)
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 text-base line-clamp-2 group-hover:text-[#5624d0] transition-colors leading-snug">
                        {enr.courseTitle}
                      </h3>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
                          <span>{completedCount} lessons completed</span>
                          <span>{enr.quizPassed ? "100%" : `${completedCount > 0 ? "In Progress" : "Not Started"}`}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              enr.quizPassed ? "bg-emerald-500" : "bg-[#5624d0]"
                            }`}
                            style={{
                              width: enr.quizPassed ? "100%" : `${Math.max(15, percent)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                      <Link
                        to={`/learn/${enr.courseId}`}
                        className="flex-1 py-2 px-3 bg-[#5624d0] hover:bg-[#401b9c] text-white text-xs font-bold rounded-lg transition text-center shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Continue</span>
                      </Link>

                      {enr.quizPassed && enr.certificateId ? (
                        <Link
                          to={`/certificate/${enr.certificateId}`}
                          className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition border border-emerald-200 flex items-center gap-1"
                          title="View Certificate"
                        >
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>Certificate</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/quiz/${enr.courseId}`}
                          className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-[#5624d0] text-xs font-bold rounded-lg transition border border-purple-200 flex items-center gap-1"
                          title="Take AI Quiz"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Quiz</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
