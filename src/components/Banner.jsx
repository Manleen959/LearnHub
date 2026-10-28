import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";

export default function Banner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-[#e4f8f4] border-b border-[#a8ede1] text-[#1c1d1f] px-4 py-2 text-sm flex items-center justify-between transition-all">
      <div className="flex-1 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-[#0c7063] shrink-0" />
        <span>
          <strong>Ready to leap ahead?</strong> Learn in-demand career skills from industry experts. Get started today.
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss banner"
        className="p-1 hover:bg-[#cbf1ea] rounded text-[#0c7063] transition ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
