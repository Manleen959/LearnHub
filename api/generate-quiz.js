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

    // Verify token with Firebase Auth REST API (allows demo-token-bypass for local testing preview)
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
        const verifyErr = await verifyRes.text();
        console.warn("Token verification failed:", verifyRes.status, verifyErr);
        return res.status(401).json({
          error: "Unauthorized: Invalid or expired Firebase ID token. Please log in again.",
        });
      }

      const verifyData = await verifyRes.json();
      if (!verifyData.users || verifyData.users.length === 0) {
        return res.status(401).json({ error: "Unauthorized: User account not found." });
      }
    }

    // 2. Input Validation (max 10 questions and size constraints)
    const { courseTitle, description = "", lessonTitles = [], numQuestions = 5 } = req.body || {};

    if (!courseTitle || typeof courseTitle !== "string") {
      return res.status(400).json({ error: "courseTitle is required and must be text." });
    }

    if (courseTitle.length > 300 || (description && description.length > 2000)) {
      return res.status(400).json({ error: "Input rejected: Course metadata exceeds size limits." });
    }

    const count = Math.min(10, Math.max(1, Number(numQuestions) || 5));
    const apiKey = process.env.NVIDIA_API_KEY;
    const primaryModel = process.env.NVIDIA_MODEL || "google/gemma-4-31b-it";
    const fallbackModels = [
      "nvidia/nemotron-3.5-bolt-e4b",
      "nvidia/nemotron-3-ultra-550b-a55b",
    ];

    if (!apiKey) {
      return res.status(500).json({
        error: "Server configuration error: NVIDIA_API_KEY is not configured.",
      });
    }

    const lessonsFormatted = Array.isArray(lessonTitles) && lessonTitles.length > 0
      ? lessonTitles.slice(0, 30).map((t, i) => `${i + 1}. ${t}`).join("\n")
      : "General course topics";

    const systemPrompt =
      'You are an exam setter. Generate multiple-choice questions based ONLY on the given course topic and lesson titles. Return ONLY valid JSON, no markdown, no explanation, in this shape: {"questions":[{"question":string,"options":[4 strings],"correctIndex":0-3,"explanation":string}]}';

    const userPrompt = `Course Title: ${courseTitle}
Overview: ${description}

Curriculum Lessons:
${lessonsFormatted}

Requirement: Generate exactly ${count} multiple-choice questions testing key concepts from these lessons.
Ensure:
1. Every question has exactly 4 options.
2. "correctIndex" is an integer between 0 and 3.
3. "explanation" clearly justifies the correct choice in 1-2 sentences.
4. Output strict JSON with NO markdown code block wrapper.`;

    // Try primary model first, fallback to robust model if 504 / timeout, with 1 retry on invalid JSON
    let validQuestions = [];
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const modelsToTry = attempt === 1 ? [primaryModel, ...fallbackModels] : [...fallbackModels, primaryModel];
      let response = null;

      for (const modelToUse of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);

          const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: modelToUse,
              temperature: attempt === 1 ? 0.7 : 0.4,
              max_tokens: 1800,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (res.ok) {
            response = res;
            break;
          } else {
            const errText = await res.text();
            console.warn(`Model ${modelToUse} failed with status ${res.status}:`, errText);
            lastError = `Status ${res.status}: ${errText}`;
          }
        } catch (reqErr) {
          console.warn(`Request failed for model ${modelToUse}:`, reqErr.message);
          lastError = reqErr.message;
        }
      }

      if (!response || !response.ok) {
        if (attempt === 2) {
          return res.status(500).json({
            error: `NVIDIA AI Gateway error: ${lastError || "Upstream model timed out"}. Please click Retry.`,
          });
        }
        continue;
      }

      const data = await response.json();
      let rawContent = data.choices?.[0]?.message?.content || "";

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

      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch (parseErr) {
        console.warn(`Attempt ${attempt}: JSON parse failed. Retrying...`, rawContent.slice(0, 100));
        lastError = "AI returned non-JSON format.";
        continue;
      }

      const candidateQuestions = Array.isArray(parsed?.questions)
        ? parsed.questions
        : Array.isArray(parsed)
        ? parsed
        : [];

      const parsedValid = candidateQuestions
        .filter((q) => {
          return (
            q &&
            typeof q.question === "string" &&
            q.question.trim().length > 0 &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            q.options.every((opt) => typeof opt === "string" && opt.trim().length > 0) &&
            typeof q.correctIndex === "number" &&
            q.correctIndex >= 0 &&
            q.correctIndex <= 3
          );
        })
        .slice(0, count)
        .map((q, idx) => ({
          id: `q_${Date.now()}_${idx}`,
          question: q.question.trim(),
          options: q.options.map((o) => o.trim()),
          correctIndex: q.correctIndex,
          explanation: q.explanation || "Correct answer based on the curriculum lessons.",
        }));

      if (parsedValid.length > 0) {
        validQuestions = parsedValid;
        break;
      } else {
        lastError = "AI generated invalid question structures.";
      }
    }

    if (validQuestions.length === 0) {
      return res.status(500).json({
        error: `AI could not generate valid examination questions (${lastError || "Invalid formatting"}). Please click Retry.`,
      });
    }

    return res.status(200).json({ questions: validQuestions });
  } catch (err) {
    console.error("Unexpected handler exception:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
