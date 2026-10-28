import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  GraduationCap,
  Briefcase,
  AlertCircle,
  Eye,
  EyeOff,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signup, loginWithGoogle, loginDemo, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      return setError("Please enter your full name.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    try {
      setLoading(true);
      const { profile } = await signup(email, password, name, role);

      if (profile.role === "teacher") {
        navigate("/pending-approval");
      } else {
        navigate("/student");
      }
    } catch (err) {
      console.error("Signup error:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      setGoogleLoading(true);
      const { profile } = await loginWithGoogle(role);

      if (profile?.role === "teacher") {
        if (profile?.approved) {
          navigate("/teacher");
        } else {
          navigate("/pending-approval");
        }
      } else {
        navigate("/student");
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      handleAuthError(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuthError = (err) => {
    const code = err.code || "";
    const msg = err.message || "";

    if (code === "auth/api-key-not-valid" || code === "auth/invalid-api-key" || msg.includes("api-key-not-valid") || msg.includes("API Key is missing")) {
      setError(
        "Firebase API key is missing or invalid in your .env file. Please paste your valid firebaseConfig from console.firebase.google.com into .env and restart Vite, or use Quick Demo Mode below to preview right away."
      );
    } else if (code === "auth/popup-closed-by-user") {
      setError("Sign-in popup was closed before completion.");
    } else if (code === "auth/email-already-in-use") {
      setError("This email is already registered. Please log in.");
    } else if (code === "auth/invalid-email") {
      setError("Invalid email address format.");
    } else if (code === "auth/weak-password") {
      setError("Password is too weak. Please use at least 6 characters.");
    } else if (code === "auth/operation-not-allowed") {
      setError("Email/Password or Google provider is not enabled in Firebase Console -> Authentication -> Sign-in method.");
    } else {
      setError(msg || "Failed to create account. Check console for details.");
    }
  };

  const handleQuickDemo = (demoRole) => {
    loginDemo(demoRole);
    if (demoRole === "teacher") {
      navigate("/pending-approval");
    } else {
      navigate("/student");
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-[#5624d0] mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Sign up and start learning
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Join the LearnHub global training community
          </p>
        </div>

        {/* Role Selection First so Google Sign-In also knows the role */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
            I want to register as
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                role === "student"
                  ? "border-[#5624d0] bg-purple-50/70 text-[#5624d0] ring-2 ring-[#5624d0]/20 font-bold"
                  : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
              }`}
            >
              <GraduationCap className="w-5 h-5 mb-1" />
              <span className="text-sm font-semibold">Student</span>
              <span className="text-[11px] text-gray-500">Instant Access</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition cursor-pointer ${
                role === "teacher"
                  ? "border-[#5624d0] bg-purple-50/70 text-[#5624d0] ring-2 ring-[#5624d0]/20 font-bold"
                  : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
              }`}
            >
              <Briefcase className="w-5 h-5 mb-1" />
              <span className="text-sm font-semibold">Teacher</span>
              <span className="text-[11px] text-gray-500">Needs Approval</span>
            </button>
          </div>
          {role === "teacher" && (
            <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Note: Teacher accounts require admin approval before the instructor dashboard and course authoring is unlocked.
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
            {/* Quick action to test preview immediately */}
            <div className="mt-2 pt-2 border-t border-red-200/60 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-red-900">Preview without Firebase keys:</span>
              <button
                type="button"
                onClick={() => handleQuickDemo("student")}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded font-medium transition cursor-pointer"
              >
                Demo Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("teacher")}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded font-medium transition cursor-pointer"
              >
                Demo Teacher (Unapproved)
              </button>
            </div>
          </div>
        )}

        {/* Sign in with Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm transition flex items-center justify-center gap-3 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mb-5"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleLoading ? "Connecting to Google..." : `Continue with Google as ${role === "teacher" ? "Teacher" : "Student"}`}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-xs uppercase tracking-wider text-gray-400 font-semibold absolute">
            or sign up with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5624d0] focus:border-transparent text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5624d0] focus:border-transparent text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5624d0] focus:border-transparent text-sm transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-[#5624d0] hover:bg-[#401b9c] text-white font-bold text-sm transition shadow-sm hover:shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Creating your account..." : "Sign up"}
          </button>
        </form>

        {/* Demo Mode helper */}
        <div className="mt-4 p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-[#5624d0]" />
            <span>Want to test immediately?</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo("student")}
              className="text-[11px] font-bold text-[#5624d0] hover:underline"
            >
              Demo Student
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => handleQuickDemo("teacher")}
              className="text-[11px] font-bold text-[#5624d0] hover:underline"
            >
              Demo Teacher
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#5624d0] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
