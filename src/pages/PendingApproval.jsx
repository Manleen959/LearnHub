import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Clock, ShieldAlert, LogOut, RefreshCw, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PendingApproval() {
  const { userProfile, logout, isApproved } = useAuth();
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      if (isApproved) {
        navigate("/teacher");
      }
    }, 1000);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (isApproved) {
    navigate("/teacher");
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-lg w-full bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 text-center">
        
        {/* Animated Badge Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 mb-6 shadow-inner animate-pulse">
          <Clock className="w-10 h-10" />
        </div>

        {/* Title & Status */}
        <div className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-200 mb-3">
          Status: Pending Review
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Waiting for Admin Approval
        </h2>

        {/* Description */}
        <p className="text-gray-600 mt-4 text-sm sm:text-base leading-relaxed">
          Hello <span className="font-semibold text-gray-900">{userProfile?.name || "Teacher"}</span>, your instructor account registration has been submitted successfully!
        </p>

        <div className="my-6 p-4 bg-gray-50 rounded-xl text-left border border-gray-200 text-xs sm:text-sm text-gray-700 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span><strong>Email:</strong> {userProfile?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span><strong>Role:</strong> Teacher (Instructor)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span><strong>Approval Status:</strong> Unapproved (requires Admin activation)</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-normal mb-8">
          To maintain quality across LearnHub, an administrator will review your educator credentials. You will be granted full access to the Teacher Dashboard and course authoring tools once your profile is approved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#5624d0] hover:bg-[#401b9c] text-white rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Checking..." : "Refresh Status"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
