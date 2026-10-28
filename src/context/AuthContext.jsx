import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured, googleProvider } from "../firebase";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Email / Password Signup
  const signup = async (email, password, name, role) => {
    if (!isFirebaseConfigured) {
      throw new Error(
        "Firebase API Key is missing in your .env file. Please paste your firebaseConfig keys in .env (or test via Demo Mode)."
      );
    }

    if (role === "admin") {
      throw new Error("Admin accounts cannot be self-registered.");
    }

    const validRole = role === "teacher" ? "teacher" : "student";
    const isApproved = validRole === "student";

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    try {
      await updateProfile(user, { displayName: name });
    } catch (e) {
      console.warn("Could not update auth displayName:", e);
    }

    const profileData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: validRole,
      approved: isApproved,
      createdAt: serverTimestamp(),
    };

    if (db) {
      await setDoc(doc(db, "users", user.uid), profileData);
    }

    setUserProfile({
      uid: user.uid,
      ...profileData,
    });

    return { user, profile: profileData };
  };

  // Email / Password Login
  const login = async (email, password) => {
    if (!isFirebaseConfigured) {
      throw new Error(
        "Firebase API Key is missing in your .env file. Please paste your firebaseConfig keys in .env (or test via Demo Mode)."
      );
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let profile = null;
    if (db) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        profile = userDoc.data();
        setUserProfile({ uid: user.uid, ...profile });
      }
    }

    return { user, profile };
  };

  // Google Sign In
  const loginWithGoogle = async (role = "student") => {
    if (!isFirebaseConfigured) {
      throw new Error(
        "Firebase API Key is missing in your .env file. Please paste your firebaseConfig keys in .env (or test via Demo Mode)."
      );
    }

    const provider = googleProvider || new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    let profileData = null;

    if (db) {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        profileData = userDoc.data();
      } else {
        const validRole = role === "teacher" ? "teacher" : "student";
        profileData = {
          name: user.displayName || "Google User",
          email: user.email,
          role: validRole,
          approved: validRole === "student",
          createdAt: serverTimestamp(),
        };
        await setDoc(userDocRef, profileData);
      }
    }

    setUserProfile({ uid: user.uid, ...profileData });
    return { user, profile: profileData };
  };

  // Quick Demo Login (allows testing role routing & dashboards even before user adds their Firebase API key)
  const loginDemo = (role = "student", approvedOverride) => {
    const isTeacher = role === "teacher";
    const isAdmin = role === "admin";
    const isApproved = approvedOverride !== undefined ? approvedOverride : (isTeacher ? false : true);

    const demoUser = {
      uid: `demo-${role}-${Date.now()}`,
      displayName: isAdmin ? "System Admin" : isTeacher ? "Professor John Smith" : "Alex Johnson",
      email: `demo.${role}@learnhub.test`,
    };

    const demoProfile = {
      uid: demoUser.uid,
      name: demoUser.displayName,
      email: demoUser.email,
      role: role,
      approved: isApproved,
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(demoUser);
    setUserProfile(demoProfile);
    return { user: demoUser, profile: demoProfile };
  };

  // Logout
  const logout = async () => {
    if (auth && isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("SignOut error:", e);
      }
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Realtime Auth Listener
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user && db) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          unsubscribeSnapshot = onSnapshot(
            userDocRef,
            (snapshot) => {
              if (snapshot.exists()) {
                setUserProfile({ uid: user.uid, ...snapshot.data() });
              } else {
                setUserProfile((prev) => prev || {
                  uid: user.uid,
                  name: user.displayName || "User",
                  email: user.email,
                  role: "student",
                  approved: true,
                });
              }
              setLoading(false);
            },
            (err) => {
              console.warn("Firestore snapshot error:", err);
              setLoading(false);
            }
          );
        } catch (error) {
          console.error("Error setting up Firestore listener:", error);
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    role: userProfile?.role || null,
    isApproved: userProfile?.approved ?? false,
    loading,
    signup,
    login,
    loginWithGoogle,
    loginDemo,
    logout,
    isFirebaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
