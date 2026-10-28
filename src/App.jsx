import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Banner from "./components/Banner";
import Navbar from "./components/Navbar";
import FirebaseAlert from "./components/FirebaseAlert";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PendingApproval from "./pages/PendingApproval";
import CoursesCatalog from "./pages/CoursesCatalog";
import CourseDetail from "./pages/CourseDetail";
import CourseEditor from "./pages/CourseEditor";
import LearnCourse from "./pages/LearnCourse";
import QuizPage from "./pages/QuizPage";
import CertificatePage from "./pages/CertificatePage";
import VerifyCertificate from "./pages/VerifyCertificate";
import LeaderboardPage from "./pages/LeaderboardPage";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-white selection:bg-[#5624d0] selection:text-white">
          {/* Top Announcement Banner (Dismissible) - Hidden during print */}
          <div className="print:hidden">
            <Banner />
          </div>

          {/* Firebase Alert (only shows if .env is unconfigured) - Hidden during print */}
          <div className="print:hidden">
            <FirebaseAlert />
          </div>

          {/* Udemy-Style Main Header - Hidden during print */}
          <div className="print:hidden">
            <Navbar />
          </div>

          {/* Application Main Content & Routing */}
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<CoursesCatalog />} />
              <Route path="/course/:id" element={<CourseDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/pending-approval" element={<PendingApproval />} />

              {/* Public Certificate Verification (No login required) */}
              <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
              
              {/* Printable Certificate Page */}
              <Route path="/certificate/:certificateId" element={<CertificatePage />} />

              {/* Learning Classroom */}
              <Route
                path="/learn/:courseId"
                element={
                  <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
                    <LearnCourse />
                  </ProtectedRoute>
                }
              />

              {/* AI Generated Exam */}
              <Route
                path="/quiz/:courseId"
                element={
                  <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
                    <QuizPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Student Dashboard */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={["student", "admin"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Teacher Dashboard */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Teacher Course Editor */}
              <Route
                path="/teacher/courses/:id/edit"
                element={
                  <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                    <CourseEditor />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Dashboard */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Leaderboard */}
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
