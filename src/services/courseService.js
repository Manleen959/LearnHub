import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export const CATEGORIES = [
  "Web Development",
  "AI & Machine Learning",
  "Data Science",
  "Cloud & DevOps",
  "Design & UX",
  "Business & Marketing",
];

export const SAMPLE_THUMBNAILS = [
  {
    name: "Web Development",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Artificial Intelligence",
    url: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Cloud & DevOps",
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mobile App Dev",
    url: "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Modern UI/UX Design",
    url: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Cybersecurity & Networks",
    url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Data Analytics & Python",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
  },
];

// Subscribe to published courses for public catalog
export const subscribeToPublishedCourses = (callback) => {
  if (!db) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(collection(db, "courses"), where("published", "==", true));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        callback(list);
      },
      (error) => {
        console.warn("Firestore published courses error:", error);
        callback([]);
      }
    );
  } catch (err) {
    console.error("subscribeToPublishedCourses error:", err);
    callback([]);
    return () => {};
  }
};

// Subscribe to teacher's own courses
export const subscribeToTeacherCourses = (teacherId, callback) => {
  if (!db || !teacherId) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(
      collection(db, "courses"),
      where("teacherId", "==", teacherId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // Sort newest first in memory to avoid requiring a composite index
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        callback(list);
      },
      (error) => {
        console.warn("Firestore teacher courses error:", error);
        callback([]);
      }
    );
  } catch (err) {
    console.error("subscribeToTeacherCourses error:", err);
    callback([]);
    return () => {};
  }
};

