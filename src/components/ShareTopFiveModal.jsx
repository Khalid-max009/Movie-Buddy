import { useState, useRef } from "react";

export default function ShareTopFiveModal({ availableMovies = [], onClose }) {
  const [selected, setSelected] = useState([]);
  const [listTitle, setListTitle] = useState("My Top 5 Must-Watch Picks");
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef(null);

  const toggleMovie = (movie) => {
    setSelected((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      if (exists) return prev.filter((m) => m.id !== movie.id);
      if (prev.length >= 5) return prev;
      return [...prev, movie];
    });
  };

  const buildShareUrl = () => {
    const ids = selected.map((m) => `${m.media_type || "movie"}:${m.id}`).join(",");
    return `${window.location.origin}/?picks=${encodeURIComponent(ids)}&title=${encodeURIComponent(listTitle)}`;
  };

  const handleShareWhatsAppText = () => {
    if (selected.length === 0) return;
    const lines = selected.map(
      (m, i) => `${i + 1}. ${m.title || m.name} (${(m.release_date || m.first_air_date || "").slice(0, 4)})`
    );
    const message = `🎬 *${listTitle}*\n\n${lines.join("\n")}\n\n👉 View cards on MovieBuddy:\n${buildShareUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const handleShareCardImage = async () => {
    if (selected.length === 0) return;
    setGenerating(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = 1080;
      canvas.height = 1350; // 4:5 portrait — ideal for WhatsApp Status & chats

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, 1350);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(1, "#090d16");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1350);

      // Header
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("MOVIEBUDDY • TOP PICKS", 60, 85);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 46px sans-serif";
      ctx.fillText(listTitle.slice(0, 34), 60, 145);

      // Load posters with CORS enabled
      const loadImg = (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = url;
        });

      const slots = [
        { x: 60, y: 200, w: 300, h: 450 },
        { x: 390, y: 200, w: 300, h: 450 },
        { x: 720, y: 200, w: 300, h: 450 },
        { x: 225, y: 700, w: 300, h: 450 },
        { x: 555, y: 700, w: 300, h: 450 }
      ];

      for (let i = 0; i < selected.length; i++) {
        const movie = selected[i];
        const slot = slots[i];
        const posterUrl = movie.poster_path
          ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
          : null;
        const img = posterUrl ? await loadImg(posterUrl) : null;

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(slot.x, slot.y, slot.w, slot.h);

        if (img) {
          ctx.drawImage(img, slot.x, slot.y, slot.w, slot.h);
        }

        // Number badge
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(slot.x + 12, slot.y + 12, 46, 46);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText(`#${i + 1}`, slot.x + 20, slot.y + 44);
      }

      // Footer watermark
      ctx.fillStyle = "#94a3b8";
      ctx.font = "24px sans-serif";
      ctx.fillText(`Curated on MovieBuddy • ${window.location.host}`, 60, 1285);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "moviebuddy-top5.png", { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: listTitle,
            text: `Check out ${listTitle} on MovieBuddy!`,
            files: [file]
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "moviebuddy-top5.png";
          a.click();
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="share-modal-backdrop">
      <div className="share-modal-card">
        <div className="share-modal-header">
          <h3>Share Your 5 Movie Cards ({selected.length}/5)</h3>
          <button type="button" onClick={onClose}>✕</button>
        </div>

        <input
          type="text"
          value={listTitle}
          onChange={(e) => setListTitle(e.target.value)}
          placeholder="Name your 5-card pack (e.g. Weekend Sci-Fi Picks)"
        />

        <div className="share-picker-grid">
          {availableMovies.map((movie) => {
            const active = selected.some((m) => m.id === movie.id);
            return (
              <button
                key={movie.id}
                type="button"
                className={`share-pick-item ${active ? "selected" : ""}`}
                onClick={() => toggleMovie(movie)}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                  alt={movie.title || movie.name}
                />
                <span>{movie.title || movie.name}</span>
              </button>
            );
          })}
        </div>

        <div className="share-actions">
          <button
            type="button"
            onClick={handleShareCardImage}
            disabled={selected.length === 0 || generating}
          >
            {generating ? "Creating Image..." : "📲 Share 5-Card Image (WhatsApp Status)"}
          </button>
          <button
            type="button"
            onClick={handleShareWhatsAppText}
            disabled={selected.length === 0}
          >
            💬 Send List Link on WhatsApp
          </button>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}