import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

// Subscribe to training assignments for a specific student
export const subscribeToStudentAssignments = (studentId, callback) => {
  if (!db || !studentId) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, "trainingAssignments"),
    where("studentId", "==", studentId)
  );
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
      console.warn("subscribeToStudentAssignments error:", err);
      callback([]);
    }
  );
};

// Subscribe to all training assignments (Admin view)
export const subscribeToAllAssignments = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }
  const colRef = collection(db, "trainingAssignments");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(list);
    },
    (err) => {
      console.warn("subscribeToAllAssignments error:", err);
      callback([]);
    }
  );
};

// Create a new mandatory training assignment
export const createTrainingAssignment = async ({
  studentId,
  studentName,
  courseId,
  courseTitle,
  deadline,
}) => {
  if (!db) throw new Error("Database not connected");
  const docRef = await addDoc(collection(db, "trainingAssignments"), {
    studentId,
    studentName: studentName || "Student",
    courseId,
    courseTitle,
    deadline, // ISO date string (YYYY-MM-DD)
    assignedAt: serverTimestamp(),
  });
  return docRef.id;
};

// Delete an assignment
export const deleteTrainingAssignment = async (assignmentId) => {
  if (!db) throw new Error("Database not connected");
  await deleteDoc(doc(db, "trainingAssignments", assignmentId));
};

// Calculate assignment status: Completed, In Progress, or Overdue
export const calculateAssignmentStatus = (assignment, userEnrollments = []) => {
  const matchingEnrollment = userEnrollments.find(
    (e) => e.courseId === assignment.courseId && e.studentId === assignment.studentId
  );

  if (matchingEnrollment?.quizPassed) {
    return {
      status: "Completed",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badgeColor: "bg-emerald-600",
    };
  }

  const deadlineDate = new Date(assignment.deadline);
  // Add 1 day to make the deadline inclusive through the end of the selected day
  deadlineDate.setHours(23, 59, 59, 999);
  const isPast = deadlineDate < new Date();

  if (isPast) {
    return {
      status: "Overdue",
      color: "bg-red-50 text-red-700 border-red-200",
      badgeColor: "bg-red-600",
    };
  }

  return {
    status: "In Progress",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    badgeColor: "bg-amber-600",
  };
};
