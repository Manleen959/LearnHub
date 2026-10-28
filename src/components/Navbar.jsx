import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  BookOpen,
  LogOut,
  User,
  LayoutDashboard,
  Menu,
  X,
  Compass,
  Award
} from "lucide-react";

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getDashboardPath = () => {
    const role = userProfile?.role;
    if (role === "admin") return "/admin";
    if (role === "teacher") return userProfile?.approved ? "/teacher" : "/pending-approval";
    return "/student";
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4 sm:gap-6">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 rounded-lg bg-[#5624d0] flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-gray-900">
              Learn<span className="text-[#5624d0]">Hub</span>
            </span>
          </Link>

          {/* Explore & Subscribe navigation links */}
          <div className="hidden lg:flex items-center gap-5 text-sm font-medium text-gray-700">
            <Link
              to="/courses"
              className="flex items-center gap-1.5 hover:text-[#5624d0] transition cursor-pointer py-2"
            >
              <Compass className="w-4 h-4 text-[#5624d0]" />
              <span>Explore</span>
            </Link>
            <Link to="/courses" className="hover:text-[#5624d0] transition">
              All Courses
            </Link>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-2xl relative hidden md:block"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you want to learn today? (e.g. React, Python, Cloud...)"
                className="w-full bg-gray-50 hover:bg-white focus:bg-white text-gray-900 text-sm pl-11 pr-4 py-3 rounded-full border border-gray-300 focus:border-[#5624d0] focus:ring-2 focus:ring-[#5624d0]/20 outline-none transition"
              />
            </div>
          </form>

          {/* Desktop Right Auth Section */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/leaderboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md font-medium text-sm text-gray-700 hover:text-[#5624d0] hover:bg-purple-50 transition"
                  title="Global Leaderboard"
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Leaderboard</span>
                </Link>

                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm text-gray-800 hover:text-[#5624d0] hover:bg-purple-50 transition border border-transparent hover:border-purple-200"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#5624d0]" />
                  <span>Dashboard</span>
                </Link>

                <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
                  <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-[#5624d0] font-semibold text-sm">
                    {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-gray-900 leading-tight max-w-[120px] truncate">
                      {userProfile?.name || currentUser.displayName || "Learner"}
                    </p>
                    <span className="text-[11px] font-medium uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-50 text-[#5624d0] border border-purple-200">
                      {userProfile?.role || "Student"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-bold text-[#5624d0] border border-[#5624d0] rounded-sm hover:bg-purple-50 transition"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#5624d0] hover:bg-[#401b9c] rounded-sm transition shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-[#5624d0] rounded-md"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input bar */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for anything..."
              className="w-full bg-gray-50 text-gray-900 text-sm pl-11 pr-4 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:border-[#5624d0]"
            />
          </form>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3">
          {currentUser ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-[#5624d0] text-white flex items-center justify-center font-bold">
                  {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {userProfile?.name || currentUser.displayName || "Learner"}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    Role: {userProfile?.role || "Student"}
                  </div>
                </div>
              </div>
              <Link
                to="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full p-2.5 rounded-md font-semibold text-gray-800 hover:bg-gray-100"
              >
                <Compass className="w-5 h-5 text-[#5624d0]" />
                Explore Courses
              </Link>
              <Link
                to="/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full p-2.5 rounded-md font-semibold text-gray-800 hover:bg-gray-100"
              >
                <Award className="w-5 h-5 text-amber-500" />
                Global Leaderboard
              </Link>
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full p-2.5 rounded-md font-semibold text-gray-800 hover:bg-gray-100"
              >
                <LayoutDashboard className="w-5 h-5 text-[#5624d0]" />
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 w-full p-2.5 rounded-md font-semibold text-red-600 hover:bg-red-50 text-left cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                to="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full p-2.5 rounded-md font-semibold text-gray-800 hover:bg-gray-100"
              >
                <Compass className="w-5 h-5 text-[#5624d0]" />
                Explore Courses
              </Link>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-bold text-[#5624d0] border border-[#5624d0] rounded-sm hover:bg-purple-50"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-bold text-white bg-[#5624d0] hover:bg-[#401b9c] rounded-sm"
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
