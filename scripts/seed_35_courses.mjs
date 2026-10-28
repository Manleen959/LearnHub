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

const newCourses = [
  // --- Web Development ---
  {
    title: "Next.js 15 & React 19 Full-Stack SaaS Masterclass",
    description: "Build production enterprise applications with Server Components, Server Actions, Stripe payments, and Tailwind CSS.",
    category: "Web Development",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_alex",
    teacherName: "Alex Rivera",
    published: true,
    lessons: [
      { title: "React 19 Server Components Architecture", youtubeUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE", order: 1 },
      { title: "Next.js App Router & Dynamic Parallel Routes", youtubeUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8", order: 2 },
      { title: "Server Actions and Safe Form Validations with Zod", youtubeUrl: "https://www.youtube.com/watch?v=4ORZ1GmjaMc", order: 3 },
      { title: "Integrating Stripe Checkout & Webhook Handlers", youtubeUrl: "https://www.youtube.com/watch?v=2yvhCygXz3A", order: 4 },
    ],
  },
  {
    title: "TypeScript Enterprise Design Patterns & Clean Architecture",
    description: "Write ultra type-safe scalable code using SOLID principles, generics, AST transformations, and domain-driven design.",
    category: "Web Development",
    thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_sebastian",
    teacherName: "Sebastian Mueller",
    published: true,
    lessons: [
      { title: "Advanced Generics and Conditional Type Utilities", youtubeUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE", order: 1 },
      { title: "Domain Driven Design in Monorepo TypeScript", youtubeUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8", order: 2 },
      { title: "Dependency Injection & Repository Abstraction", youtubeUrl: "https://www.youtube.com/watch?v=4ORZ1GmjaMc", order: 3 },
    ],
  },
  {
    title: "Vue 3, Pinia & Nuxt Full-Stack Web Development",
    description: "Create blazingly fast universal web apps using Vue 3 Composition API, Pinia state stores, and Nuxt server engine.",
    category: "Web Development",
    thumbnail: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_claire",
    teacherName: "Claire Dubois",
    published: true,
    lessons: [
      { title: "Composition API Script Setup & Reactivity Fundamentals", youtubeUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE", order: 1 },
      { title: "Pinia State Management & Persistent Plugins", youtubeUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8", order: 2 },
      { title: "Nuxt SSR, Nitro Engine & Universal Rendering", youtubeUrl: "https://www.youtube.com/watch?v=4ORZ1GmjaMc", order: 3 },
    ],
  },
  {
    title: "Building Real-Time Apps with WebSockets & Node.js",
    description: "Architect high-concurrency event-driven collaborative apps using Socket.io, Redis Pub/Sub, and Node.js microservices.",
    category: "Web Development",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_marcus",
    teacherName: "Marcus Sterling",
    published: true,
    lessons: [
      { title: "WebSocket Handshake Protocols vs HTTP Polling", youtubeUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE", order: 1 },
      { title: "Scaling WebSocket Clusters with Redis PubSub", youtubeUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8", order: 2 },
      { title: "Building a Live Collaborative Drawing Canvas", youtubeUrl: "https://www.youtube.com/watch?v=4ORZ1GmjaMc", order: 3 },
    ],
  },
  {
    title: "Modern GraphQL APIs with Apollo Server & Node",
    description: "Design flexible, strongly-typed GraphQL schemas, optimize query resolvers with DataLoader, and implement subgraphs.",
    category: "Web Development",
    thumbnail: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_lucas",
    teacherName: "Lucas Chen",
    published: true,
    lessons: [
      { title: "Schema Definition Language & Query Resolvers", youtubeUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE", order: 1 },
      { title: "Solving the N+1 Query Problem with DataLoader", youtubeUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8", order: 2 },
      { title: "Subscriptions & Real-time GraphQL Streams", youtubeUrl: "https://www.youtube.com/watch?v=4ORZ1GmjaMc", order: 3 },
    ],
  },
  {
    title: "Progressive Web Apps (PWA) & Offline-First Web",
    description: "Master service workers, IndexedDB offline caching, background sync, and push notifications for mobile-grade web apps.",
    category: "Web Development",
    thumbnail: "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_nina",
    teacherName: "Nina Kowalski",
    published: true,
    lessons: [
      { title: "Service Worker Lifecycle & Cache Storage Strategies", youtubeUrl: "https://www.youtube.com/watch?v=UB1O30fR-EE", order: 1 },
      { title: "Storing Offline Transactions in IndexedDB", youtubeUrl: "https://www.youtube.com/watch?v=bMknfKXIFA8", order: 2 },
      { title: "Push Notifications & Web App Manifest Configuration", youtubeUrl: "https://www.youtube.com/watch?v=4ORZ1GmjaMc", order: 3 },
    ],
  },

  // --- AI & Machine Learning ---
  {
    title: "Building LLM Applications with LangChain & LlamaIndex",
    description: "Harness Large Language Models to build autonomous agentic workflows, Retrieval-Augmented Generation (RAG), and vector search.",
    category: "AI & Machine Learning",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_vikram",
    teacherName: "Prof. Vikram Sharma",
    published: true,
    lessons: [
      { title: "Foundations of Prompt Engineering and Few-Shot In-Context Learning", youtubeUrl: "https://www.youtube.com/watch?v=aircAruvnKk", order: 1 },
      { title: "Vector Embeddings & Semantic Search with Pinecone and FAISS", youtubeUrl: "https://www.youtube.com/watch?v=EMXFZB8FVUA", order: 2 },
      { title: "Building Multi-Step Autonomous Reasoning Agents with LangGraph", youtubeUrl: "https://www.youtube.com/watch?v=dichICs62e4", order: 3 },
    ],
  },
  {
    title: "Computer Vision & YOLOv10 Object Detection Bootcamp",
    description: "Train custom neural vision models for real-time object tracking, segmentation, facial recognition, and autonomous driving.",
    category: "AI & Machine Learning",
    thumbnail: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_maya",
    teacherName: "Dr. Maya Patel",
    published: true,
    lessons: [
      { title: "Image Processing Pipelines with OpenCV in Python", youtubeUrl: "https://www.youtube.com/watch?v=aircAruvnKk", order: 1 },
      { title: "Convolutional Neural Networks & Feature Extraction", youtubeUrl: "https://www.youtube.com/watch?v=EMXFZB8FVUA", order: 2 },
      { title: "Fine-tuning YOLO for Custom Real-Time Video Detection", youtubeUrl: "https://www.youtube.com/watch?v=dichICs62e4", order: 3 },
    ],
  },
  {
    title: "Natural Language Processing (NLP) with Hugging Face",
    description: "Fine-tune BERT, RoBERTa, and open weights models for sentiment classification, named entity recognition, and text generation.",
    category: "AI & Machine Learning",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_vikram",
    teacherName: "Prof. Vikram Sharma",
    published: true,
    lessons: [
      { title: "Tokenization Strategies & BPE Algorithms", youtubeUrl: "https://www.youtube.com/watch?v=aircAruvnKk", order: 1 },
      { title: "Hugging Face Transformers Pipeline & Dataset Hub", youtubeUrl: "https://www.youtube.com/watch?v=EMXFZB8FVUA", order: 2 },
      { title: "LoRA & QLoRA Parameter-Efficient Fine-Tuning", youtubeUrl: "https://www.youtube.com/watch?v=dichICs62e4", order: 3 },
    ],
  },
  {
    title: "Reinforcement Learning & Q-Learning from Scratch",
    description: "Develop intelligent agents capable of mastering Atari games, robotics navigation, and Markov Decision Processes.",
    category: "AI & Machine Learning",
    thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_dmitri",
    teacherName: "Dr. Dmitri Volkov",
    published: true,
    lessons: [
      { title: "Markov Decision Processes & Bellman Optimality Equations", youtubeUrl: "https://www.youtube.com/watch?v=aircAruvnKk", order: 1 },
      { title: "Deep Q-Networks (DQN) with PyTorch & Gymnasium", youtubeUrl: "https://www.youtube.com/watch?v=EMXFZB8FVUA", order: 2 },
      { title: "Policy Gradient Algorithms and Proximal Policy Optimization (PPO)", youtubeUrl: "https://www.youtube.com/watch?v=dichICs62e4", order: 3 },
    ],
  },
  {
    title: "Generative AI: Diffusion Models & Creative Synthesis",
    description: "Understand the mathematical principles of score matching, U-Nets, and latent diffusion to generate studio quality imagery.",
    category: "AI & Machine Learning",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_maya",
    teacherName: "Dr. Maya Patel",
    published: true,
    lessons: [
      { title: "Forward and Reverse Markov Diffusion Processes", youtubeUrl: "https://www.youtube.com/watch?v=aircAruvnKk", order: 1 },
      { title: "Conditioning Diffusion with Cross-Attention & CLIP Text Embeddings", youtubeUrl: "https://www.youtube.com/watch?v=EMXFZB8FVUA", order: 2 },
      { title: "Latent Diffusion Architecture & VAE Decoding", youtubeUrl: "https://www.youtube.com/watch?v=dichICs62e4", order: 3 },
    ],
  },
  {
    title: "Deploying AI Models to Production with Triton & FastAPI",
    description: "Ship machine learning models at scale with GPU inference batching, ONNX runtime conversion, and Dockerized microservices.",
    category: "AI & Machine Learning",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_alex",
    teacherName: "Alex Rivera",
    published: true,
    lessons: [
      { title: "Optimizing Models into ONNX and TensorRT Engines", youtubeUrl: "https://www.youtube.com/watch?v=aircAruvnKk", order: 1 },
      { title: "Serving Low Latency Predictions with FastAPI & Async Workers", youtubeUrl: "https://www.youtube.com/watch?v=EMXFZB8FVUA", order: 2 },
      { title: "Deploying NVIDIA Triton Inference Server on Kubernetes", youtubeUrl: "https://www.youtube.com/watch?v=dichICs62e4", order: 3 },
    ],
  },

  // --- Cloud & DevOps ---
  {
    title: "Kubernetes & Docker Container Orchestration Mastery",
    description: "Deploy, scale, and manage fault-tolerant microservices using Kubernetes pods, ingress controllers, Helm charts, and GitOps.",
    category: "Cloud & DevOps",
    thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_david",
    teacherName: "David Miller, Cloud Architect",
    published: true,
    lessons: [
      { title: "Container Fundamentals & Multi-Stage Dockerfile Optimization", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 1 },
      { title: "Kubernetes Pods, Deployments & Service ClusterIP Routing", youtubeUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE", order: 2 },
      { title: "Configuring Ingress NGINX & Cert-Manager SSL Automation", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 3 },
      { title: "GitOps Workflows with ArgoCD and Helm Package Management", youtubeUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE", order: 4 },
    ],
  },
  {
    title: "Terraform & Infrastructure as Code (IaC) Enterprise",
    description: "Automate multi-cloud infrastructure provisioning on AWS, GCP, and Azure with reusable modules, state locking, and CI/CD.",
    category: "Cloud & DevOps",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_david",
    teacherName: "David Miller, Cloud Architect",
    published: true,
    lessons: [
      { title: "HCL Syntax, Providers, and Terraform Execution Plans", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 1 },
      { title: "Managing Remote S3 State Backends and DynamoDB Locks", youtubeUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE", order: 2 },
      { title: "Creating Production Reusable VPC Modules", youtubeUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE", order: 3 },
    ],
  },
  {
    title: "Google Cloud Platform (GCP) Professional Cloud Architect",
    description: "Ace the GCP Professional Certification. Master BigQuery, Cloud Run, GKE, IAM security policies, and global networking.",
    category: "Cloud & DevOps",
    thumbnail: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_ananya",
    teacherName: "Ananya Roy",
    published: true,
    lessons: [
      { title: "GCP Global VPCs, Subnets & Inter-Region Peering", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 1 },
      { title: "Serverless Microservices with Google Cloud Run and Eventarc", youtubeUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE", order: 2 },
      { title: "BigQuery Enterprise Analytics and Data Warehouse Modeling", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 3 },
    ],
  },
  {
    title: "Site Reliability Engineering (SRE) & Observability",
    description: "Implement SLIs, SLOs, distributed tracing, Prometheus metrics scraping, and Grafana dashboards for 99.99% system uptime.",
    category: "Cloud & DevOps",
    thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_marcus",
    teacherName: "Marcus Sterling",
    published: true,
    lessons: [
      { title: "Defining Error Budgets, SLIs, and SLOs for Critical Services", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 1 },
      { title: "Prometheus Metrics Architecture and Alertmanager Rules", youtubeUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE", order: 2 },
      { title: "Distributed Tracing with OpenTelemetry and Jaeger", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 3 },
    ],
  },
  {
    title: "Linux Server Administration & Shell Scripting Bootcamp",
    description: "From bash scripting and cron automation to systemd service management, kernel tuning, and SSH hardening.",
    category: "Cloud & DevOps",
    thumbnail: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_sebastian",
    teacherName: "Sebastian Mueller",
    published: true,
    lessons: [
      { title: "Bash Automation: Loops, Pipes, and Regex Filtering with Awk and Sed", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 1 },
      { title: "Systemd Unit Configurations and Daemon Process Management", youtubeUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE", order: 2 },
      { title: "IPTables, UFW Firewalls, and SSH Key Security", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 3 },
    ],
  },
  {
    title: "Practical DevSecOps: Automated Security in CI/CD",
    description: "Shift security left. Automate SAST, DAST, container vulnerability scanning with Trivy, and secret detection in pipelines.",
    category: "Cloud & DevOps",
    thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_david",
    teacherName: "David Miller, Cloud Architect",
    published: true,
    lessons: [
      { title: "Static Application Security Testing (SAST) with SonarQube", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 1 },
      { title: "Container Scanning in GitHub Actions with Trivy", youtubeUrl: "https://www.youtube.com/watch?v=gAkwW2tuIqE", order: 2 },
      { title: "Secrets Management using HashiCorp Vault", youtubeUrl: "https://www.youtube.com/watch?v=Ia-UEYYR44s", order: 3 },
    ],
  },

  // --- Design & UX ---
  {
    title: "User Experience (UX) Research & User Journey Mapping",
    description: "Conduct usability interviews, quantitative card sorting, heuristic evaluations, and interactive empathy mapping.",
    category: "Design & UX",
    thumbnail: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_elena",
    teacherName: "Elena Rostova",
    published: true,
    lessons: [
      { title: "Planning and Conducting Effective User Discovery Interviews", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 1 },
      { title: "Synthesizing Qualitative Insights with Affinity Diagrams", youtubeUrl: "https://www.youtube.com/watch?v=k74IrUNaJVk", order: 2 },
      { title: "Crafting High Impact User Journey Maps and Wireflows", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 3 },
    ],
  },
  {
    title: "Framer No-Code Web Design & Interactive Animation",
    description: "Build breathtaking, responsive websites with dynamic 3D scroll physics, component variants, and custom CMS collections.",
    category: "Design & UX",
    thumbnail: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_elena",
    teacherName: "Elena Rostova",
    published: true,
    lessons: [
      { title: "Framer Canvas Layouts, Stacks, and Responsive Breakpoints", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 1 },
      { title: "Creating Scroll-Triggered Parallax Motion & Hover Transforms", youtubeUrl: "https://www.youtube.com/watch?v=k74IrUNaJVk", order: 2 },
      { title: "Dynamic CMS Filtering & Production Custom Domain Publishing", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 3 },
    ],
  },
  {
    title: "Design Systems with Tokens, Variables & Code Handoff",
    description: "Establish tokens in Figma, sync design variables with GitHub via Style Dictionary, and streamline developer handoff.",
    category: "Design & UX",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_sebastian",
    teacherName: "Sebastian Mueller",
    published: true,
    lessons: [
      { title: "Semantic Color & Spacing Token Architecture in Figma", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 1 },
      { title: "Figma Variables & Dark Mode Automated Switching", youtubeUrl: "https://www.youtube.com/watch?v=k74IrUNaJVk", order: 2 },
      { title: "Automating Tokens into Tailwind CSS and React Component Props", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 3 },
    ],
  },
  {
    title: "Mobile App UI Design: iOS Human Interface & Material 3",
    description: "Design pixel-perfect mobile applications adhering strictly to Apple iOS HIG and Google Material You guidelines.",
    category: "Design & UX",
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_nina",
    teacherName: "Nina Kowalski",
    published: true,
    lessons: [
      { title: "iOS Navigation Patterns: Tab Bars, Large Titles & Modals", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 1 },
      { title: "Material 3 Dynamic Theming & Floating Action Components", youtubeUrl: "https://www.youtube.com/watch?v=k74IrUNaJVk", order: 2 },
      { title: "Touch Target Ergonomics & Haptic Feedback Guidelines", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 3 },
    ],
  },
  {
    title: "Accessible Web Design (WCAG 2.2 AA) for Digital Products",
    description: "Make websites fully accessible to all users. Master contrast ratios, ARIA landmarks, screen reader navigation, and keyboard focus states.",
    category: "Design & UX",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_claire",
    teacherName: "Claire Dubois",
    published: true,
    lessons: [
      { title: "Understanding WCAG 2.2 Compliance Levels and Color Contrast", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 1 },
      { title: "Accessible Semantic HTML vs Redundant ARIA Attributes", youtubeUrl: "https://www.youtube.com/watch?v=k74IrUNaJVk", order: 2 },
      { title: "Screen Reader Testing with VoiceOver and NVDA", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 3 },
    ],
  },
  {
    title: "Typography & Micro-Interactions in Digital Interfaces",
    description: "Elevate your web and mobile UI with typographic scale hierarchy, fluid font sizing, and delighting micro-animations.",
    category: "Design & UX",
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_elena",
    teacherName: "Elena Rostova",
    published: true,
    lessons: [
      { title: "Typographic Scales, Modular Ratios, and Fluid Clamp Units", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 1 },
      { title: "Designing Meaningful Button State Feedback and Transitions", youtubeUrl: "https://www.youtube.com/watch?v=k74IrUNaJVk", order: 2 },
      { title: "Micro-Interaction Psychology: Easing Curves and Spatial Consistency", youtubeUrl: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU", order: 3 },
    ],
  },

  // --- Data Science ---
  {
    title: "Advanced SQL & Database Modeling for Analytics Engineers",
    description: "Master window functions, recursive CTEs, query plan optimization, indexing strategies, and dimensional data warehouse modeling.",
    category: "Data Science",
    thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_sarah",
    teacherName: "Sarah Jenkins, Lead Data Scientist",
    published: true,
    lessons: [
      { title: "Complex Analytical Window Functions: Lead, Lag & Row_Number", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 1 },
      { title: "Recursive CTEs for Hierarchical and Graph Traversal Queries", youtubeUrl: "https://www.youtube.com/watch?v=0oc49DyA3hU", order: 2 },
      { title: "EXPLAIN ANALYZE: Reading Postgres Execution Plans and Indexes", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 3 },
    ],
  },
  {
    title: "dbt (data build tool) & Modern Data Stack Engineering",
    description: "Transform raw warehouse data using dbt, Snowflake, BigQuery, automated schema tests, and lineage documentation.",
    category: "Data Science",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_sarah",
    teacherName: "Sarah Jenkins, Lead Data Scientist",
    published: true,
    lessons: [
      { title: "Modern Data Stack Overview: Ingestion vs Transformation", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 1 },
      { title: "Building Modular Staging and Mart Models with dbt Core", youtubeUrl: "https://www.youtube.com/watch?v=0oc49DyA3hU", order: 2 },
      { title: "Testing Data Integrity & CI/CD Deployment with dbt Cloud", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 3 },
    ],
  },
  {
    title: "Tableau & Power BI Executive Dashboard Storytelling",
    description: "Translate complex business numbers into captivating executive visual reports, drill-downs, and automated refresh feeds.",
    category: "Data Science",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_ananya",
    teacherName: "Ananya Roy",
    published: true,
    lessons: [
      { title: "Visual Perception Principles: Preattentive Attributes in Charts", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 1 },
      { title: "DAX Measures and Calculated Columns in Power BI", youtubeUrl: "https://www.youtube.com/watch?v=0oc49DyA3hU", order: 2 },
      { title: "Designing Mobile-First Executive KPI Scorecards", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 3 },
    ],
  },
  {
    title: "Time Series Forecasting with Prophet & Arima in Python",
    description: "Predict stock trends, server workloads, and sales revenues using classical ARIMA, seasonal decomposition, and Meta Prophet.",
    category: "Data Science",
    thumbnail: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_dmitri",
    teacherName: "Dr. Dmitri Volkov",
    published: true,
    lessons: [
      { title: "Stationarity, Autocorrelation, and Dickey-Fuller Statistical Tests", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 1 },
      { title: "Building Auto-ARIMA Forecasting Pipelines in Python", youtubeUrl: "https://www.youtube.com/watch?v=0oc49DyA3hU", order: 2 },
      { title: "Trend, Seasonality, and Holiday Effects Modeling with Prophet", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 3 },
    ],
  },
  {
    title: "Apache Spark & Big Data Distributed Processing with PySpark",
    description: "Process multi-terabyte datasets across distributed compute clusters using PySpark DataFrames, Catalyst optimizer, and Spark SQL.",
    category: "Data Science",
    thumbnail: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_sarah",
    teacherName: "Sarah Jenkins, Lead Data Scientist",
    published: true,
    lessons: [
      { title: "Spark Distributed RDD Architecture & Driver-Worker Model", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 1 },
      { title: "PySpark Transformations, Actions, and Shuffle Partition Tuning", youtubeUrl: "https://www.youtube.com/watch?v=0oc49DyA3hU", order: 2 },
      { title: "Reading and Writing Partitioned Parquet & Delta Lake Tables", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 3 },
    ],
  },
  {
    title: "Statistical A/B Testing & Causal Inference for Product Teams",
    description: "Design rigorous online experiments. Control false positive rates, handle sample ratio mismatches, and measure causal lift.",
    category: "Data Science",
    thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_alex_vance",
    teacherName: "Alex Vance, VP of Growth",
    published: true,
    lessons: [
      { title: "Hypothesis Formulation, Null Distribution, and P-Value Realities", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 1 },
      { title: "Sample Size Calculation and Power Analysis to Prevent Underpowered Tests", youtubeUrl: "https://www.youtube.com/watch?v=0oc49DyA3hU", order: 2 },
      { title: "Detecting Sample Ratio Mismatch (SRM) & Variance Reduction with CUPED", youtubeUrl: "https://www.youtube.com/watch?v=vmEHCJofslg", order: 3 },
    ],
  },

  // --- Business & Marketing ---
  {
    title: "Technical Product Management (TPM) Masterclass",
    description: "Lead software engineering sprints, define PRDs, translate APIs for stakeholders, and manage product roadmaps like a Silicon Valley PM.",
    category: "Business & Marketing",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_alex_vance",
    teacherName: "Alex Vance, VP of Growth",
    published: true,
    lessons: [
      { title: "Writing Clear Product Requirement Documents (PRDs) That Engineers Respect", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 1 },
      { title: "Evaluating System Architecture Tradeoffs: Monolith vs Microservices", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 2 },
      { title: "Prioritization Frameworks: RICE vs Kano Model for Roadmap Strategy", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 3 },
    ],
  },
  {
    title: "Performance Marketing & Google Ads PPC Campaign Strategy",
    description: "Generate high ROI through search ads, Performance Max campaigns, negative keyword grouping, and conversion tracking.",
    category: "Business & Marketing",
    thumbnail: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_alex_vance",
    teacherName: "Alex Vance, VP of Growth",
    published: true,
    lessons: [
      { title: "Account Hierarchy and Search Intent Keyword Match Types", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 1 },
      { title: "Quality Score Breakdown: Expected CTR, Ad Relevance, and Landing Page Experience", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 2 },
      { title: "Smart Bidding Strategies: Target CPA vs Target ROAS Optimization", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 3 },
    ],
  },
  {
    title: "Startup Financial Modeling & Venture Capital Fundraising",
    description: "Construct 3-statement financial models, forecast customer acquisition cost (CAC), LTV, burn rate, and pitch angel investors.",
    category: "Business & Marketing",
    thumbnail: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_lucas",
    teacherName: "Lucas Chen",
    published: true,
    lessons: [
      { title: "SaaS Financial Metrics: MRR, Churn, CAC Payback, and Gross Margins", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 1 },
      { title: "Building a 3-Year Dynamic Pro-Forma Cash Flow Forecast in Excel", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 2 },
      { title: "Structuring SAFE Notes, Cap Tables, and Investor Pitch Decks", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 3 },
    ],
  },
  {
    title: "B2B SaaS Sales & Enterprise Account Executive Playbook",
    description: "Close high-value annual recurring revenue contracts using the MEDDPICC sales framework, outbound prospecting, and demo discovery.",
    category: "Business & Marketing",
    thumbnail: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_marcus",
    teacherName: "Marcus Sterling",
    published: true,
    lessons: [
      { title: "Prospecting Ideal Customer Profiles (ICP) and Cold Email Sequences", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 1 },
      { title: "The Discovery Call: Uncovering Pain, Budget, and Economic Buyers", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 2 },
      { title: "Enterprise Contract Negotiation and Security Review Approval", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 3 },
    ],
  },
  {
    title: "Content Marketing & Viral Audience Building on LinkedIn",
    description: "Write compelling thought-leadership essays, build a personal brand, generate inbound pipeline, and drive newsletter subscribers.",
    category: "Business & Marketing",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_claire",
    teacherName: "Claire Dubois",
    published: true,
    lessons: [
      { title: "Hook Writing Anatomy: Grabbing Attention in the First 3 Seconds", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 1 },
      { title: "Content Pillars & Repurposing Long-Form Case Studies into Carousels", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 2 },
      { title: "Converting Audience Attention into High-Intent Leads and Substack Subscribers", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 3 },
    ],
  },
  {
    title: "Customer Success & Retention Engineering for Software Products",
    description: "Reduce customer churn, increase net revenue retention (NRR), automate onboarding journeys, and turn users into brand evangelists.",
    category: "Business & Marketing",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    teacherId: "teacher_ananya",
    teacherName: "Ananya Roy",
    published: true,
    lessons: [
      { title: "Time to First Value (TTFV) and Seamless Onboarding Checklists", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 1 },
      { title: "Designing Customer Health Scores and Predicting Churn Risk Early", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 2 },
      { title: "Quarterly Business Reviews (QBRs) and Expansion Upselling Playbooks", youtubeUrl: "https://www.youtube.com/watch?v=DvwS7cV9GmQ", order: 3 },
    ],
  },
];

async function seedAll() {
  console.log(`Starting insertion of ${newCourses.length} comprehensive courses into Firestore...`);

  let count = 0;
  for (const c of newCourses) {
    const { lessons, ...fields } = c;
    const ref = await addDoc(collection(db, "courses"), {
      ...fields,
      createdAt: serverTimestamp(),
    });
    count++;
    console.log(`[${count}/${newCourses.length}] Created: "${fields.title}" (ID: ${ref.id})`);

    for (const l of lessons) {
      await addDoc(collection(db, "courses", ref.id, "lessons"), {
        ...l,
        createdAt: serverTimestamp(),
      });
    }
  }

  console.log(`\n🎉 Successfully inserted ${count} rich courses with curriculum lessons into Firestore!`);
  process.exit(0);
}

seedAll().catch((err) => {
  console.error("Seeding batch error:", err);
  process.exit(1);
});
