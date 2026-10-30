// Secure Gemini Netlify Function for PLAY IELTS WITH NAZIM.
// Student mode is public; Admin mode requires a valid Firebase ID token
// and a Firestore users/{uid}.role === "admin" record.
export default async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured in Netlify Environment Variables." }), { status: 500, headers });
  }

  try {
    const body = await req.json();
    const mode = body?.mode === "admin" ? "admin" : "student";

    if (mode === "admin") {
      const idToken = req.headers.get("X-Firebase-ID-Token") || "";
      if (!idToken) {
        return new Response(JSON.stringify({ error: "Admin AI requires Firebase sign-in. Please sign in again." }), { status: 401, headers });
      }
      const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY || "AIzaSyCbKSXvSWq7svVwh1FWGt5m6-2XQO1JC-U";
      const projectId = process.env.FIREBASE_PROJECT_ID || "play-with-ielts-nazim";

      const verify = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });
      const identity = await verify.json();
      const uid = identity?.users?.[0]?.localId;
      if (!verify.ok || !uid) {
        return new Response(JSON.stringify({ error: "Firebase session expired or invalid. Sign in again." }), { status: 401, headers });
      }

      const profileUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;
      const profileResponse = await fetch(profileUrl, {
        headers: { "Authorization": `Bearer ${idToken}` }
      });
      const profile = await profileResponse.json();
      const role = profile?.fields?.role?.stringValue;
      if (!profileResponse.ok || role !== "admin") {
        return new Response(JSON.stringify({ error: "Admin permission was not verified. Admin AI access denied." }), { status: 403, headers });
      }
    }

    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const requestedModel = String(body?.model || "");
    const model = requestedModel === "gemini-3.8-flash"
      ? requestedModel
      : (process.env.GEMINI_MODEL || "gemini-3.8-flash");
    const temperature = Number.isFinite(Number(body?.temperature))
      ? Math.min(2, Math.max(0, Number(body.temperature)))
      : (mode === "admin" ? 0.2 : 0.4);

    const systemMessages = messages.filter(m => m?.role === "system");
    const chatMessages = messages.filter(m => m?.role !== "system");
    const contents = chatMessages.map(m => ({
      role: m?.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m?.content ?? "") }]
    }));
    const requestBody = {
      contents,
      generationConfig: { temperature },
      ...(systemMessages.length ? {
        systemInstruction: { parts: [{ text: systemMessages.map(m => String(m?.content ?? "")).join("\n\n") }] }
      } : {})
    };

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(requestBody)
      }
    );
    const data = await upstream.json();
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message || "Gemini API request failed" }), { status: upstream.status, headers });
    }
    const text = (data?.candidates || []).flatMap(c => c?.content?.parts || []).map(p => p?.text).filter(Boolean).join("\n").trim();
    return new Response(JSON.stringify({
      choices: [{ message: { role: "assistant", content: text || "No AI response." } }],
      model,
      provider: "gemini"
    }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || "Gemini AI request failed" }), { status: 500, headers });
  }
};
