import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCourseById, subscribeToLessons } from "../services/courseService";
import {
  subscribeToEnrollment,
  toggleLessonCompletion,
  getEnrollmentId,
} from "../services/enrollmentService";
import { awardLessonCompletionXP } from "../services/gamificationService";
import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import AiTutorChat from "../components/AiTutorChat";
import {
  PlayCircle,
  CheckCircle,
  Circle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  Video,
  FileText,
  Copy,
  Check,
  RotateCw,
} from "lucide-react";

function getYouTubeEmbedUrl(url) {
  if (!url) return "";
  let videoId = "";
  try {
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split(/[?#]/)[0];
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split(/[&?#]/)[0];
    } else if (url.includes("embed/")) {
      videoId = url.split("embed/")[1]?.split(/[?#]/)[0];
    } else {
      videoId = url;
    }
  } catch (e) {
    videoId = "";
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : "";
}

export default function LearnCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // AI Notes State
  const [lessonNotes, setLessonNotes] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login", { state: { from: { pathname: `/learn/${courseId}` } } });
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
        });
      } catch (err) {
        console.error("Error loading learn page:", err);
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

  const currentLesson = lessons[currentLessonIndex] || null;

  // Check Firestore cache for existing AI study notes whenever currentLesson changes
  useEffect(() => {
    if (!db || !currentUser || !currentLesson) {
      setLessonNotes("");
      return;
    }

    const checkCachedNotes = async () => {
      try {
        const enrollId = getEnrollmentId(currentUser.uid, courseId);
        const noteRef = doc(db, "enrollments", enrollId, "notes", currentLesson.id);
        const noteSnap = await getDoc(noteRef);
        if (noteSnap.exists()) {
          setLessonNotes(noteSnap.data().notes || "");
        } else {
          setLessonNotes("");
        }
      } catch (e) {
        console.warn("Could not check cached notes:", e);
      }
    };

    checkCachedNotes();
  }, [currentLesson, currentUser, courseId]);

  const completedLessons = enrollment?.completedLessons || [];
  const totalLessonsCount = lessons.length;
  const completedCount = completedLessons.length;
  const progressPercent = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;
  const allCompleted = totalLessonsCount > 0 && completedCount >= totalLessonsCount;

  const isCurrentCompleted = currentLesson ? completedLessons.includes(currentLesson.id) : false;

  const handleToggleComplete = async () => {
    if (!currentLesson || !currentUser) return;
    try {
      setUpdatingProgress(true);
      const { isFirstEver } = await toggleLessonCompletion(
        currentUser.uid,
        courseId,
        currentLesson.id,
        completedLessons,
        enrollment?.awardedLessonIds || []
      );

      // Award Gamification XP for lesson completion (+10 XP & streak update) only once per lesson
      if (isFirstEver) {
        await awardLessonCompletionXP(currentUser, true);
      }
    } catch (err) {
      console.error("Toggle complete error:", err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Generate AI Study Notes for current lesson
  const handleGenerateNotes = async () => {
    if (!currentLesson) return;
    setLoadingNotes(true);

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
          mode: "notes",
          courseTitle: course?.title,
          lessonTitle: currentLesson.title,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate study notes.");
      }

      const generated = data.notes || "No notes generated.";
      setLessonNotes(generated);

      // Cache notes in Firestore at enrollments/{uid_courseId}/notes/{lessonId}
      if (db && currentUser) {
        const enrollId = getEnrollmentId(currentUser.uid, courseId);
        const noteRef = doc(db, "enrollments", enrollId, "notes", currentLesson.id);
        await setDoc(noteRef, {
          notes: generated,
          lessonTitle: currentLesson.title,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("AI notes error:", err);
      alert("Error generating notes: " + err.message);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleCopyNotes = () => {
    if (!lessonNotes) return;
    navigator.clipboard.writeText(lessonNotes);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#a435f0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-300 font-medium text-sm">Opening Virtual Classroom...</p>
        </div>
      </div>
    );
  }

  const embedUrl = currentLesson ? getYouTubeEmbedUrl(currentLesson.youtubeUrl) : "";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col relative">
      
      {/* Top Header & Progress Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/student"
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
            title="Back to Student Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="truncate">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
              {course?.category || "Course"}
            </span>
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-md sm:max-w-xl">
              {course?.title}
            </h1>
          </div>
        </div>

        {/* Progress & AI Quiz CTA */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <div className="w-28 sm:w-36 bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-gray-300">{progressPercent}%</span>
          </div>

          {allCompleted ? (
            <Link
              to={`/quiz/${courseId}`}
              className="bg-[#5624d0] hover:bg-[#401b9c] text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition shadow flex items-center gap-1.5 animate-pulse shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Take AI Final Quiz</span>
            </Link>
          ) : (
            <span className="text-[11px] text-gray-400 hidden md:inline">
              Complete {totalLessonsCount - completedCount} more {totalLessonsCount - completedCount === 1 ? "lesson" : "lessons"} for Quiz
            </span>
          )}
        </div>
      </header>

      {/* Main Learning Interface */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Left: Video Player, Controls & AI Study Notes */}
        <main className="flex-1 flex flex-col bg-black">
          {/* 16:9 Video Player */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={currentLesson?.title || "Lesson Video"}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <Video className="w-16 h-16 mx-auto mb-3 opacity-40 text-purple-400" />
                <h3 className="text-lg font-bold text-gray-300">
                  {currentLesson?.title || "No Lesson Selected"}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  {currentLesson?.youtubeUrl
                    ? "Unable to embed video URL format."
                    : "No video URL has been provided for this module."}
                </p>
              </div>
            )}
          </div>

          {/* Lesson Controls Toolbar */}
          <div className="p-4 sm:p-6 bg-gray-900 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-purple-400 font-bold mb-1">
                <span>
                  {lessons.length > 0
                    ? `Lecture ${currentLessonIndex + 1} of ${lessons.length}`
                    : "No lectures available"}
                </span>
                {isCurrentCompleted && (
                  <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded text-[10px] font-semibold">
                    <CheckCircle className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white">
                {currentLesson?.title || (lessons.length === 0 ? "No lessons have been added to this course yet" : "Select a lesson from sidebar")}
              </h2>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={handlePrevLesson}
                disabled={currentLessonIndex === 0 || lessons.length === 0}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleToggleComplete}
                disabled={updatingProgress || !currentLesson}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isCurrentCompleted
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {updatingProgress
                    ? "Saving..."
                    : isCurrentCompleted
                    ? "Completed"
                    : "Mark as Complete"}
                </span>
              </button>

              <button
                onClick={handleNextLesson}
                disabled={currentLessonIndex >= lessons.length - 1 || lessons.length === 0}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FEATURE 2: AI Study Notes Section */}
          <div className="p-4 sm:p-6 bg-gray-950 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm text-gray-200">
                  Lesson Study Notes
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {!lessonNotes ? (
                  <button
                    onClick={handleGenerateNotes}
                    disabled={loadingNotes || !currentLesson}
                    className="bg-purple-600/90 hover:bg-purple-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{loadingNotes ? "Generating Notes with Gemma..." : "Generate AI Notes"}</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCopyNotes}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedNotes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNotes ? "Copied!" : "Copy Notes"}</span>
                    </button>
                    <button
                      onClick={handleGenerateNotes}
                      disabled={loadingNotes}
                      className="p-1.5 text-gray-400 hover:text-white rounded-lg transition cursor-pointer"
                      title="Regenerate notes"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${loadingNotes ? "animate-spin" : ""}`} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {loadingNotes ? (
              <div className="p-8 bg-gray-900/60 rounded-2xl border border-gray-800 text-center">
                <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-400">Gemma is analyzing this lecture and formulating study takeaways...</p>
              </div>
            ) : lessonNotes ? (
              <div className="p-5 bg-gray-900 rounded-2xl border border-gray-800 text-xs sm:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed animate-fadeIn">
                {lessonNotes}
              </div>
            ) : (
              <div className="p-6 bg-gray-900/40 rounded-2xl border border-dashed border-gray-800 text-center text-xs text-gray-500">
                Click <strong>"Generate AI Notes"</strong> to have Gemma distill a 2-line summary, 5 key points, and 2 practice questions for this module. Notes are cached in Firestore automatically.
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar: Lessons Playlist */}
        <aside className="w-full lg:w-96 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col max-h-[600px] lg:max-h-none">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Curriculum Outline</span>
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              {completedCount}/{totalLessonsCount} Done
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60">
            {lessons.map((lesson, idx) => {
              const isDone = completedLessons.includes(lesson.id);
              const isActive = idx === currentLessonIndex;

              return (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLessonIndex(idx)}
                  className={`w-full p-4 text-left transition flex items-start gap-3 cursor-pointer ${
                    isActive
                      ? "bg-purple-950/40 border-l-4 border-[#5624d0]"
                      : "hover:bg-gray-800/40"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Module {lesson.order || idx + 1}</span>
                      <span className="text-[10px] text-purple-300">Video</span>
                    </div>
                    <p
                      className={`text-sm font-semibold leading-snug line-clamp-2 ${
                        isActive ? "text-purple-300" : "text-gray-200"
                      }`}
                    >
                      {lesson.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Callout to AI Quiz */}
          <div className="p-4 bg-gray-950 border-t border-gray-800">
            {allCompleted ? (
              <Link
                to={`/quiz/${courseId}`}
                className="w-full py-3 bg-[#5624d0] hover:bg-[#401b9c] text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ready for AI Final Exam &rarr;</span>
              </Link>
            ) : (
              <div className="text-xs text-gray-500 text-center">
                Finish all {totalLessonsCount} lessons to unlock the AI Exam & Certificate.
              </div>
            )}
          </div>
        </aside>

      </div>

      {/* FEATURE 1: Floating Ask AI Tutor Chat Component */}
      <AiTutorChat
        courseTitle={course?.title || "Digital Course"}
        lessonTitles={lessons.map((l) => l.title)}
      />
    </div>
  );
}
