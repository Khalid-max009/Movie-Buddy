 import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getAIRecommendations } from "../services/aiParserService";
import "../css/AIAssistant.css";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

 // Helper to generate dynamic chips based on recent user messages
const getDynamicChips = (messageHistory) => {
  // Extract user queries from past messages
  const userQueries = messageHistory
    .filter(msg => msg.sender === "user")
    .map(msg => msg.text);

  // Default fallback chips if history is short
  const defaultChips = [
    { label: "🔥 Trending Movies", query: "Show me trending movies this week" },
    { label: "⭐ Top Rated Sci-Fi", query: "Give me mind-bending sci-fi movies" },
    { label: "🎬 Blockbuster Action", query: "Show me high-energy action blockbusters" }
  ];

  if (userQueries.length === 0) return defaultChips;

  // Take the last 3 unique unique queries or keywords to form custom chips
  const recentCustom = Array.from(new Set(userQueries)).slice(-3).map(query => ({
    label: `🔍 ${query.length > 18 ? query.slice(0, 16) + '...' : query}`,
    query: query
  }));

  return [...recentCustom, ...defaultChips].slice(0, 4); // Keep max 4 chips
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // Toggle state for hiding/showing history

  // Persisted Chat History via localStorage
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("moviebuddy_chat_history");
    return saved
      ? JSON.parse(saved)
      : [
          {
            sender: "ai",
            text: "Hey! Ask me anything in natural language—search by actor, complex plot, genre, or country!",
            movies: []
          }
        ];
  });

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("moviebuddy_chat_history", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const executeGeminiSearch = async (userQuery) => {
    const trimmed = userQuery.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: trimmed, movies: [] }]);
    setPrompt("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      // 1. Call the AI parser service to extract real movie/show titles from conversational text
      const aiResponse = await getAIRecommendations(trimmed);
      let fetchedMatches = [];

      if (aiResponse.recommendedTitles && aiResponse.recommendedTitles.length > 0) {
        const titlePromises = aiResponse.recommendedTitles.map(async (title) => {
          try {
            const res = await fetch(
              `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(title)}`
            );
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              return data.results.find((item) => item.poster_path) || data.results[0];
            }
          } catch (e) {
            return null;
          }
          return null;
        });

        const resolvedResults = await Promise.all(titlePromises);
        const uniqueMap = new Map();
        resolvedResults.filter(Boolean).forEach((item) => {
          if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
          }
        });
        fetchedMatches = Array.from(uniqueMap.values()).slice(0, 5);
      }
      // ... rest of your code
      
      if (fetchedMatches.length === 0) {
        const multiRes = await fetch(
          `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(trimmed)}`
        );
        const multiData = await multiRes.json();

        if (multiData.results && multiData.results.length > 0) {
          fetchedMatches = multiData.results
            .filter((item) => item.poster_path)
            .slice(0, 5);
        }
      }

      if (fetchedMatches.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: aiResponse.conversationalIntro || `Here are top picks for **"${trimmed}"**:`,
            movies: fetchedMatches
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `I couldn't find matches for "${trimmed}". Try asking for another actor or genre!`,
            movies: []
          }
        ]);
      }

    } catch (err) {
      console.error("AI Assistant Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Something went wrong fetching recommendations. Please try again!",
          movies: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeGeminiSearch(prompt);
  };

  const handleChipClick = (queryText) => {
    setPrompt(queryText);
    executeGeminiSearch(queryText);
  };

  const handleClearHistory = () => {
    const defaultMsg = [
      {
        sender: "ai",
        text: "Chat cleared! What are we looking for next?",
        movies: []
      }
    ];
    setMessages(defaultMsg);
    localStorage.removeItem("moviebuddy_chat_history");
  };

  const handleTextareaChange = (e) => {
    setPrompt(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeGeminiSearch(prompt);
    }
  };

  // Determine messages to display: slice to show only latest turn if history is collapsed
  const visibleMessages = showHistory ? messages : messages.slice(-2);

  return (
    <div className="ai-assistant-wrapper">
      <button 
        type="button" 
        className="ai-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Movie Assistant"
      >
        {isOpen ? "✕" : "🤖 Ask AI"}
      </button>
 
 {isOpen && (
        <div className="ai-chat-card" style={{ display: "flex", flexDirection: "column", height: "85vh", maxHeight: "600px", overflow: "hidden" }}>
          <div className="ai-chat-header" style={{ flexShrink: 0 }}>
            <div className="ai-title-row">
              <span className="ai-avatar">🤖</span>
              <div>
                <h3>Movie Buddy AI</h3>
                <p>Gemini Powered Engine</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {messages.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    color: "#cbd5e1",
                    fontSize: "0.7rem",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  {showHistory ? "Hide History" : `History (${messages.length})`}
                </button>
              )}
              <button
                type="button"
                onClick={handleClearHistory}
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  color: "#94a3b8",
                  fontSize: "0.7rem",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
              <button type="button" className="ai-close-icon" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          <div className="ai-chat-body" style={{ overflowY: "auto", flex: 1, padding: "12px", minHeight: 0 }}>
            {visibleMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: "12px"
                }}
              >
                <div 
                  className={msg.sender === "user" ? "ai-user-bubble" : "ai-message-bubble"}
                  style={{ 
                    maxWidth: "88%",
                    background: msg.sender === "user" ? "#dc2626" : undefined,
                    color: msg.sender === "user" ? "#ffffff" : undefined,
                    borderRadius: msg.sender === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0",
                    padding: "10px 14px",
                    fontSize: "0.9rem",
                    lineHeight: "1.4"
                  }}
                  dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />

                {msg.movies && msg.movies.length > 0 && (
                  <div className="ai-results-list" style={{ marginTop: "8px", width: "100%" }}>
                    {msg.movies.map((item) => {
                      const mediaTypePath = item.media_type === "tv" || item.first_air_date || !item.title ? "tv" : "movie";
                      const displayTitle = item.title || item.name;
                      const releaseYear = (item.release_date || item.first_air_date)?.slice(0, 4) || "N/A";

                      return (
                        <Link
                          to={`/${mediaTypePath}/${item.id}`}
                          key={item.id}
                          className="ai-mini-card-link"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className="ai-mini-card">
                            <img 
                              src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : "https://via.placeholder.com/60x90?text=No+Cover"} 
                              alt={displayTitle} 
                              className="ai-mini-poster"
                            />
                            <div className="ai-mini-info">
                              <h4>{displayTitle}</h4>
                              <p className="ai-mini-meta">
                                ⭐ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"} | {releaseYear} | {mediaTypePath === "tv" ? "📺 Series" : "🎬 Movie"}
                              </p>
                              <p className="ai-mini-overview">{item.overview ? `${item.overview.slice(0, 55)}...` : "No description available."}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-loading-spinner">
                <div className="spinner-small"></div>
                <span>Gemini AI is processing your prompt...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="ai-chips-bar" style={{
            display: "flex", gap: "6px", overflowX: "auto", padding: "8px 12px",
            backgroundColor: "rgba(15, 23, 42, 0.6)", scrollbarWidth: "none", flexShrink: 0
          }}>
           {getDynamicChips(messages).map((chip, idx) => (
  <button
    key={idx}
    type="button"
    onClick={() => handleChipClick(chip.query)}
    style={{
      background: "#1e293b", border: "1px solid #334155", color: "#cbd5e1",
      borderRadius: "16px", padding: "4px 10px", fontSize: "0.76rem",
      fontWeight: "600", whiteSpace: "nowrap", cursor: "pointer"
    }}
  >
    {chip.label}
  </button>
))}         
 </div>

          <form onSubmit={handleSubmit} className="ai-input-form" style={{ display: "flex", gap: "8px", padding: "10px", alignItems: "center", background: "#0f172a", borderTop: "1px solid #1e293b", flexShrink: 0 }}>
            <textarea
  ref={textareaRef}
  rows={1}
  placeholder="Ask AI for movies or plots..."
  value={prompt}
  onChange={handleTextareaChange}
  onKeyDown={handleKeyDown}
  className="ai-input"
  style={{
    flex: 1,
    resize: "none",
    overflowY: "hidden",
    padding: "10px 14px",
    minHeight: "44px",
    maxHeight: "120px",        /* Lets it expand vertically up to this limit */
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",    /* Allows text to wrap naturally to the next line */
    wordBreak: "break-word"    /* Breaks long words cleanly */
  }}
/>
            <button 
              type="submit" 
              className="ai-send-btn" 
              disabled={loading}
              style={{
                height: "42px",
                padding: "0 18px",
                borderRadius: "12px",
                background: "#dc2626",
                color: "#ffffff",
                fontWeight: "600",
                cursor: "pointer",
                border: "none",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {loading ? "..." : "Ask"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}