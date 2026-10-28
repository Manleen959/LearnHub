import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookOpen, AlertCircle, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle, loginDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const { profile } = await login(email, password);

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      redirectByRole(profile);
    } catch (err) {
      console.error("Login error:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      setGoogleLoading(true);
      const { profile } = await loginWithGoogle("student");

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      redirectByRole(profile);
    } catch (err) {
      console.error("Google sign-in error:", err);
      handleAuthError(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const redirectByRole = (profile) => {
    const userRole = profile?.role;
    if (userRole === "admin") {
      navigate("/admin", { replace: true });
    } else if (userRole === "teacher") {
      if (profile?.approved) {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/pending-approval", { replace: true });
      }
    } else {
      navigate("/student", { replace: true });
    }
  };

  const handleAuthError = (err) => {
    const code = err.code || "";
    const msg = err.message || "";

    if (
      code === "auth/api-key-not-valid" ||
      code === "auth/invalid-api-key" ||
      msg.includes("api-key-not-valid") ||
      msg.includes("API Key is missing")
    ) {
      setError(
        "Firebase API key is missing or invalid in your .env file. Please paste your valid firebaseConfig from console.firebase.google.com into .env and restart Vite, or use Quick Demo Mode below."
      );
    } else if (code === "auth/popup-closed-by-user") {
      setError("Google sign-in popup was cancelled.");
    } else if (code === "auth/unauthorized-domain" || msg.includes("unauthorized-domain")) {
      setError(
        "Google Sign-In domain authorization required: Please add 'learnhub-seven-nu.vercel.app' in Firebase Console under Authentication > Settings > Authorized Domains. In the meantime, you can use Email/Password or the Demo buttons below."
      );
    } else if (
      code === "auth/invalid-credential" ||
      code === "auth/user-not-found" ||
      code === "auth/wrong-password"
    ) {
      setError("Invalid email or password. Please verify your credentials.");
    } else if (code === "auth/too-many-requests") {
      setError("Too many failed attempts. Please try again later.");
    } else {
      setError(msg || "Failed to sign in. Please verify your credentials.");
    }
  };

  const handleQuickDemo = (role, approved = true) => {
    const { profile } = loginDemo(role, approved);
    redirectByRole(profile);
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
            Log in to continue learning
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Access your courses, certificates, and dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
            {/* Quick Demo actions */}
            <div className="mt-2 pt-2 border-t border-red-200/60 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-red-900">Preview with Demo:</span>
              <button
                type="button"
                onClick={() => handleQuickDemo("student")}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded font-medium transition cursor-pointer"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("teacher", false)}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded font-medium transition cursor-pointer"
              >
                Teacher (Pending)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("admin")}
                className="text-xs bg-gray-900 hover:bg-black text-white px-2.5 py-1 rounded font-medium transition cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Sign in with Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
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
          <span>{googleLoading ? "Signing in with Google..." : "Continue with Google"}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-xs uppercase tracking-wider text-gray-400 font-semibold absolute">
            or log in with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5624d0] focus:border-transparent text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5624d0] focus:border-transparent text-sm transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
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
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>

        {/* Demo Fast Login Box */}
        <div className="mt-5 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-1.5 font-bold text-xs text-gray-700 mb-2">
            <Sparkles className="w-4 h-4 text-[#5624d0]" />
            <span>Fast Demo Sign-In (No Firebase keys required):</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("student")}
              className="py-1.5 px-2 text-xs bg-white border border-gray-300 hover:border-purple-400 rounded-lg font-semibold text-gray-800 transition hover:bg-purple-50 cursor-pointer text-center"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("teacher", false)}
              className="py-1.5 px-2 text-xs bg-white border border-gray-300 hover:border-amber-400 rounded-lg font-semibold text-gray-800 transition hover:bg-amber-50 cursor-pointer text-center"
            >
              ⏳ Teacher
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("admin")}
              className="py-1.5 px-2 text-xs bg-white border border-gray-300 hover:border-gray-500 rounded-lg font-semibold text-gray-800 transition hover:bg-gray-100 cursor-pointer text-center"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="font-bold text-[#5624d0] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
