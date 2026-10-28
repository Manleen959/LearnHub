# LearnHub – Digital Learning & Training Management System

A modern, full-stack digital learning platform inspired by Udemy's aesthetics, featuring role-based dashboards (Student, Educator, Admin), live classroom video playback, and AI-powered learning assistance driven by Google Gemma models on NVIDIA NIM.

---

## 🚀 Key Features

### 🎓 Student Experience & Learning Classroom
- **Interactive Course Catalog**: Browse by technology categories, search with real-time filters, and preview comprehensive curriculum modules.
- **Dedicated Classroom Interface**: Stream 16:9 lecture videos, track module-by-module completion, and navigate smoothly between chapters.
- **Ask AI Tutor (Gemma Floating Panel)**: Context-aware interactive tutor assistant to answer doubts specific to the active course topic.
- **AI-Synthesized High-Yield Study Notes**: One-click summary, 5 key concepts, and practice questions cached directly to Firestore with copy-to-clipboard support.
- **AI Performance Coach**: Diagnostic analysis for quiz attempts scoring under 100%, highlighting weak topics and generating a 3-step actionable study plan.
- **Gamification & Leaderboard**: Earn XP (+10 per first completed lesson, +50 per passed quiz, +25 score bonus for >=90%), maintain daily streaks, unlock badges ("First Step", "Quiz Master", "Perfectionist", "On Fire", "Scholar"), and compete on the global Top 10 Leaderboard.
- **Mandatory Compliance Training**: Real-time tracking of assigned compliance courses with countdown badges and status tracking.
- **Verified Digital Certificates**: Unique printable credentials with instant public verification at `/verify/:certificateId`.

### 👨‍🏫 Educator Dashboard
- **Curriculum Authoring**: Create courses, manage draft vs. published states, add YouTube lessons, and set up multiple-choice quizzes.
- **Live Learning Analytics**: Monitor total enrollments, completion rates, and average quiz scores across authored courses with interactive Recharts bar charts and a student roster progress table.

### 🛡️ Admin Management & Governance
- **Platform Overview**: Aggregate statistics and enrollment distribution charts.
- **Educator Approval Pipeline**: Approve or reject educator account applications with automated security guard transitions.
- **Mandatory Training Assignment**: Assign specific courses and completion deadlines to individual learners.
- **Course Administration**: Unpublish or remove any course across the catalog.

### 🧠 Serverless AI Architecture
- **NVIDIA NIM Serverless Endpoints**: `/api/generate-quiz` and `/api/ai-assist` execute on Vercel Node runtime.
- **Google Gemma Models**: Employs `google/gemma-4-31b-it` with automatic failover to high-speed instruction models (`nvidia/nemotron-3.5-bolt-e4b`).
- **Zero Key Exposure & Protected Access**: Frontend never sees or handles `NVIDIA_API_KEY`. Requests are authorized via Firebase ID Tokens.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts
- **Routing**: React Router v7 with role-based protected routes
- **Backend / Serverless**: Vercel Serverless Functions (`/api/*`)
- **Database & Auth**: Firebase Authentication & Cloud Firestore (No Firebase Storage required)
- **AI Inference**: NVIDIA NIM API (`google/gemma-4-31b-it` & `nvidia/nemotron-3.5-bolt-e4b`)

---

## 📦 Environment Setup

### 1. Prerequisites
- Node.js (v18 or later)
- npm or pnpm
- A Firebase project with Email/Password & Google Auth and Cloud Firestore enabled
- An NVIDIA NIM API Key from [build.nvidia.com](https://build.nvidia.com)

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Populate the required keys in `.env`:

```env
# Firebase Web Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id_here

# Server-side Firebase Auth Token Verification
FIREBASE_API_KEY=your_firebase_api_key_here

# NVIDIA NIM AI Service
NVIDIA_API_KEY=nvapi-your_nvidia_api_key_here
NVIDIA_MODEL=google/gemma-4-31b-it
```

### 3. Install & Run Locally

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Deploy Firestore Security Rules

Deploy rules to ensure all collections (`users`, `courses`, `lessons`, `enrollments`, `notes`, `certificates`, `leaderboard`, `trainingAssignments`) are locked down:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
```

---

## ☁️ Vercel Deployment

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import your GitHub repository.
3. In **Settings -> Environment Variables**, add each variable defined in your `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `FIREBASE_API_KEY`
   - `NVIDIA_API_KEY`
   - `NVIDIA_MODEL`
4. Click **Deploy**. Vercel will build the frontend via `npm run build` and route serverless APIs via `vercel.json`.
