import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export const getEnrollmentId = (uid, courseId) => `${uid}_${courseId}`;

// Subscribe to a single enrollment
export const subscribeToEnrollment = (uid, courseId, callback) => {
  if (!db || !uid || !courseId) {
    callback(null);
    return () => {};
  }
  const enrollId = getEnrollmentId(uid, courseId);
  const docRef = doc(db, "enrollments", enrollId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn("subscribeToEnrollment error:", err);
      callback(null);
    }
  );
};

// Subscribe to all enrollments for a student
export const subscribeToStudentEnrollments = (uid, callback) => {
  if (!db || !uid) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, "enrollments"), where("studentId", "==", uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(list);
    },
    (err) => {
      console.warn("subscribeToStudentEnrollments error:", err);
      callback([]);
    }
  );
};

// Enroll in a course
export const enrollInCourse = async (user, course) => {
  if (!db) throw new Error("Database not connected");
  if (!user?.uid) throw new Error("Authentication required to enroll");
  const enrollId = getEnrollmentId(user.uid, course.id);
  const docRef = doc(db, "enrollments", enrollId);

  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      return { id: enrollId, ...existing.data() };
    }
  } catch (err) {
    console.warn("Enrollment doc check non-fatal notice:", err.message);
  }

  const enrollmentData = {
    studentId: user.uid,
    studentName: user.name || user.displayName || "Learner",
    courseId: course.id,
    courseTitle: course.title || "Course",
    teacherId: course.teacherId || "",
    completedLessons: [],
    awardedLessonIds: [],
    quizPassed: false,
    score: 0,
    attempts: 0,
    certificateId: null,
    enrolledAt: serverTimestamp(),
  };

  await setDoc(docRef, enrollmentData, { merge: true });
  return { id: enrollId, ...enrollmentData };
};

// Toggle or mark lesson completion
export const toggleLessonCompletion = async (
  uid,
  courseId,
  lessonId,
  currentCompleted = [],
  awardedLessonIds = []
) => {
  if (!db) throw new Error("Database not connected");
  const enrollId = getEnrollmentId(uid, courseId);
  const docRef = doc(db, "enrollments", enrollId);

  const isCompleted = currentCompleted.includes(lessonId);
  const updatedCompleted = isCompleted
    ? currentCompleted.filter((id) => id !== lessonId)
    : [...currentCompleted, lessonId];

  const wasAwarded = (awardedLessonIds || []).includes(lessonId);
  const updatedAwarded = wasAwarded
    ? awardedLessonIds
    : [...(awardedLessonIds || []), lessonId];

  await updateDoc(docRef, {
    completedLessons: updatedCompleted,
    awardedLessonIds: updatedAwarded,
  });

  return {
    completed: updatedCompleted,
    isFirstEver: !isCompleted && !wasAwarded,
  };
};

// Save quiz submission & issue certificate if passed
export const saveQuizAttempt = async ({
  uid,
  courseId,
  score, // e.g. 80
  passed, // boolean
  attempts,
  studentName,
  courseTitle,
}) => {
  if (!db) throw new Error("Database not connected");
  const enrollId = getEnrollmentId(uid, courseId);
  const enrollRef = doc(db, "enrollments", enrollId);

  let newCertId = null;

  if (passed) {
    // Generate certificate in certificates collection
    const certRef = await addDoc(collection(db, "certificates"), {
      studentId: uid,
      studentName: studentName || "Learner",
      courseId,
      courseTitle: courseTitle || "Digital Training Course",
      score: Number(score),
      issuedAt: serverTimestamp(),
    });
    newCertId = certRef.id;

    await updateDoc(enrollRef, {
      quizPassed: true,
      score: Number(score),
      attempts: Number(attempts) || 1,
      certificateId: newCertId,
    });
  } else {
    await updateDoc(enrollRef, {
      score: Number(score),
      attempts: Number(attempts) || 1,
    });
  }

  return { certificateId: newCertId, passed };
};

// Fetch Certificate details
export const getCertificateById = async (certificateId) => {
  if (!db || !certificateId) return null;
  const snap = await getDoc(doc(db, "certificates", certificateId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};
