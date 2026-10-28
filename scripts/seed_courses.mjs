import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcv1MNA2p3JX2bIku2J5n36Kui-QKD_bM",
  authDomain: "bustrack-d929f.firebaseapp.com",
  projectId: "bustrack-d929f",
  storageBucket: "bustrack-d929f.firebasestorage.app",
  messagingSenderId: "610161394232",
  appId: "1:610161394232:web:63fc29a927fbb39d721ccd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Checking existing published courses in Firestore...");
  const snap = await getDocs(query(collection(db, "courses"), where("published", "==", true)));
  if (!snap.empty) {
    console.log(`Already found ${snap.docs.length} published courses in Firestore.`);
    process.exit(0);
  }

  console.log("Seeding 6 comprehensive initial courses with lessons & quizzes...");

  const courses = [
    {
      title: "The Complete 2026 Full-Stack Web Development Bootcamp",
      description: "Master modern HTML5, CSS3, Tailwind CSS, JavaScript ES6+, React 19, Node.js, Express, and Firestore. Build and deploy real world production SaaS applications from scratch.",
      category: "Web Development",
      thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
      teacherId: "teacher_angela",
      teacherName: "Dr. Angela Martinez",
      published: true,
      lessons: [
        { title: "Introduction to Modern Web Architecture", youtubeUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE", order: 1 },
        { title: "Component-Driven UI with React and Tailwind CSS", youtubeUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8", order: 2 },
        { title: "State Management and Custom Hooks", youtubeUrl: "https://www.youtube.com/watch?v=4ORZ1GmjaMc", order: 3 },
        { title: "Connecting Cloud Firestore & Realtime Listeners", youtubeUrl: "https://www.youtube.com/watch?v=2yvhCygXz3A", order: 4 },
      ],
      questions: [
        { question: "Which hook in React is used to execute side effects like data subscriptions?", options: ["useEffect", "useState", "useMemo", "useCallback"], correctIndex: 0 },
        { question: "What is the primary benefit of Vite's Hot Module Replacement (HMR)?", options: ["Instant UI updates without losing component state", "Automatic database migrations", "Compiling Java into bytecode", "Server-side rendering only"], correctIndex: 0 },
      ],
    },
    {
      title: "Deep Learning, PyTorch & Generative AI Mastery",
      description: "Comprehensive hands-on training covering transformer architectures, Large Language Models (LLMs), prompt engineering, diffusion models, and PyTorch tensors.",
      category: "AI & Machine Learning",
      thumbnail: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
      teacherId: "teacher_vikram",
      teacherName: "Prof. Vikram Sharma",
      published: true,
      lessons: [
        { title: "Neural Networks Foundations & Backpropagation", youtubeUrl: "https://www.youtube.com/watch?v=aircAruvnKk", order: 1 },
        { title: "PyTorch Deep Dive: Tensors & Autograd", youtubeUrl: "https://www.youtube.com/watch?v=EMXFZB8FVUA", order: 2 },
        { title: "Transformer Attention Mechanisms Demystified", youtubeUrl: "https://www.youtube.com/watch?v=dichICs62e4", order: 3 },
      ],
      questions: [
        { question: "What mechanism allows transformers to weigh relationships between all tokens simultaneously?", options: ["Self-Attention", "Gradient Clipping", "Recurrent Loops", "Max Pooling"], correctIndex: 0 },
      ],
    },
    {
      title: "AWS Certified Solutions Architect & DevOps Pipeline",
      description: "Design scalable, fault-tolerant enterprise cloud infrastructures on AWS. Master IAM, VPCs, EC2, ECS, Lambda, Docker, Kubernetes, and CI/CD automation with GitHub Actions.",
      category: "Cloud & DevOps",
      thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
      teacherId: "teacher_david",
      teacherName: "David Miller, Cloud Architect",
      published: true,
      lessons: [
        { title: "AWS Global Infrastructure & High Availability Setup", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 1 },
        { title: "Containerizing Apps with Docker and AWS ECS Fargate", youtubeUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE", order: 2 },
      ],
      questions: [
        { question: "Which AWS service enables running serverless containers without managing servers?", options: ["AWS Fargate", "AWS EC2 On-Demand", "AWS S3 Glacier", "AWS Snowball"], correctIndex: 0 },
      ],
    },
    {
      title: "Modern UI/UX Design System with Figma & Framer",
      description: "Learn how to build world-class design systems, typography hierarchies, auto-layout components, interactive prototypes, and production design handoffs.",
      category: "Design & UX",
      thumbnail: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
      teacherId: "teacher_elena",
      teacherName: "Elena Rostova",
      published: true,
      lessons: [
        { title: "Design Principles, Grid Systems & Visual Balance", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 1 },
        { title: "Building Reusable Component Libraries in Figma", youtubeUrl: "https://www.youtube.com/watch?v=k74IrUNaJVk", order: 2 },
      ],
      questions: [
        { question: "In Figma, which feature allows components to resize dynamically based on content?", options: ["Auto Layout", "Boolean Groups", "Masking", "Vector Networks"], correctIndex: 0 },
      ],
    },
    {
      title: "Data Science, Statistics & Python for Business Analytics",
      description: "Analyze enterprise datasets using Python, Pandas, NumPy, Matplotlib, and Scikit-Learn. Learn exploratory data analysis, A/B testing, and predictive forecasting.",
      category: "Data Science",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      teacherId: "teacher_sarah",
      teacherName: "Sarah Jenkins, Lead Data Scientist",
      published: true,
      lessons: [
        { title: "Exploratory Data Analysis with Pandas & Seaborn", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 1 },
        { title: "Statistical Hypothesis Testing & A/B Experiments", youtubeUrl: "https://www.youtube.com/watch?v=0oc49DyA3hU", order: 2 },
      ],
      questions: [
        { question: "Which Python library is industry standard for manipulating structured tabular data?", options: ["Pandas", "Pygame", "Flask", "BeautifulSoup"], correctIndex: 0 },
      ],
    },
    {
      title: "Growth Marketing, SEO & Brand Strategy Masterclass",
      description: "Scale digital products with data-backed organic acquisition, technical SEO audits, high-converting copy, and paid campaign performance tracking.",
      category: "Business & Marketing",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      teacherId: "teacher_alex",
      teacherName: "Alex Vance, VP of Growth",
      published: true,
      lessons: [
        { title: "Organic Search Foundations & Keyword Opportunity Sizing", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 1 },
      ],
      questions: [
        { question: "What metric measures the percentage of visitors who complete a desired target action?", options: ["Conversion Rate (CR)", "Bounce Rate", "Impression Share", "Cost Per Click (CPC)"], correctIndex: 0 },
      ],
    },
  ];

  for (const c of courses) {
    const { lessons, questions, ...fields } = c;
    const ref = await addDoc(collection(db, "courses"), {
      ...fields,
      createdAt: serverTimestamp(),
    });
    console.log(`Created course: ${fields.title} (ID: ${ref.id})`);

    for (const l of lessons) {
      await addDoc(collection(db, "courses", ref.id, "lessons"), {
        ...l,
        createdAt: serverTimestamp(),
      });
    }

    for (const q of questions) {
      await addDoc(collection(db, "courses", ref.id, "questions"), {
        ...q,
        createdAt: serverTimestamp(),
      });
    }
  }

  console.log("Successfully seeded all courses into Firestore!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
