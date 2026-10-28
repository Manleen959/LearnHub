import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";

// Available Badges Configuration
export const BADGE_DEFINITIONS = {
  "First Step": {
    name: "First Step",
    description: "Completed your first lesson",
    icon: "🌱",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  "Quiz Master": {
    name: "Quiz Master",
    description: "Passed your first AI examination",
    icon: "🎯",
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
  "Perfectionist": {
    name: "Perfectionist",
    description: "Achieved a 100% score on an exam",
    icon: "💎",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  "On Fire": {
    name: "On Fire",
    description: "Maintained a 3-day learning streak",
    icon: "🔥",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  "Scholar": {
    name: "Scholar",
    description: "Earned 2 or more verified certificates",
    icon: "🎓",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
};

// Helper: Get Today and Yesterday date strings (YYYY-MM-DD)
function getDateStrings() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  return { todayStr, yesterdayStr };
}

// Subscribe to a user's gamification stats
export const subscribeToUserGamification = (uid, callback) => {
  if (!db || !uid) {
    callback(null);
    return () => {};
  }
  const docRef = doc(db, "leaderboard", uid);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback({
          name: "Learner",
          xp: 0,
          streak: 1,
          lastActiveDate: "",
          badges: [],
        });
      }
    },
    (err) => {
      console.warn("subscribeToUserGamification error:", err);
      callback(null);
    }
  );
};

// Subscribe to Top 10 Leaderboard
export const subscribeToLeaderboard = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "leaderboard"), orderBy("xp", "desc"), limit(10));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      }));
      callback(list);
    },
    (err) => {
      console.warn("subscribeToLeaderboard error:", err);
      callback([]);
    }
  );
};

// Award XP for lesson completion (+10 XP on first completion & streak tracking)
export const awardLessonCompletionXP = async (user, isFirstTime = true) => {
  if (!db || !user?.uid) return;
  const docRef = doc(db, "leaderboard", user.uid);
  const { todayStr, yesterdayStr } = getDateStrings();

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      let currentXp = 0;
      let currentStreak = 1;
      let lastDate = "";
      let badges = [];
      const userName = user.displayName || user.name || "Student";

      if (snap.exists()) {
        const data = snap.data();
        currentXp = data.xp || 0;
        currentStreak = data.streak || 1;
        lastDate = data.lastActiveDate || "";
        badges = data.badges || [];
      }

      // 1. Calculate Streak
      if (lastDate === yesterdayStr) {
        currentStreak += 1;
      } else if (lastDate === todayStr) {
        // already active today, streak remains
      } else {
        currentStreak = 1;
      }

      // 2. Calculate XP
      if (isFirstTime) {
        currentXp += 10;
      }

      // 3. Evaluate Badges
      if (isFirstTime && !badges.includes("First Step")) {
        badges.push("First Step");
      }
      if (currentStreak >= 3 && !badges.includes("On Fire")) {
        badges.push("On Fire");
      }

      transaction.set(
        docRef,
        {
          name: userName,
          xp: currentXp,
          streak: currentStreak,
          lastActiveDate: todayStr,
          badges,
        },
        { merge: true }
      );
    });
  } catch (err) {
    console.error("awardLessonCompletionXP error:", err);
  }
};

// Award XP for quiz passing (+50 XP for pass, +25 XP bonus for >= 90%)
export const awardQuizPassXP = async (user, score, totalCertsCount = 1) => {
  if (!db || !user?.uid) return;
  const docRef = doc(db, "leaderboard", user.uid);
  const { todayStr } = getDateStrings();

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      let currentXp = 0;
      let currentStreak = 1;
      let badges = [];
      const userName = user.displayName || user.name || "Student";

      if (snap.exists()) {
        const data = snap.data();
        currentXp = data.xp || 0;
        currentStreak = data.streak || 1;
        badges = data.badges || [];
      }

      // +50 base for passing
      let addedXp = 50;

      // +25 bonus for scoring 90% or more
      if (score >= 90) {
        addedXp += 25;
      }

      currentXp += addedXp;

      // Badges check
      if (!badges.includes("Quiz Master")) {
        badges.push("Quiz Master");
      }
      if (score === 100 && !badges.includes("Perfectionist")) {
        badges.push("Perfectionist");
      }
      if (totalCertsCount >= 2 && !badges.includes("Scholar")) {
        badges.push("Scholar");
      }

      transaction.set(
        docRef,
        {
          name: userName,
          xp: currentXp,
          streak: currentStreak,
          lastActiveDate: todayStr,
          badges,
        },
        { merge: true }
      );
    });
  } catch (err) {
    console.error("awardQuizPassXP error:", err);
  }
};
