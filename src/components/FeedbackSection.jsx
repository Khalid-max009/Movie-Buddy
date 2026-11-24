import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export default function FeedbackSection({ isTeamStaff = false }) {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [form, setForm] = useState({
    display_name: "",
    rating: 5,
    review_text: "",
    want_added: "",
    want_removed: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const loadFeedback = async () => {
    const { data } = await supabase
      .from("site_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setFeedbackList(data || []);
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.review_text.trim() && !form.want_added.trim() && !form.want_removed.trim()) {
      setMsg("Please fill at least one feedback box.");
      return;
    }

    setSubmitting(true);
    setMsg("");

    const { error } = await supabase.from("site_feedback").insert({
      user_id: user?.id || null,
      display_name: form.display_name.trim() || user?.email?.split("@")[0] || "MovieBuddy Viewer",
      rating: Number(form.rating),
      review_text: form.review_text.trim() || null,
      want_added: form.want_added.trim() || null,
      want_removed: form.want_removed.trim() || null
    });

    setSubmitting(false);
    if (error) {
      setMsg(`Error: ${error.message}`);
    } else {
      setForm({ display_name: "", rating: 5, review_text: "", want_added: "", want_removed: "" });
      setMsg("Thanks! Your review & suggestions are live.");
      loadFeedback();
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("site_feedback").delete().eq("id", id);
    if (!error) setFeedbackList((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <section className="team-updates-section">
      <h2>Community Reviews &amp; Feature Requests</h2>
      <p className="team-muted">
        Tell us what you love, what features we should build next, and anything you want changed or removed.
      </p>

      {msg && <div className="cms-toast">{msg}</div>}

      <form onSubmit={handleSubmit} className="cms-post-form">
        <div className="cms-row">
          <input
            type="text"
            placeholder="Your Name (optional)"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          />
          <select
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
          >
            <option value={5}>⭐⭐⭐⭐⭐ (5/5) Amazing</option>
            <option value={4}>⭐⭐⭐⭐ (4/5) Great</option>
            <option value={3}>⭐⭐⭐ (3/5) Good</option>
            <option value={2}>⭐⭐ (2/5) Needs Work</option>
            <option value={1}>⭐ (1/5) Poor</option>
          </select>
        </div>

        <textarea
          rows={2}
          placeholder="Your review of MovieBuddy..."
          value={form.review_text}
          onChange={(e) => setForm({ ...form, review_text: e.target.value })}
        />

        <div className="cms-row">
          <input
            type="text"
            placeholder="➕ What do you want ADDED to the site?"
            value={form.want_added}
            onChange={(e) => setForm({ ...form, want_added: e.target.value })}
          />
          <input
            type="text"
            placeholder="➖ What do you NOT want / want removed?"
            value={form.want_removed}
            onChange={(e) => setForm({ ...form, want_removed: e.target.value })}
          />
        </div>

        <button type="submit" className="cms-primary-btn" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Review & Feedback"}
        </button>
      </form>

      <div className="updates-feed" style={{ marginTop: "1.5rem" }}>
        {feedbackList.map((item) => (
          <article key={item.id} className="update-card">
            <div className="update-meta">
              <span className="update-tag">{"⭐".repeat(item.rating || 5)}</span>
              <span>
                <strong>{item.display_name}</strong> •{" "}
                {new Date(item.created_at).toLocaleDateString()}
              </span>
              {isTeamStaff && (
                <button
                  type="button"
                  className="delete-post-btn"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
              )}
            </div>
            {item.review_text && <p>{item.review_text}</p>}
            {item.want_added && (
              <p style={{ color: "#4ade80", fontSize: "0.88rem" }}>
                <strong>Wants Added:</strong> {item.want_added}
              </p>
            )}
            {item.want_removed && (
              <p style={{ color: "#f87171", fontSize: "0.88rem" }}>
                <strong>Wants Removed / Changed:</strong> {item.want_removed}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}