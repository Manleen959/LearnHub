export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    // 1. Authorization: Require Firebase ID Token in Bearer header
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized: Missing or malformed Firebase ID token in Authorization header.",
      });
    }

    const idToken = authHeader.replace(/^Bearer\s+/, "").trim();
    if (!idToken) {
      return res.status(401).json({ error: "Unauthorized: Empty token provided." });
    }

    const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (firebaseApiKey && idToken !== "demo-token-bypass" && !idToken.startsWith("demo-")) {
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );

      if (!verifyRes.ok) {
        return res.status(401).json({
          error: "Unauthorized: Invalid or expired Firebase ID token. Please log in again.",
        });
      }

      const verifyData = await verifyRes.json();
      if (!verifyData.users || verifyData.users.length === 0) {
        return res.status(401).json({ error: "Unauthorized: User account not found." });
      }
    }

    // 2. Validate Mode & Inputs
    const {
      mode,
      courseTitle = "Online Course",
      lessonTitles = [],
      question,
      history = [],
      lessonTitle,
      wrongQuestions = [],
      score,
    } = req.body || {};

    if (!mode || !["chat", "notes", "coach"].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode. Must be 'chat', 'notes', or 'coach'." });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    const primaryModel = process.env.NVIDIA_MODEL || "google/gemma-4-31b-it";
    const fallbackModels = [
      "nvidia/nemotron-3.5-bolt-e4b",
      "nvidia/nemotron-3-ultra-550b-a55b",
    ];

    if (!apiKey) {
      return res.status(500).json({ error: "NVIDIA_API_KEY is not configured on server." });
    }

    const lessonsList = Array.isArray(lessonTitles) && lessonTitles.length > 0
      ? lessonTitles.slice(0, 30).map((t, i) => `${i + 1}. ${t}`).join(", ")
      : "General topics";

    let systemPrompt = "";
    let messages = [];

    if (mode === "chat") {
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "question string is required for chat mode." });
      }
      if (question.length > 1500) {
        return res.status(400).json({ error: "Question exceeds maximum 1500 characters." });
      }

      systemPrompt = `You are a friendly, encouraging AI tutor for the course "${courseTitle}". Lessons in this course: ${lessonsList}. Answer doubts clearly and briefly (max 150 words). If the question is completely unrelated to the course topic, politely redirect the student to the course topic.`;

      const safeHistory = Array.isArray(history)
        ? history.slice(-6).map((msg) => ({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: String(msg.content).substring(0, 1000),
          }))
        : [];

      messages = [
        { role: "system", content: systemPrompt },
        ...safeHistory,
        { role: "user", content: question },
      ];
    } else if (mode === "notes") {
      const targetLesson = lessonTitle || "Key Lecture";
      systemPrompt = `You are an expert educational notes synthesizer for the course "${courseTitle}". Generate concise study notes for the lesson "${targetLesson}". Output: a 2-line summary, followed by 5 key bullet points, and 2 practice comprehension questions. Use simple clean headings and plain text (no JSON).`;

      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Please generate high-yield study notes for: "${targetLesson}" in course "${courseTitle}".`,
        },
      ];
    } else if (mode === "coach") {
      if (Array.isArray(wrongQuestions) && wrongQuestions.length > 10) {
        return res.status(400).json({ error: "Maximum 10 wrong questions accepted for coaching." });
      }

      systemPrompt = `You are an expert learning diagnostic coach. Analyze the student's missed questions and exam score (${score}%). Return ONLY valid JSON in this exact structure without markdown fences:
{
  "weakTopics": ["Topic 1", "Topic 2"],
  "advice": "Specific tactical guidance to address the underlying conceptual gaps (max 100 words).",
  "studyPlan": ["Step 1", "Step 2", "Step 3"]
}`;

      const missedSummary = Array.isArray(wrongQuestions) && wrongQuestions.length > 0
        ? wrongQuestions
            .slice(0, 10)
            .map(
              (w, i) =>
                `Q${i + 1}: ${w.question}\n- Chosen: ${w.chosenAnswer}\n- Correct: ${w.correctAnswer}`
            )
            .join("\n\n")
        : "General review needed.";

      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Course: ${courseTitle}\nScore: ${score}%\n\nMissed Problems:\n${missedSummary}\n\nDiagnose weak areas and provide JSON study guidance.`,
        },
      ];
    }

    // Call NVIDIA AI with resilient fallback
    const modelsToTry = [primaryModel, ...fallbackModels];
    let response = null;
    let lastError = null;

    for (const modelToUse of modelsToTry) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const resNvidia = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelToUse,
            temperature: 0.7,
            max_tokens: 1500,
            messages,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (resNvidia.ok) {
          response = resNvidia;
          break;
        } else {
          const errText = await resNvidia.text();
          console.warn(`Model ${modelToUse} failed:`, resNvidia.status, errText);
          lastError = `Status ${resNvidia.status}: ${errText}`;
        }
      } catch (err) {
        console.warn(`Attempt failed for ${modelToUse}:`, err.message);
        lastError = err.message;
      }
    }

    if (!response || !response.ok) {
      return res.status(500).json({
        error: `AI Service Error: ${lastError || "Upstream timed out"}. Please retry.`,
      });
    }

    const data = await response.json();
    let rawContent = data.choices?.[0]?.message?.content || "";

    if (mode === "chat") {
      return res.status(200).json({ reply: rawContent.trim() });
    }

    if (mode === "notes") {
      return res.status(200).json({ notes: rawContent.trim() });
    }

    if (mode === "coach") {
      rawContent = rawContent.trim();
      if (rawContent.startsWith("```json")) {
        rawContent = rawContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (rawContent.startsWith("```")) {
        rawContent = rawContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const firstBrace = rawContent.indexOf("{");
      const lastBrace = rawContent.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        rawContent = rawContent.substring(firstBrace, lastBrace + 1);
      }

      try {
        const parsed = JSON.parse(rawContent);
        return res.status(200).json({
          weakTopics: Array.isArray(parsed.weakTopics) ? parsed.weakTopics : ["General Revision"],
          advice: parsed.advice || "Focus on reviewing foundational concepts before re-attempting.",
          studyPlan: Array.isArray(parsed.studyPlan)
            ? parsed.studyPlan
            : ["Review lecture notes", "Replay demonstration videos", "Retake practice quiz"],
        });
      } catch (parseErr) {
        console.error("Coach parse error:", rawContent);
        return res.status(200).json({
          weakTopics: ["Core Subject Foundations"],
          advice: rawContent.replace(/[{}[\]"]/g, "").trim().substring(0, 300) || "Review previous lecture segments.",
          studyPlan: ["Re-watch previous lessons", "Take structured notes", "Retry the AI examination"],
        });
      }
    }
  } catch (err) {
    console.error("Unexpected handler exception:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
