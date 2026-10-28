import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { subscribeToPublishedCourses, seedInitialCourses, CATEGORIES } from "../services/courseService";
import { Search, Star, BookOpen, Sparkles, Filter, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function CoursesCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { currentUser, userProfile } = useAuth();

  // Sync searchQuery when URL query param changes
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    const unsubscribe = subscribeToPublishedCourses((list) => {
      setCourses(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() });
    } else {
      setSearchParams({});
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchParams({});
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedInitialCourses(currentUser?.uid, userProfile?.name);
    } catch (err) {
      console.error("Seeding error:", err);
    } finally {
      setSeeding(false);
    }
  };

  const allCategories = ["All", ...CATEGORIES];

  // Filter courses by category and title query
  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === "All" || course.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacherName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5624d0] bg-purple-50 px-3 py-1 rounded-full">
              Course Catalog
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">
              Explore All Digital Courses & Training
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Discover industry-focused curricula crafted by approved instructors.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search courses by title, instructor, or keywords..."
                className="w-full pl-12 pr-10 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5624d0] focus:border-transparent text-sm bg-gray-50 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {courses.length === 0 && !loading && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="bg-[#5624d0] hover:bg-[#401b9c] text-white px-5 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>{seeding ? "Adding 6+ courses..." : "Seed Starter Courses"}</span>
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#5624d0] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing <strong className="text-gray-900">{filteredCourses.length}</strong> {filteredCourses.length === 1 ? "course" : "courses"}
            {searchQuery && <span> for "<span className="text-[#5624d0] font-semibold">{searchQuery}</span>"</span>}
          </div>
        </div>

        {/* Courses Listing */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 font-medium">Fetching published catalog from Firestore...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center max-w-xl mx-auto">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No courses match your filter</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Try adjusting your search terms or selecting another category.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  clearSearch();
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition cursor-pointer"
              >
                Reset Filters
              </button>
              {courses.length === 0 && (
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  className="px-4 py-2 bg-[#5624d0] text-white hover:bg-[#401b9c] rounded-lg text-sm font-bold transition cursor-pointer"
                >
                  Seed Starter Courses
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/course/${course.id}`}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
              >
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

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 group-hover:text-[#5624d0] transition-colors leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5 truncate">
                      By {course.teacherName || "Instructor"}
                    </p>

                    <p className="text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-1.5 mt-3">
                      <span className="font-extrabold text-amber-900 text-sm">4.9</span>
                      <div className="flex items-center text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">(Verified)</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Free Access
                    </span>
                    <span className="text-xs font-bold text-[#5624d0] group-hover:underline">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
