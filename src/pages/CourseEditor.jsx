import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCourseById,
  updateCourse,
  togglePublishCourse,
  subscribeToLessons,
  addLesson,
  deleteLesson,
  subscribeToQuestions,
  addQuestion,
  deleteQuestion,
  CATEGORIES,
  SAMPLE_THUMBNAILS,
} from "../services/courseService";
import {
  BookOpen,
  ArrowLeft,
  PlusCircle,
  Trash2,
  CheckCircle,
  HelpCircle,
  Video,
  Globe,
  Eye,
  AlertCircle,
  Save,
  Check,
  Sparkles,
} from "lucide-react";

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Edit Course Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [thumbnail, setThumbnail] = useState("");

  // New Lesson Form State
  const [lessonTitle, setLessonTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [addingLesson, setAddingLesson] = useState(false);

  // New Quiz Question Form State
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [addingQuestion, setAddingQuestion] = useState(false);

  useEffect(() => {
    let unsubscribeLessons = () => {};
    let unsubscribeQuestions = () => {};

    const loadCourse = async () => {
      try {
        setLoading(true);
        const data = await getCourseById(id);
        if (!data) {
          navigate("/teacher");
          return;
        }

        // Security check: Only owner teacher (or admin) can edit
        const isAdmin = userProfile?.role === "admin";
        if (currentUser && data.teacherId && data.teacherId !== currentUser.uid && !isAdmin) {
          alert("Unauthorized: You can only edit courses you own.");
          navigate("/teacher");
          return;
        }

        setCourse(data);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || CATEGORIES[0]);
        setThumbnail(data.thumbnail || "");

        unsubscribeLessons = subscribeToLessons(id, (list) => {
          setLessons(list);
        });

        unsubscribeQuestions = subscribeToQuestions(id, (list) => {
          setQuestions(list);
        });
      } catch (err) {
        console.error("Error loading course for edit:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();

    return () => {
      unsubscribeLessons();
      unsubscribeQuestions();
    };
  }, [id, currentUser, navigate]);

  const handleSaveCourseInfo = async (e) => {
    e.preventDefault();
    try {
      setSavingCourse(true);
      await updateCourse(id, {
        title: title.trim(),
        description: description.trim(),
        category,
        thumbnail: thumbnail.trim(),
      });
      setStatusMsg("Course details updated successfully!");
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      console.error("Error updating course:", err);
      setStatusMsg("Failed to save changes: " + err.message);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;
    try {
      await togglePublishCourse(id, course.published);
      setCourse((prev) => ({ ...prev, published: !prev.published }));
      setStatusMsg(
        !course.published
          ? "Course published! It is now live in the public catalog."
          : "Course unpublished and hidden from the public catalog."
      );
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (err) {
      console.error("Toggle publish error:", err);
    }
  };

  // Add Lesson
  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    try {
      setAddingLesson(true);
      const nextOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.order || 0)) + 1 : 1;
      await addLesson(id, {
        title: lessonTitle.trim(),
        youtubeUrl: youtubeUrl.trim(),
        order: nextOrder,
      });
      setLessonTitle("");
      setYoutubeUrl("");
    } catch (err) {
      console.error("Error adding lesson:", err);
    } finally {
      setAddingLesson(false);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;
    try {
      await deleteLesson(id, lessonId);
    } catch (err) {
      console.error("Error deleting lesson:", err);
    }
  };

  // Add Question
  const handleOptionChange = (idx, value) => {
    const updated = [...options];
    updated[idx] = value;
    setOptions(updated);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    if (options.some((opt) => !opt.trim())) {
      alert("Please provide text for all 4 options.");
      return;
    }

    try {
      setAddingQuestion(true);
      await addQuestion(id, {
        question: questionText.trim(),
        options: options.map((opt) => opt.trim()),
        correctIndex: Number(correctIndex),
      });
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
    } catch (err) {
      console.error("Error adding question:", err);
    } finally {
      setAddingQuestion(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this quiz question?")) return;
    try {
      await deleteQuestion(id, questionId);
    } catch (err) {
      console.error("Error deleting question:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium text-sm">Opening Course Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Navigation & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              to="/teacher"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
              title="Back to Teacher Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                  Course Studio
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    course?.published
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {course?.published ? "Published (Live)" : "Draft (Unpublished)"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-0.5">
                {course?.title || "Edit Course"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to={`/course/${id}`}
              target="_blank"
              className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Public View</span>
            </Link>

            <button
              onClick={handleTogglePublish}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                course?.published
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{course?.published ? "Unpublish Course" : "Publish Course"}</span>
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="p-4 bg-purple-50 border border-purple-200 text-[#5624d0] rounded-xl text-sm font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-[#5624d0]" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Section 0: Course Details Editor */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#5624d0]" />
            <span>Course Information</span>
          </h2>

          <form onSubmit={handleSaveCourseInfo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#5624d0] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#5624d0] focus:outline-none bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#5624d0] focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Thumbnail Image URL
              </label>
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#5624d0] focus:outline-none"
              />
              {/* Presets */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[11px] text-gray-500 font-semibold">Quick Presets:</span>
                {SAMPLE_THUMBNAILS.slice(0, 4).map((preset) => (
                  <button
                    type="button"
                    key={preset.name}
                    onClick={() => setThumbnail(preset.url)}
                    className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingCourse}
                className="bg-[#5624d0] hover:bg-[#401b9c] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{savingCourse ? "Saving..." : "Save Details"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 1: Lessons */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-[#5624d0]" />
                <span>Section 1: Course Lessons ({lessons.length})</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Add video lectures and specify YouTube resources for each module.
              </p>
            </div>
          </div>

          {/* Add Lesson Form */}
          <form
            onSubmit={handleAddLesson}
            className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Add New Lesson
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Lesson Title (e.g. Setting Up the Development Environment)"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-[#5624d0] focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="url"
                  placeholder="YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-[#5624d0] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addingLesson}
                className="bg-[#5624d0] hover:bg-[#401b9c] text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{addingLesson ? "Adding Lesson..." : "Add Lesson"}</span>
              </button>
            </div>
          </form>

          {/* Lessons List */}
          {lessons.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed rounded-xl">
              <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-gray-600">No lessons added yet.</p>
              <p className="text-xs text-gray-400">Use the form above to add your first lecture.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-purple-100 text-[#5624d0] font-bold text-xs flex items-center justify-center shrink-0">
                      {lesson.order || idx + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{lesson.title}</h4>
                      {lesson.youtubeUrl ? (
                        <a
                          href={lesson.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Video className="w-3 h-3 text-red-500" />
                          <span className="truncate max-w-sm">{lesson.youtubeUrl}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No URL specified</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                    title="Delete Lesson"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: AI Generated Examination Note */}
        <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50 rounded-2xl border border-purple-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#5624d0] text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 bg-purple-100 text-[#5624d0] font-bold text-xs uppercase tracking-wider rounded-full mb-2">
                Automated Assessment Engine
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">
                Quiz is auto-generated by AI from your lesson titles
              </h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                You no longer need to write manual quiz questions! Once students complete all lessons in this course, our <strong>Gemma AI model</strong> automatically generates multiple-choice questions directly synthesized from your curriculum.
              </p>
              <div className="mt-4 p-3.5 bg-white rounded-xl border border-purple-200 text-xs text-purple-900 font-medium flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>
                  <strong>Tip for Instructors:</strong> Writing descriptive, concept-rich lesson titles produces much higher quality and more insightful AI examination questions.
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