// Get single course
export const getCourseById = async (courseId) => {
  if (!db) return null;
  const snap = await getDoc(doc(db, "courses", courseId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

// Create Course
export const createCourse = async (courseData) => {
  if (!db) throw new Error("Database not connected");
  const docRef = await addDoc(collection(db, "courses"), {
    ...courseData,
    published: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update Course
export const updateCourse = async (courseId, data) => {
  if (!db) throw new Error("Database not connected");
  await updateDoc(doc(db, "courses", courseId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Toggle Publish status
export const togglePublishCourse = async (courseId, currentPublished) => {
  if (!db) throw new Error("Database not connected");
  await updateDoc(doc(db, "courses", courseId), {
    published: !currentPublished,
  });
};

// Delete Course
export const deleteCourse = async (courseId) => {
  if (!db) throw new Error("Database not connected");
  // Delete subcollection lessons & questions
  try {
    const lessonsSnap = await getDocs(collection(db, "courses", courseId, "lessons"));
    for (const d of lessonsSnap.docs) {
      await deleteDoc(d.ref);
    }
    const questionsSnap = await getDocs(collection(db, "courses", courseId, "questions"));
    for (const d of questionsSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (e) {
    console.warn("Cleaning subcollections error:", e);
  }
  await deleteDoc(doc(db, "courses", courseId));
};

// --- Lessons Subcollection ---

export const subscribeToLessons = (courseId, callback) => {
  if (!db || !courseId) {
    callback([]);
    return () => {};
  }
  const q = collection(db, "courses", courseId, "lessons");
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      callback(list);
    },
    (err) => {
      console.warn("subscribeToLessons error:", err);
      callback([]);
    }
  );
};

export const addLesson = async (courseId, lessonData) => {
  if (!db) throw new Error("Database not connected");
  const colRef = collection(db, "courses", courseId, "lessons");
  const docRef = await addDoc(colRef, {
    title: lessonData.title,
    youtubeUrl: lessonData.youtubeUrl,
    order: Number(lessonData.order) || 1,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const deleteLesson = async (courseId, lessonId) => {
  if (!db) throw new Error("Database not connected");
  await deleteDoc(doc(db, "courses", courseId, "lessons", lessonId));
};

// --- Questions Subcollection (Quiz) ---

export const subscribeToQuestions = (courseId, callback) => {
  if (!db || !courseId) {
    callback([]);
    return () => {};
  }
  const q = collection(db, "courses", courseId, "questions");
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
      console.warn("subscribeToQuestions error:", err);
      callback([]);
    }
  );
};

export const addQuestion = async (courseId, questionData) => {
  if (!db) throw new Error("Database not connected");
  const colRef = collection(db, "courses", courseId, "questions");
  const docRef = await addDoc(colRef, {
    question: questionData.question,
    options: questionData.options, // array of 4 strings
    correctIndex: Number(questionData.correctIndex),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const deleteQuestion = async (courseId, questionId) => {
  if (!db) throw new Error("Database not connected");
  await deleteDoc(doc(db, "courses", courseId, "questions", questionId));
};

// Seed 6+ rich courses with lessons and quiz questions
export const seedInitialCourses = async (teacherId, teacherName) => {
  if (!db) throw new Error("Database not connected");

  const initialList = [
    {
      title: "The Complete 2026 Full-Stack Web Development Bootcamp",
      description:
        "Master modern HTML5, CSS3, Tailwind CSS, JavaScript ES6+, React 19, Node.js, Express, and Firestore. Build and deploy real world production SaaS applications from scratch.",
      category: "Web Development",
      thumbnail:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      teacherId: teacherId || "teacher_angela",
      teacherName: teacherName || "Dr. Angela Martinez",
      published: true,
      lessons: [
        {
          title: "Introduction to Modern Web Architecture",
          youtubeUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE",
          order: 1,
        },
        {
          title: "Component-Driven UI with React and Tailwind CSS",
          youtubeUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8",
          order: 2,
        },
        {
          title: "State Management and Custom Hooks",
          youtubeUrl: "https://www.youtube.com/watch?v=4ORZ1GmjaMc",
          order: 3,
        },
        {
          title: "Connecting Cloud Firestore & Realtime Listeners",
          youtubeUrl: "https://www.youtube.com/watch?v=2yvhCygXz3A",
          order: 4,
        },
      ],
      questions: [
        {
          question: "Which hook in React is used to execute side effects like data subscriptions?",
          options: ["useEffect", "useState", "useMemo", "useCallback"],
          correctIndex: 0,
        },
        {
          question: "What is the primary benefit of Vite's Hot Module Replacement (HMR)?",
          options: [
            "Instant UI updates without losing component state",
            "Automatic database migrations",
            "Compiling Java into bytecode",
            "Server-side rendering only",
          ],
          correctIndex: 0,
        },
      ],
    },
    {
      title: "Deep Learning, PyTorch & Generative AI Mastery",
      description:
        "Comprehensive hands-on training covering transformer architectures, Large Language Models (LLMs), prompt engineering, diffusion models, and PyTorch tensors.",
      category: "AI & Machine Learning",
      thumbnail:
        "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
      teacherId: teacherId || "teacher_vikram",
      teacherName: teacherName || "Prof. Vikram Sharma",
      published: true,
      lessons: [
        {
          title: "Neural Networks Foundations & Backpropagation",
          youtubeUrl: "https://www.youtube.com/watch?v=aircAruvnKk",
          order: 1,
        },
        {
          title: "PyTorch Deep Dive: Tensors & Autograd",
          youtubeUrl: "https://www.youtube.com/watch?v=EMXFZB8FVUA",
          order: 2,
        },
        {
          title: "Transformer Attention Mechanisms Demystified",
          youtubeUrl: "https://www.youtube.com/watch?v=dichICs62e4",
          order: 3,
        },
      ],
      questions: [
        {
          question: "What mechanism allows transformers to weigh relationships between all tokens simultaneously?",
          options: ["Self-Attention", "Gradient Clipping", "Recurrent Loops", "Max Pooling"],
          correctIndex: 0,
        },
      ],
    },
    {
      title: "AWS Certified Solutions Architect & DevOps Pipeline",
      description:
        "Design scalable, fault-tolerant enterprise cloud infrastructures on AWS. Master IAM, VPCs, EC2, ECS, Lambda, Docker, Kubernetes, and CI/CD automation with GitHub Actions.",
      category: "Cloud & DevOps",
      thumbnail:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
      teacherId: teacherId || "teacher_david",
      teacherName: teacherName || "David Miller, Cloud Architect",
      published: true,
      lessons: [
        {
          title: "AWS Global Infrastructure & High Availability Setup",
          youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s",
          order: 1,
        },
        {
          title: "Containerizing Apps with Docker and AWS ECS Fargate",
          youtubeUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE",
          order: 2,
        },
      ],
      questions: [
        {
          question: "Which AWS service enables running serverless containers without managing servers?",
          options: ["AWS Fargate", "AWS EC2 On-Demand", "AWS S3 Glacier", "AWS Snowball"],
          correctIndex: 0,
        },
      ],
    },
    {
      title: "Modern UI/UX Design System with Figma & Framer",
      description:
        "Learn how to build world-class design systems, typography hierarchies, auto-layout components, interactive prototypes, and production design handoffs.",
      category: "Design & UX",
      thumbnail:
        "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
      teacherId: teacherId || "teacher_elena",
      teacherName: teacherName || "Elena Rostova",
      published: true,
      lessons: [
        {
          title: "Design Principles, Grid Systems & Visual Balance",
          youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU",
          order: 1,
        },
        {
          title: "Building Reusable Component Libraries in Figma",
          youtubeUrl: "https://www.youtube.com/watch?v=k74IrUNaJVk",
          order: 2,
        },
      ],
      questions: [
        {
          question: "In Figma, which feature allows components to resize dynamically based on content?",
          options: ["Auto Layout", "Boolean Groups", "Masking", "Vector Networks"],
          correctIndex: 0,
        },
      ],
    },
    {
      title: "Data Science, Statistics & Python for Business Analytics",
      description:
        "Analyze enterprise datasets using Python, Pandas, NumPy, Matplotlib, and Scikit-Learn. Learn exploratory data analysis, A/B testing, and predictive forecasting.",
      category: "Data Science",
      thumbnail:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      teacherId: teacherId || "teacher_sarah",
      teacherName: teacherName || "Sarah Jenkins, Lead Data Scientist",
      published: true,
      lessons: [
        {
          title: "Exploratory Data Analysis with Pandas & Seaborn",
          youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg",
          order: 1,
        },
        {
          title: "Statistical Hypothesis Testing & A/B Experiments",
          youtubeUrl: "https://www.youtube.com/watch?v=0oc49DyA3hU",
          order: 2,
        },
      ],
      questions: [
        {
          question: "Which Python library is industry standard for manipulating structured tabular data?",
          options: ["Pandas", "Pygame", "Flask", "BeautifulSoup"],
          correctIndex: 0,
        },
      ],
    },
    {
      title: "Growth Marketing, SEO & Brand Strategy Masterclass",
      description:
        "Scale digital products with data-backed organic acquisition, technical SEO audits, high-converting copy, and paid campaign performance tracking.",
      category: "Business & Marketing",
      thumbnail:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      teacherId: teacherId || "teacher_alex",
      teacherName: teacherName || "Alex Vance, VP of Growth",
      published: true,
      lessons: [
        {
          title: "Organic Search Foundations & Keyword Opportunity Sizing",
          youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ",
          order: 1,
        },
      ],
      questions: [
        {
          question: "What metric measures the percentage of visitors who complete a desired target action?",
          options: ["Conversion Rate (CR)", "Bounce Rate", "Impression Share", "Cost Per Click (CPC)"],
          correctIndex: 0,
        },
      ],
    },
  ];

  for (const item of initialList) {
    const { lessons, questions, ...courseFields } = item;
    const courseRef = await addDoc(collection(db, "courses"), {
      ...courseFields,
      createdAt: serverTimestamp(),
    });

    for (const lesson of lessons) {
      await addDoc(collection(db, "courses", courseRef.id, "lessons"), {
        ...lesson,
        createdAt: serverTimestamp(),
      });
    }

    for (const q of questions) {
      await addDoc(collection(db, "courses", courseRef.id, "questions"), {
        ...q,
        createdAt: serverTimestamp(),
      });
    }
  }
};
