const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// ⚡ Active production models on Groq
const MODEL_CANDIDATES = [
  "openai/gpt-oss-20b",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile"
];

export async function getAIRecommendations(userPrompt) {
  if (!GROQ_API_KEY) {
    console.error("VITE_GROQ_API_KEY is missing from your .env file!");
    return {
      cleanKeywords: extractKeywordsFallback(userPrompt),
      recommendedTitles: [],
      conversationalIntro: `Searching matches for **"${userPrompt}"**:`
    };
  }

  const callGroq = async (modelName) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content: `You are an expert movie recommendation engine.
            Return ONLY a raw JSON object with no markdown formatting, no code blocks, and no extra text.
            
            RULES:
            1. If the user asks for a specific actor or person who is completely obscure or unknown, return an empty array for "recommendedTitles": [].
            2. If the user describes a genre, plot, or theme (e.g., "korean modern thriller series with a policeman"), generate 3 to 5 real, popular, widely known matching movie or TV show titles that fit the description.

            Required JSON structure:
            {
              "cleanKeywords": "short key search term",
              "recommendedTitles": ["Movie Title 1", "Movie Title 2", "Movie Title 3", "Movie Title 4", "Movie Title 5"],
              "conversationalIntro": "Here are top movie recommendations for you:"
            }`
          },
          {
            role: "user",
            content: `Recommend movies for: "${userPrompt}"`
          }
        ],
        temperature: 0.3
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
      
      // Clean potential markdown wrap (e.g. ```json ... ```)
      const jsonString = rawContent.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonString);

      return {
        cleanKeywords: parsed.cleanKeywords || extractKeywordsFallback(userPrompt),
        recommendedTitles: Array.isArray(parsed.recommendedTitles) ? parsed.recommendedTitles : [],
        conversationalIntro: parsed.conversationalIntro || `Here are top recommendations for **"${userPrompt}"**:`
      };
    } catch (err) {
      console.warn(`Model [${model}] failed. Trying next candidate...`, err);
    }
  }

  return {
    cleanKeywords: extractKeywordsFallback(userPrompt),
    recommendedTitles: [],
    conversationalIntro: `Searching matches for **"${userPrompt}"**:`
  };
}

function extractKeywordsFallback(text) {
  return text
    .replace(/show me|give me|movies starring|movies|dramas|shows|i watched|a few years ago|about a guy|what movie is it|can't remember|intense|thrillers|survival|bank robbers|heist/gi, "")
    .trim() || text;
}