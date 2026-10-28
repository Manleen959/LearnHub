import React, { useState, useEffect } from "react";
import { Star, Clock, Users, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { subscribeToPublishedCourses, seedInitialCourses, CATEGORIES } from "../services/courseService";
import { useAuth } from "../context/AuthContext";

export default function CourseCards() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Courses");
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToPublishedCourses((list) => {
      setCourses(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedInitialCourses(currentUser?.uid, userProfile?.name);
    } catch (err) {
      console.error("Seeding courses error:", err);
    } finally {
      setSeeding(false);
    }
  };

  const allCategories = ["All Courses", ...CATEGORIES];

  const filteredCourses =
    selectedCategory === "All Courses"
      ? courses
      : courses.filter((c) => c.category === selectedCategory);

  return (
    <section id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#5624d0] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Featured Courses
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            A broad selection of courses
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Choose from industry-verified video courses with real-time curricula
          </p>
        </div>

        <div className="flex items-center gap-3">
          {courses.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{seeding ? "Seeding 6+ Courses..." : "Populate Starter Courses"}</span>
            </button>
          )}

          <Link
            to="/courses"
            className="text-sm font-bold text-[#5624d0] hover:text-[#401b9c] flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-gray-200">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 font-medium text-sm">Loading verified courses from Firestore...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No published courses found in this category</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-6">
            Courses created and published by instructors in the Teacher Dashboard will appear here.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="bg-[#5624d0] hover:bg-[#401b9c] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{seeding ? "Adding 6+ courses to Firestore..." : "Seed 6+ Sample Courses Now"}</span>
          </button>
        </div>
      ) : (
        /* Courses Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              to={`/course/${course.id}`}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
            >
              {/* Card Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                <img
                  src={
                    course.thumbnail ||
                    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80"
                  }
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded text-xs font-bold shadow-xs bg-purple-100 text-[#5624d0]">
                  {course.category || "Course"}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-base line-clamp-2 group-hover:text-[#5624d0] transition-colors leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1.5 truncate">
                    Instructor: {course.teacherName || "Verified Instructor"}
                  </p>

                  <p className="text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className="font-extrabold text-amber-900 text-sm">4.9</span>
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">(1,240 reviews)</span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Free Access
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#5624d0] group-hover:underline flex items-center gap-0.5">
                    View Course &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
