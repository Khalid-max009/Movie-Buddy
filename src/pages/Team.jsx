import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import "../css/Team.css";

export default function Team() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState("user");
  const [members, setMembers] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Editor State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    role_title: "",
    bio: "",
    avatar_url: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    website: ""
  });

  // New Post / Feature Alert State
  const [postForm, setPostForm] = useState({
    category: "Feature Alert",
    title: "",
    content: "",
    external_link: ""
  });
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const isTeamStaff = userRole === "admin" || userRole === "director";

  useEffect(() => {
    fetchTeamData();
  }, [user]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // 1. Check logged-in user's role
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profileData?.role) setUserRole(profileData.role);
      } else {
        setUserRole("user");
      }

      // 2. Fetch Team Members
      const { data: teamData } = await supabase
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true });
      setMembers(teamData || []);

      // Pre-fill current user's profile form if they already have a card
      if (user && teamData) {
        const mine = teamData.find((m) => m.user_id === user.id);
        if (mine) {
          setProfileForm({
            full_name: mine.full_name || "",
            role_title: mine.role_title || "",
            bio: mine.bio || "",
            avatar_url: mine.avatar_url || "",
            twitter: mine.socials?.twitter || "",
            linkedin: mine.socials?.linkedin || "",
            instagram: mine.socials?.instagram || "",
            website: mine.socials?.website || ""
          });
        }
      }

      // 3. Fetch Updates / Feature Alerts
      const { data: updatesData } = await supabase
        .from("team_updates")
        .select("*")
        .order("created_at", { ascending: false });
      setUpdates(updatesData || []);
    } catch (err) {
      console.error("Error loading Team CMS:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user || !isTeamStaff) return;
    setSaving(true);
    setStatusMsg("");

    const payload = {
      user_id: user.id,
      full_name: profileForm.full_name.trim(),
      role_title: profileForm.role_title.trim(),
      bio: profileForm.bio.trim(),
      avatar_url: profileForm.avatar_url.trim(),
      display_order: userRole === "admin" ? 1 : 2,
      socials: {
        twitter: profileForm.twitter.trim(),
        linkedin: profileForm.linkedin.trim(),
        instagram: profileForm.instagram.trim(),
        website: profileForm.website.trim()
      },
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("team_members")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      setStatusMsg(`Error: ${error.message}`);
    } else {
      setStatusMsg("Profile updated live!");
      setEditingProfile(false);
      fetchTeamData();
    }
  };

  const handlePublishUpdate = async (e) => {
    e.preventDefault();
    if (!user || !isTeamStaff || !postForm.title.trim() || !postForm.content.trim()) return;
    setSaving(true);
    setStatusMsg("");

    const myCard = members.find((m) => m.user_id === user.id);
    const authorName = myCard?.full_name || user.email.split("@")[0];

    const { error } = await supabase.from("team_updates").insert({
      author_id: user.id,
      author_name: authorName,
      category: postForm.category,
      title: postForm.title.trim(),
      content: postForm.content.trim(),
      external_link: postForm.external_link.trim() || null
    });

    setSaving(false);
    if (error) {
      setStatusMsg(`Error: ${error.message}`);
    } else {
      setPostForm({ category: "Feature Alert", title: "", content: "", external_link: "" });
      setStatusMsg("Published to MovieBuddy!");
      fetchTeamData();
    }
  };

  const handleDeleteUpdate = async (id) => {
    const { error } = await supabase.from("team_updates").delete().eq("id", id);
    if (!error) {
      setUpdates((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="team-page-container">
      <header className="team-hero">
        <h1>Behind MovieBuddy</h1>
        <p>Meet the team building, scaling, and curating your cinema discovery experience.</p>
      </header>

      {statusMsg && <div className="cms-toast">{statusMsg}</div>}

      {/* CMS CONTROL PANEL (Visible ONLY to Admin & Growth Director) */}
      {isTeamStaff && (
        <section className="cms-admin-panel">
          <div className="cms-panel-header">
            <h2>⚡ Team CMS Studio ({userRole === "admin" ? "Lead Admin" : "Growth Director"})</h2>
            <button
              type="button"
              className="cms-toggle-btn"
              onClick={() => setEditingProfile(!editingProfile)}
            >
              {editingProfile ? "Close Profile Editor" : "✏️ Edit My Team Card"}
            </button>
          </div>

          {editingProfile && (
            <form onSubmit={handleSaveProfile} className="cms-form-grid">
              <input
                type="text"
                placeholder="Full Display Name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Title (e.g. Growth & Community Director)"
                value={profileForm.role_title}
                onChange={(e) => setProfileForm({ ...profileForm, role_title: e.target.value })}
                required
              />
              <input
                type="url"
                placeholder="Avatar Image URL (https://...)"
                value={profileForm.avatar_url}
                onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
              />
              <input
                type="url"
                placeholder="X / Twitter URL (optional)"
                value={profileForm.twitter}
                onChange={(e) => setProfileForm({ ...profileForm, twitter: e.target.value })}
              />
              <input
                type="url"
                placeholder="LinkedIn URL (optional)"
                value={profileForm.linkedin}
                onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
              />
              <input
                type="url"
                placeholder="Instagram / Portfolio URL (optional)"
                value={profileForm.website}
                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
              />
              <textarea
                rows={3}
                placeholder="Short Bio (2-3 sentences about your role & vision)"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                required
              />
              <button type="submit" className="cms-primary-btn" disabled={saving}>
                {saving ? "Saving..." : "Save Public Profile"}
              </button>
            </form>
          )}

          {/* Publish New Feature Alert / Project / Idea */}
          <form onSubmit={handlePublishUpdate} className="cms-post-form">
            <h3>📢 Publish Feature Alert, Idea, or Project</h3>
            <div className="cms-row">
              <select
                value={postForm.category}
                onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
              >
                <option value="Feature Alert">🚀 Feature Alert</option>
                <option value="Community Idea">💡 Community Idea</option>
                <option value="Project Showcase">🎬 Project Showcase</option>
              </select>
              <input
                type="text"
                placeholder="Headline / Title"
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                required
              />
            </div>
            <textarea
              rows={3}
              placeholder="Write update details, guidance for users, or project summary..."
              value={postForm.content}
              onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
              required
            />
            <div className="cms-row">
              <input
                type="url"
                placeholder="Optional Link (Social post, demo, or form URL)"
                value={postForm.external_link}
                onChange={(e) => setPostForm({ ...postForm, external_link: e.target.value })}
              />
              <button type="submit" className="cms-primary-btn" disabled={saving}>
                {saving ? "Publishing..." : "Publish Live"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* PUBLIC TEAM CARDS */}
      <section className="team-cards-grid">
        {loading ? (
          <p className="team-muted">Loading team profiles...</p>
        ) : members.length === 0 ? (
          <p className="team-muted">Team profiles coming soon.</p>
        ) : (
          members.map((member) => (
            <div key={member.id} className="team-member-card">
              <img
                src={
                  member.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    member.full_name
                  )}&background=dc2626&color=fff&size=150`
                }
                alt={member.full_name}
                className="team-avatar"
              />
              <h3>{member.full_name}</h3>
              <span className="team-role-badge">{member.role_title}</span>
              <p className="team-bio">{member.bio}</p>

              <div className="team-socials">
                {member.socials?.twitter && (
                  <a href={member.socials.twitter} target="_blank" rel="noreferrer">
                    X / Twitter
                  </a>
                )}
                {member.socials?.linkedin && (
                  <a href={member.socials.linkedin} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                )}
                {member.socials?.website && (
                  <a href={member.socials.website} target="_blank" rel="noreferrer">
                    Connect / Portfolio
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* PUBLIC UPDATES & FEATURE ALERTS FEED */}
      <section className="team-updates-section">
        <h2>Latest Updates & Community Board</h2>
        {updates.length === 0 ? (
          <p className="team-muted">No announcements posted yet.</p>
        ) : (
          <div className="updates-feed">
            {updates.map((item) => (
              <article key={item.id} className="update-card">
                <div className="update-meta">
                  <span className="update-tag">{item.category}</span>
                  <span>
                    Posted by <strong>{item.author_name}</strong> •{" "}
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  {(user?.id === item.author_id || userRole === "admin") && (
                    <button
                      type="button"
                      className="delete-post-btn"
                      onClick={() => handleDeleteUpdate(item.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <h3>{item.title}</h3>
                <p>{item.content}</p>
                {item.external_link && (
                  <a
                    href={item.external_link}
                    target="_blank"
                    rel="noreferrer"
                    className="update-link"
                  >
                    Learn More →
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}