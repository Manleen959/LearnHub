import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToLeaderboard,
  BADGE_DEFINITIONS,
} from "../services/gamificationService";
import {
  Trophy,
  Flame,
  Award,
  Medal,
  Sparkles,
  User,
  ArrowLeft,
  Crown,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function LeaderboardPage() {
  const { currentUser, userProfile } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((list) => {
      setLeaders(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Demo fallback leaderboard if empty
  const displayLeaders = leaders.length > 0 ? leaders : [
    {
      uid: currentUser?.uid || "user_current",
      name: userProfile?.name || currentUser?.displayName || "You",
      xp: 240,
      streak: 3,
      badges: ["First Step", "Quiz Master", "On Fire"],
    },
    {
      uid: "u_sarah",
      name: "Sarah Chen",
      xp: 420,
      streak: 7,
      badges: ["First Step", "Quiz Master", "Perfectionist", "Scholar"],
    },
    {
      uid: "u_marcus",
      name: "Marcus Vance",
      xp: 380,
      streak: 5,
      badges: ["First Step", "Quiz Master", "On Fire"],
    },
    {
      uid: "u_priya",
      name: "Priya Sharma",
      xp: 310,
      streak: 4,
      badges: ["First Step", "Quiz Master"],
    },
    {
      uid: "u_elena",
      name: "Elena Rostova",
      xp: 270,
      streak: 3,
      badges: ["First Step", "Quiz Master"],
    },
  ].sort((a, b) => (b.xp || 0) - (a.xp || 0));

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-extrabold text-sm shadow-sm">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-800 flex items-center justify-center font-extrabold text-sm shadow-sm">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-700/60 text-amber-100 flex items-center justify-center font-extrabold text-sm shadow-sm">
          🥉
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
        #{rank}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-gray-900 via-[#5624d0] to-[#7942ec] rounded-2xl p-6 sm:p-10 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                Global Rankings
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Student Leaderboard
            </h1>
            <p className="mt-2 text-purple-100 text-sm sm:text-base max-w-lg">
              Compete with peers worldwide! Earn XP by completing lessons, keeping daily streaks, and acing AI exams.
            </p>
          </div>

          <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
            <Trophy className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* XP Rules Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#5624d0] flex items-center justify-center font-bold">
              +10
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Per Lesson Completed</p>
              <p className="text-[11px] text-gray-500">First-time module finish</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              +50
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Pass AI Final Exam</p>
              <p className="text-[11px] text-gray-500">Score 60% or higher</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              +25
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Mastery Bonus</p>
              <p className="text-[11px] text-gray-500">Score 90% or higher on quiz</p>
            </div>
          </div>
        </div>

        {/* Top 10 Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>Top 10 High Achievers</span>
            </h2>
            <span className="text-xs font-bold text-gray-500">Live XP Ranking</span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-[#5624d0] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-xs text-gray-500 font-medium">Fetching leaderboard rankings...</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayLeaders.map((student, idx) => {
                const rank = idx + 1;
                const isCurrentUser = currentUser && student.uid === currentUser.uid;

                return (
                  <div
                    key={student.uid || idx}
                    className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition ${
                      isCurrentUser
                        ? "bg-purple-50/80 border-l-4 border-[#5624d0]"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Rank & Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {getRankBadge(rank)}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                            {student.name || "Student"}
                          </h3>
                          {isCurrentUser && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#5624d0] text-white">
                              You
                            </span>
                          )}
                        </div>

                        {/* Badges preview */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {student.badges?.map((badgeKey) => {
                            const badge = BADGE_DEFINITIONS[badgeKey];
                            return (
                              <span
                                key={badgeKey}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  badge?.color || "bg-gray-100 text-gray-700"
                                }`}
                                title={badge?.description}
                              >
                                {badge?.icon} {badgeKey}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Streak & XP Stats */}
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span>{student.streak || 1}d</span>
                      </div>

                      <div className="text-right">
                        <span className="text-base sm:text-lg font-extrabold text-[#5624d0] block leading-none">
                          {student.xp || 0}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-gray-400">
                          XP
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
