import React, { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { isFirebaseConfigured } from "../firebase";

export default function FirebaseAlert() {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  // If already configured with real keys, do not show alert
  if (isFirebaseConfigured) return null;

  const copySample = () => {
    navigator.clipboard.writeText(`VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Firebase Setup Pending:</strong> Fill in your credentials in <code>.env</code> to activate live Authentication & Firestore database.
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-amber-700 hover:text-amber-900 font-semibold underline text-xs flex items-center gap-1 cursor-pointer"
        >
          {collapsed ? "Show Instructions" : "Hide"}
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="bg-amber-100/60 px-4 py-3 border-t border-amber-200">
          <div className="max-w-7xl mx-auto space-y-1.5 text-xs text-amber-950">
            <p>1. Open <strong>.env</strong> in your project folder.</p>
            <p>2. Paste your <strong>firebaseConfig</strong> keys from your Firebase Console (Project Settings &rarr; Your apps &rarr; Web).</p>
            <p>3. Restart the dev server (<code>npm run dev</code>) so Vite loads the new environment variables.</p>
          </div>
        </div>
      )}
    </div>
  );
}
