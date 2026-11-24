const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Put the strongest reasoning model first so 300-500+ word prompts are parsed accurately
const MODEL_CANDIDATES = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-20b",
  "llama-3.1-8b-instant"
];

export async function getAIRecommendations(
  userPrompt,
  chatHistory = [],
  userContext = { favorites: [], watchlist: [], preferences: null }
) {
  if (!GROQ_API_KEY) {
    console.error("VITE_GROQ_API_KEY is missing from your .env file!");
    return {
      cleanKeywords: extractKeywordsFallback(userPrompt),
      recommendations: [],
      conversationalIntro: `Searching matches for **"${userPrompt}"**:`
    };
  }

  // Build compact list of already-saved titles so the AI avoids duplicates
  const savedTitles = [
    ...(userContext.favorites || []).map((m) => m.title || m.name),
    ...(userContext.watchlist || []).map((m) => m.title || m.name)
  ]
    .filter(Boolean)
    .slice(0, 40);

  const favGenres = userContext.preferences?.genres?.join(", ") || "Not specified";
  const favCountries = userContext.preferences?.countries?.join(", ") || "Not specified";

  // Keep the last 6 messages (3 turns) so follow-ups ("make #2 a movie", "exclude horror") work naturally
  const recentHistory = chatHistory
    .slice(-6)
    .filter((msg) => msg.text && !msg.text.startsWith("Hey! Ask me anything"))
    .map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));

const systemPrompt = `You are MovieBuddy AI, an elite cinema & TV series discovery engine capable of parsing long, complex, multi-paragraph user prompts (even 500+ words) without losing track of constraints.

HOW TO PROCESS LONG OR COMPLEX PROMPTS:
1. Extract EVERY positive preference: plot details, mood/vibe, cast/crew, countries/languages, release year ranges, pacing, and media format ("movie" vs "tv").
2. Strictly obey EVERY negative constraint and exclusion rule:
   - Excluded genres or themes (e.g., "no [specific genre]", "without [specific trope]")
   - Pacing or tone constraints (e.g., "not too slow", "nothing overly dark")
   - Excluded titles mentioned by the user (e.g., "exclude [Title]", "already watched [Title]", "anything except [Title]")
   - Temporal boundaries (e.g., "nothing before [Year]", "only released after [Year]", "from the [Decade]")
3. If the user describes a vague or detailed plot without knowing the title, identify the exact matching movie(s) or series.
4. Never recommend titles the user explicitly says they already watched OR titles in their saved library below (unless they specifically ask about one of them).

USER PROFILE CONTEXT (Use subtly when helpful):
- Preferred Countries: ${favCountries}
- Already in User's Library (DO NOT re-recommend unless requested): ${savedTitles.length > 0 ? savedTitles.join(", ") : "None"}

OUTPUT RULES:
- Return ONLY a valid JSON object matching this exact schema:
{
  "cleanKeywords": "2-4 word fallback TMDB search query",
  "recommendations": [
    {
      "title": "Exact official TMDB title",
      "year": 2023,
      "media_type": "movie"
    }
  ],
  "conversationalIntro": "A warm, concise 1-2 sentence response acknowledging their specific constraints and introducing the picks."
}
- "media_type" MUST be strictly either "movie" or "tv".
- Provide 3 to 5 accurate, real, verifiable titles. If the prompt asks about a completely unknown/fictional person with zero real matches, return "recommendations": [].`;


  const callGroq = async (modelName) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: modelName,
        response_format: { type: "json_object" }, // Guarantees 100% valid JSON on long prompts
        messages: [
          { role: "system", content: systemPrompt },
          ...recentHistory,
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 900
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Groq HTTP ${res.status}: ${errBody}`);
    }

    return await res.json();
  };

  for (const model of MODEL_CANDIDATES) {
    try {
      const data = await callGroq(model);
      const rawContent = data.choices[0].message.content.trim();
      const jsonString = rawContent.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonString);

      const recommendations = Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter((r) => r && r.title)
        : [];

      return {
        cleanKeywords: parsed.cleanKeywords || extractKeywordsFallback(userPrompt),
        recommendations,
        conversationalIntro:
          parsed.conversationalIntro ||
          `Here are the best matches based on your description:`
      };
    } catch (err) {
      console.warn(`Model [${model}] failed. Trying next candidate...`, err);
    }
  }

  return {
    cleanKeywords: extractKeywordsFallback(userPrompt),
    recommendations: [],
    conversationalIntro: `Searching matches for your request:`
  };
}

function extractKeywordsFallback(text) {
  return (
    text
      .replace(
        /show me|give me|movies starring|movies|dramas|shows|i watched|a few years ago|about a guy|what movie is it|can't remember|intense|thrillers|survival|bank robbers|heist/gi,
        ""
      )
      .trim()
      .slice(0, 60) || text.slice(0, 60)
  );
}