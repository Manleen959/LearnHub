import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  subscribeToTeacherCourses,
  createCourse,
  deleteCourse,
  togglePublishCourse,
  seedInitialCourses,
  CATEGORIES,
  SAMPLE_THUMBNAILS,
} from "../services/courseService";
import {
  Users,
  DollarSign,
  BookOpen,
  PlusCircle,
  FileEdit,
  Globe,
  Trash2,
  CheckCircle2,
  Eye,
  Sparkles,
  X,
  AlertCircle,
  Clock,
  Layers,
  BarChart3,
  TrendingUp,
  Award,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import PendingApproval from "./PendingApproval";

export default function TeacherDashboard() {
  const { currentUser, userProfile, isApproved } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("courses"); // "courses" | "analytics"
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Analytics State
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsEnrollments, setAnalyticsEnrollments] = useState([]);
  const [courseLessonCounts, setCourseLessonCounts] = useState({});
  const [courseStats, setCourseStats] = useState([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");

  // Create Course Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newThumbnail, setNewThumbnail] = useState(SAMPLE_THUMBNAILS[0].url);
  const [creating, setCreating] = useState(false);



  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToTeacherCourses(currentUser.uid, (list) => {
      setCourses(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch Teacher Analytics Data whenever courses update or tab opens
  const fetchAnalyticsData = async (teacherCourses = courses) => {
    if (!teacherCourses || teacherCourses.length === 0) {
      setAnalyticsEnrollments([]);
      setCourseStats([]);
      return;
    }

    try {
      setAnalyticsLoading(true);
      const enrollmentsList = [];
      const lessonCountsMap = {};

      for (const course of teacherCourses) {
        // Fetch lesson count for accurate progress calculation
        try {
          const lessonsSnap = await getDocs(
            collection(db, "courses", course.id, "lessons")
          );
          lessonCountsMap[course.id] = lessonsSnap.size;
        } catch {
          lessonCountsMap[course.id] = 1;
        }

        // Fetch enrollments for this specific course
        try {
          const enrollSnap = await getDocs(
            query(
              collection(db, "enrollments"),
              where("courseId", "==", course.id)
            )
          );
          enrollSnap.forEach((d) => {
            enrollmentsList.push({ id: d.id, ...d.data() });
          });
        } catch (err) {
          console.warn("Error fetching enrollments for course:", course.id, err);
        }
      }

      setCourseLessonCounts(lessonCountsMap);
      setAnalyticsEnrollments(enrollmentsList);

      // Build course statistics for charts
      const stats = teacherCourses.map((c) => {
        const cEnrolls = enrollmentsList.filter((e) => e.courseId === c.id);
        const passed = cEnrolls.filter((e) => e.quizPassed).length;
        const scored = cEnrolls.filter(
          (e) => typeof e.score === "number" && (e.attempts > 0 || e.quizPassed)
        );
        const avg =
          scored.length > 0
            ? Math.round(
                scored.reduce((sum, e) => sum + (e.score || 0), 0) / scored.length
              )
            : 0;

        return {
          courseId: c.id,
          title: c.title,
          shortTitle:
            c.title.length > 18 ? c.title.substring(0, 18) + "..." : c.title,
          enrollmentsCount: cEnrolls.length,
          passedCount: passed,
          avgScore: avg,
        };
      });

      setCourseStats(stats);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (courses.length > 0) {
      fetchAnalyticsData(courses);
    }
  }, [courses]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setCreating(true);
      const courseId = await createCourse({
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        thumbnail: newThumbnail.trim(),
        teacherId: currentUser.uid,
        teacherName: userProfile?.name || currentUser.displayName || "Instructor",
      });

      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      setStatusMsg("Course created as draft! Opening editor...");
      setTimeout(() => {
        navigate(`/teacher/courses/${courseId}/edit`);
      }, 500);
    } catch (err) {
      console.error("Error creating course:", err);
      alert("Failed to create course: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      await togglePublishCourse(course.id, course.published);
      setStatusMsg(
        !course.published
          ? `"${course.title}" is now published and live in the catalog!`
          : `"${course.title}" has been unpublished.`
      );
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (err) {
      console.error("Toggle publish error:", err);
    }
  };

  const handleDeleteCourse = async (courseId, title) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${title}"? This will delete all its lessons and quiz questions.`
      )
    ) {
      return;
    }
    try {
      await deleteCourse(courseId);
      setStatusMsg(`Course "${title}" deleted.`);
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      console.error("Delete course error:", err);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedInitialCourses(currentUser.uid, userProfile?.name || "Instructor");
      setStatusMsg("6 sample courses with full lessons & quizzes added to your account!");
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err) {
      console.error("Seeding error:", err);
    } finally {
      setSeeding(false);
    }
  };

  const publishedCount = courses.filter((c) => c.published).length;
  const draftCount = courses.filter((c) => !c.published).length;

  // Analytics Aggregates
  const totalEnrollments = analyticsEnrollments.length;
  const totalPassed = analyticsEnrollments.filter((e) => e.quizPassed).length;
  const overallCompletionRate =
    totalEnrollments > 0
      ? ((totalPassed / totalEnrollments) * 100).toFixed(1)
      : "0.0";

  const scoredEnrollments = analyticsEnrollments.filter(
    (e) => typeof e.score === "number" && (e.attempts > 0 || e.quizPassed)
  );
  const overallAvgScore =
    scoredEnrollments.length > 0
      ? (
          scoredEnrollments.reduce((sum, e) => sum + (e.score || 0), 0) /
          scoredEnrollments.length
        ).toFixed(1)
      : "0.0";

  // Filtered enrolled students for the table
  const filteredStudents =
    selectedCourseFilter === "all"
      ? analyticsEnrollments
      : analyticsEnrollments.filter((e) => e.courseId === selectedCourseFilter);

  // Teacher Guard: unapproved teacher sees approval screen
  if (!isApproved) {
    return <PendingApproval />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-gray-900 to-[#5624d0] rounded-2xl p-6 sm:p-10 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                Instructor Portal
              </span>
              <span className="flex items-center gap-1 text-emerald-300 text-xs font-semibold bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approved Educator
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Instructor Dashboard
            </h1>
            <p className="mt-2 text-gray-300 text-sm sm:text-base">
              Manage curricula, monitor student performance, and view detailed learning analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {courses.length === 0 && !loading && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="bg-purple-800/80 hover:bg-purple-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition border border-purple-400/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{seeding ? "Seeding Courses..." : "Seed 6+ Sample Courses"}</span>
              </button>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white hover:bg-gray-100 text-[#5624d0] px-5 py-3 rounded-xl font-bold text-sm transition shadow flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-5 h-5 text-[#5624d0]" />
              <span>Create Course</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="p-4 bg-purple-50 border border-purple-200 text-[#5624d0] rounded-xl text-sm font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-[#5624d0]" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Tab Navigation: Courses vs Analytics */}
        <div className="flex border-b border-gray-200 gap-8">
          <button
            onClick={() => setActiveTab("courses")}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === "courses"
                ? "border-[#5624d0] text-[#5624d0]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Courses ({courses.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("analytics");
              fetchAnalyticsData();
            }}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition cursor-pointer border-b-2 ${
              activeTab === "analytics"
                ? "border-[#5624d0] text-[#5624d0]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & Insights</span>
          </button>
        </div>

        {/* ================= TAB 1: COURSES ================= */}
        {activeTab === "courses" && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#5624d0] flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Your Total Courses</p>
                  <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{courses.length}</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Published & Live</p>
                  <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{publishedCount}</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Drafts (Unpublished)</p>
                  <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{draftCount}</h3>
                </div>
              </div>
            </div>

            {/* Courses Table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Your Created Courses</h2>
                  <p className="text-sm text-gray-500">
                    Manage curricula, publish status, lessons, and quiz questions
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-4 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-500 text-sm">Loading your courses from Firestore...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-800">No courses created yet</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-6">
                    Start sharing your expertise by creating your first course, adding video lessons, and building quizzes.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-[#5624d0] hover:bg-[#401b9c] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Course</span>
                    </button>
                    <button
                      onClick={handleSeed}
                      disabled={seeding}
                      className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-[#5624d0]" />
                      <span>{seeding ? "Adding..." : "Seed 6+ Courses"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {courses.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  c.thumbnail ||
                                  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=150&q=80"
                                }
                                alt={c.title}
                                className="w-16 h-10 object-cover rounded-md bg-gray-100 shrink-0"
                              />
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{c.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-1 max-w-md">{c.description}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                              {c.category || "General"}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            {c.published ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                Draft
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/teacher/courses/${c.id}/edit`}
                                className="px-3 py-1.5 bg-[#5624d0] hover:bg-[#401b9c] text-white rounded-lg font-bold text-xs transition inline-flex items-center gap-1 shadow-xs"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </Link>

                              <button
                                onClick={() => handleTogglePublish(c)}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                                  c.published
                                    ? "bg-amber-100 hover:bg-amber-200 text-amber-800"
                                    : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                                }`}
                              >
                                {c.published ? "Unpublish" : "Publish"}
                              </button>

                              <button
                                onClick={() => handleDeleteCourse(c.id, c.title)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                                title="Delete Course"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: ANALYTICS ================= */}
        {activeTab === "analytics" && (
          <div className="space-y-8 animate-fadeIn">
            {/* FEATURE 4: Stat Cards (Total enrollments, completion rate, average quiz score) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Stat 1: Total Enrollments */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Total Enrollments
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {totalEnrollments}
                    </span>
                    <span className="text-xs font-medium text-gray-500">students</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Across all your authored courses</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5624d0] flex items-center justify-center shadow-xs">
                  <Users className="w-7 h-7" />
                </div>
              </div>

              {/* Stat 2: Completion Rate */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Completion Rate
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-600">
                      {overallCompletionRate}%
                    </span>
                    <span className="text-xs font-medium text-emerald-600">
                      ({totalPassed} passed)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Passed the final assessment quiz</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Award className="w-7 h-7" />
                </div>
              </div>

              {/* Stat 3: Average Quiz Score */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Average Quiz Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#5624d0]">
                      {overallAvgScore}%
                    </span>
                    <span className="text-xs font-medium text-purple-600">
                      ({scoredEnrollments.length} attempted)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Average performance in course tests</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5624d0] flex items-center justify-center shadow-xs">
                  <TrendingUp className="w-7 h-7" />
                </div>
              </div>
            </div>

            {/* FEATURE 4: Recharts Bar Charts (Enrollments per course & Avg score per course) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart 1: Enrollments per Course */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#5624d0]" />
                      <span>Enrollments per Course</span>
                    </h3>
                    <span className="text-xs font-bold text-gray-400">Total Enrolled</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Distribution of active learners across your curriculum
                  </p>
                </div>

                {courseStats.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    No course data available
                  </div>
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={courseStats}
                        margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                          dataKey="shortTitle"
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          angle={-15}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <Tooltip
                          formatter={(value) => [`${value} students`, "Enrollments"]}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.title || label}
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            color: "#fff",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          dataKey="enrollmentsCount"
                          name="Enrollments"
                          fill="#5624d0"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Chart 2: Average Quiz Score per Course */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      <span>Average Score per Course</span>
                    </h3>
                    <span className="text-xs font-bold text-gray-400">Quiz Passing Rate</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Average percentage scored by students in exams
                  </p>
                </div>

                {courseStats.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    No score data available
                  </div>
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={courseStats}
                        margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                          dataKey="shortTitle"
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          angle={-15}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          unit="%"
                        />
                        <Tooltip
                          formatter={(value) => [`${value}%`, "Avg Score"]}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.title || label}
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            color: "#fff",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          dataKey="avgScore"
                          name="Avg Score (%)"
                          fill="#7942ec"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* FEATURE 4: Enrolled Students Table per Course */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#5624d0]" />
                    <span>Enrolled Students Roster</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Individual learner progress and assessment statuses for your courses
                  </p>
                </div>

                {/* Course Filter Dropdown & Refresh */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs">
                    <Filter className="w-3.5 h-3.5 text-gray-500" />
                    <select
                      value={selectedCourseFilter}
                      onChange={(e) => setSelectedCourseFilter(e.target.value)}
                      className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer"
                    >
                      <option value="all">All My Courses ({courses.length})</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => fetchAnalyticsData()}
                    className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                    title="Refresh Data"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${analyticsLoading ? "animate-spin text-[#5624d0]" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {analyticsLoading ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-4 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-500 text-xs">Loading enrolled students data...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8">
                  <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-gray-800">No student enrollments found</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                    When students enroll in your courses and start watching lessons, their progress and scores will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-4">Progress</th>
                        <th className="py-3 px-4">Quiz Status</th>
                        <th className="py-3 px-4 text-right">Enrolled Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudents.map((enrollment) => {
                        const totalLessons =
                          courseLessonCounts[enrollment.courseId] ||
                          (enrollment.completedLessons?.length
                            ? Math.max(enrollment.completedLessons.length, 5)
                            : 5);
                        const completedCount = enrollment.completedLessons?.length || 0;
                        const progressPercent = enrollment.quizPassed
                          ? 100
                          : Math.min(
                              100,
                              Math.round((completedCount / Math.max(totalLessons, 1)) * 100)
                            );

                        const enrolledDateStr = enrollment.enrolledAt?.toDate
                          ? enrollment.enrolledAt.toDate().toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Recently";

                        return (
                          <tr key={enrollment.id} className="hover:bg-gray-50 transition">
                            {/* Student Name */}
                            <td className="py-4 px-4 font-bold text-gray-900">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-[#5624d0] font-extrabold text-xs flex items-center justify-center shrink-0">
                                  {(enrollment.studentName || "L")[0].toUpperCase()}
                                </div>
                                <div>
                                  <span className="block text-sm font-bold text-gray-900">
                                    {enrollment.studentName || "Learner"}
                                  </span>
                                  <span className="block text-[11px] text-gray-400 font-mono">
                                    ID: {enrollment.studentId?.substring(0, 8)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Course Title */}
                            <td className="py-4 px-4">
                              <span className="text-xs font-semibold text-gray-800 line-clamp-1 max-w-xs">
                                {enrollment.courseTitle || "Course"}
                              </span>
                            </td>

                            {/* Progress % */}
                            <td className="py-4 px-4">
                              <div className="w-36">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                                  <span>{progressPercent}%</span>
                                  <span className="text-[10px] font-normal text-gray-400">
                                    {completedCount}/{totalLessons} lessons
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      progressPercent === 100
                                        ? "bg-emerald-500"
                                        : "bg-[#5624d0]"
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>

                            {/* Quiz Status */}
                            <td className="py-4 px-4">
                              {enrollment.quizPassed ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Passed ({enrollment.score}%)
                                </span>
                              ) : enrollment.attempts > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                  <Clock className="w-3.5 h-3.5" />
                                  Attempted ({enrollment.score}%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                                  In Progress
                                </span>
                              )}
                            </td>

                            {/* Enrolled Date */}
                            <td className="py-4 px-4 text-right text-xs text-gray-500 font-medium">
                              {enrolledDateStr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-fadeIn">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5624d0]">
                New Course
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                Create a New Training Course
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Set up initial metadata. You can add video lessons and quizzes next.
              </p>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Artificial Intelligence with Python"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#5624d0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#5624d0] focus:outline-none bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide an overview of what students will master..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#5624d0] focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Thumbnail Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newThumbnail}
                  onChange={(e) => setNewThumbnail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#5624d0] focus:outline-none"
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-gray-500 font-semibold">Presets:</span>
                  {SAMPLE_THUMBNAILS.slice(0, 4).map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      onClick={() => setNewThumbnail(p.url)}
                      className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded cursor-pointer"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-[#5624d0] hover:bg-[#401b9c] text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
