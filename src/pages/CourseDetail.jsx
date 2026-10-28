import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCourseById, subscribeToLessons } from "../services/courseService";
import {
  subscribeToEnrollment,
  enrollInCourse,
} from "../services/enrollmentService";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen,
  User,
  Star,
  Clock,
  PlayCircle,
  HelpCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    let unsubscribeLessons = () => {};
    let unsubscribeEnrollment = () => {};

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const data = await getCourseById(id);
        setCourse(data);

        if (data) {
          unsubscribeLessons = subscribeToLessons(id, (list) => {
            setLessons(list);
          });
        }

        if (currentUser) {
          unsubscribeEnrollment = subscribeToEnrollment(currentUser.uid, id, (enr) => {
            setEnrollment(enr);
          });
        }
      } catch (err) {
        console.error("Error fetching course detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();

    return () => {
      unsubscribeLessons();
      unsubscribeEnrollment();
    };
  }, [id, currentUser]);

  const handleEnrollClick = async () => {
    if (!currentUser) {
      // Login required
      navigate("/login", { state: { from: { pathname: `/course/${id}` } } });
      return;
    }

    if (enrollment) {
      // Already enrolled, go to learning page
      navigate(`/learn/${id}`);
      return;
    }

    try {
      setEnrolling(true);
      await enrollInCourse(
        {
          uid: currentUser.uid,
          name: userProfile?.name || currentUser.displayName || "Learner",
        },
        course
      );
      navigate(`/learn/${id}`);
    } catch (err) {
      console.error("Enrollment error:", err);
      alert("Failed to enroll: " + err.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium text-sm">Loading course syllabus...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center max-w-md shadow-sm">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Course Not Found</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            The course you are looking for may have been removed or unpublished by the instructor.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 bg-[#5624d0] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#401b9c] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse All Courses</span>
          </Link>
        </div>
      </div>
    );
  }

  const isEnrolled = Boolean(enrollment);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Top Hero Banner */}
      <div className="bg-[#1c1d1f] text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <Link to="/courses" className="hover:text-white transition">Courses</Link>
            <span>/</span>
            <span className="text-purple-300 truncate max-w-xs">{course.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-4">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {course.category || "Online Course"}
              </span>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-gray-300 text-base leading-relaxed">
                {course.description}
              </p>

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 pt-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span>4.9</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-gray-400 font-normal text-xs">(Verified)</span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-300">
                  <User className="w-4 h-4 text-[#a435f0]" />
                  <span>Instructor: <strong>{course.teacherName || "Approved Teacher"}</strong></span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-300">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{lessons.length} video modules</span>
                </div>
              </div>
            </div>

            {/* Right Card / Media Box */}
            <div className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <div className="relative aspect-video overflow-hidden bg-gray-900">
                <img
                  src={
                    course.thumbnail ||
                    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-gray-900">Free</span>
                    <span className="text-xs text-emerald-600 font-bold ml-2 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Digital Certificate Included
                    </span>
                  </div>
                </div>

                {/* Dynamic Enroll Now / Go to Course Button */}
                <button
                  onClick={handleEnrollClick}
                  disabled={enrolling}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                    isEnrolled
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-[#5624d0] hover:bg-[#401b9c] text-white active:scale-98"
                  }`}
                >
                  {enrolling ? (
                    <span>Enrolling you...</span>
                  ) : isEnrolled ? (
                    <>
                      <span>Go to Course</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Enroll Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  {isEnrolled ? "You are enrolled in this training." : "Full lifetime access • AI Assessment Included"}
                </p>

                <div className="pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Video Lessons:</span>
                    <strong className="text-gray-900">{lessons.length} lectures</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI Certification:</span>
                    <strong className="text-gray-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#5624d0]" />
                      Gemma Exam
                    </strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Body: Lessons List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Course Content / Lesson List (Titles Only) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                    Course Curriculum
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"} total
                  </p>
                </div>
              </div>

              {lessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <PlayCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No lessons added yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">The instructor is preparing video materials.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50/70 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-50 text-[#5624d0] font-bold text-xs flex items-center justify-center shrink-0">
                          {lesson.order || idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {lesson.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <PlayCircle className="w-4 h-4 text-[#5624d0]" />
                        <span>Video Lesson</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Exam Info */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-6 sm:p-8 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#5624d0] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  AI-Powered Final Exam & Verification Certificate
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                  Upon completing all lessons in this course, an interactive exam is generated in real-time by <strong>Gemma AI</strong> based on your specific curriculum. Score 60% or higher to unlock your official verified certificate with a tamper-proof QR code.
                </p>
              </div>
            </div>
          </div>

          {/* Right Instructor Bio */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
                Instructor
              </h4>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#5624d0] text-white flex items-center justify-center font-bold text-lg">
                  {course.teacherName?.charAt(0) || "T"}
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 text-base">
                    {course.teacherName || "Approved Teacher"}
                  </h5>
                  <span className="text-xs text-[#5624d0] font-semibold">Verified LearnHub Instructor</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Dedicated educator providing real-world training tailored for industry mastery.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
