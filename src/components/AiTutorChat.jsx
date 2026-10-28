import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Sparkles,
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ChevronDown,
  Minimize2,
} from "lucide-react";

export default function AiTutorChat({ courseTitle, lessonTitles = [] }) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi there! I'm your AI course tutor for "${courseTitle}". Ask me any questions or doubts about your lessons and I'll explain them simply!`,
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // Append user message to state
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      let idToken = "";
      if (currentUser?.getIdToken) {
        try {
          idToken = await currentUser.getIdToken();
        } catch (e) {
          console.warn("Could not retrieve ID token:", e);
        }
      }

      // Send last 6 history messages
      const historyPayload = newMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken || "demo-token-bypass"}`,
        },
        body: JSON.stringify({
          mode: "chat",
          courseTitle,
          lessonTitles,
          question: userText,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Tutor service temporarily unavailable.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "I understand your question! Let me know if you need more depth." },
      ]);
    } catch (err) {
      console.error("AI chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble connecting to the tutoring engine. Please try asking again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-[#5624d0] to-[#7942ec] hover:from-[#401b9c] hover:to-[#632dd6] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition transform hover:scale-105 active:scale-95 cursor-pointer border border-white/20 group"
          title="Ask AI Tutor"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="font-bold text-sm hidden sm:inline">Ask AI Tutor</span>
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-[92vw] sm:w-[400px] h-[520px] flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#5624d0] to-[#7942ec] p-4 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>Gemma AI Tutor</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-purple-200 truncate max-w-[200px]">
                  {courseTitle}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer text-white"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-[#5624d0] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[82%] leading-relaxed shadow-xs ${
                    m.role === "user"
                      ? "bg-[#5624d0] text-white rounded-br-xs"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-xs"
                  }`}
                >
                  {m.content}
                </div>

                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-[#5624d0] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-white text-gray-600 border border-gray-200 rounded-2xl rounded-bl-xs text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#5624d0] animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-[#5624d0] animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#5624d0] animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[11px] font-medium text-gray-400 ml-1">
                    Gemma is thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-gray-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a doubt about this lesson..."
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5624d0] bg-gray-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-[#5624d0] hover:bg-[#401b9c] text-white rounded-xl transition shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
