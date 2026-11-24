import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import "../css/Team.css";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB — friendly for mobile uploads & storage

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function Team() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState("user");
  const [members, setMembers] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Editor State
  const [editingProfile, setEditingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    role_title: "",
    bio: "",
    avatar_url: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    youtube: "",
    website: ""
  });

  // New Post / Feature Alert / Walkthrough State
  const [postForm, setPostForm] = useState({
    category: "Feature Alert",
    title: "",
    content: "",
    external_link: "",
    video_url: ""
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const isTeamStaff = ["admin", "director", "curator"].includes(userRole);

  useEffect(() => {
    fetchTeamData();
  }, [user]);

  // Clean up object URLs on unmount or replacement to avoid mobile memory leaks
  useEffect(() => {
    return () => {
      if (mediaPreview?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(mediaPreview.url);
      }
    };
  }, [mediaPreview]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
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

      const { data: teamData } = await supabase
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true });
      setMembers(teamData || []);

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
            youtube: mine.socials?.youtube || "",
            website: mine.socials?.website || ""
          });
        }
      }

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

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user || !isTeamStaff) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      setStatusMsg("Avatar image must be under 25MB.");
      e.target.value = "";
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${user.id}/avatar.${ext}`;

    setUploadingAvatar(true);
    setStatusMsg("");
    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setProfileForm((prev) => ({
        ...prev,
        avatar_url: `${data.publicUrl}?t=${Date.now()}`
      }));
      setStatusMsg("Photo uploaded! Click 'Save Public Profile' to apply.");
    } catch (err) {
      setStatusMsg(`Upload error: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user || !isTeamStaff) return;
    setSaving(true);
    setStatusMsg("");

    const orderMap = { admin: 1, director: 2, curator: 3 };

    const payload = {
      user_id: user.id,
      full_name: profileForm.full_name.trim(),
      role_title: profileForm.role_title.trim(),
      bio: profileForm.bio.trim(),
      avatar_url: (profileForm.avatar_url || "").trim(),
      display_order: orderMap[userRole] ?? 4,
      socials: {
        twitter: (profileForm.twitter || "").trim(),
        linkedin: (profileForm.linkedin || "").trim(),
        instagram: (profileForm.instagram || "").trim(),
        youtube: (profileForm.youtube || "").trim(),
        website: (profileForm.website || "").trim()
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

  const handlePostMediaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      setStatusMsg("File exceeds 25MB. For longer videos, paste a YouTube walkthrough link instead.");
      e.target.value = "";
      return;
    }

    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
    const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|jfif)$/i.test(file.name);

    if (!isVideo && !isImage) {
      setStatusMsg("Please choose an image or MP4/WebM video file.");
      e.target.value = "";
      return;
    }

    if (mediaPreview?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview.url);
    }

    setMediaFile(file);
    setMediaPreview({
      url: URL.createObjectURL(file),
      isVideo
    });
    setStatusMsg("");
  };

  const clearPostMedia = () => {
    if (mediaPreview?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview.url);
    }
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handlePublishUpdate = async (e) => {
    e.preventDefault();
    if (!user || !isTeamStaff || !postForm.title.trim() || !postForm.content.trim()) return;
    setSaving(true);
    setStatusMsg("");

    let finalMediaUrl = null;
    let finalMediaType = null;

    try {
      if (mediaFile) {
        const ext = mediaFile.name.split(".").pop()?.toLowerCase() || "mp4";
        const filePath = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("update_media")
          .upload(filePath, mediaFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("update_media")
          .getPublicUrl(filePath);

        finalMediaUrl = publicData.publicUrl;
        finalMediaType = mediaPreview?.isVideo ? "video" : "image";
      } else if (postForm.video_url.trim()) {
        const embedUrl = getYouTubeEmbedUrl(postForm.video_url.trim());
        if (!embedUrl) {
          throw new Error("Enter a valid YouTube watch, share (youtu.be), or Shorts URL.");
        }
        finalMediaUrl = embedUrl;
        finalMediaType = "youtube";
      }

      const myCard = members.find((m) => m.user_id === user.id);
      const authorName = myCard?.full_name || user.email?.split("@")[0] || "Team Member";

      const { error: insertError } = await supabase.from("team_updates").insert({
        author_id: user.id,
        author_name: authorName,
        category: postForm.category,
        title: postForm.title.trim(),
        content: postForm.content.trim(),
        external_link: postForm.external_link.trim() || null,
        media_url: finalMediaUrl,
        media_type: finalMediaType
      });

      if (insertError) throw insertError;

      setPostForm({
        category: "Feature Alert",
        title: "",
        content: "",
        external_link: "",
        video_url: ""
      });
      clearPostMedia();
      setStatusMsg("Published to MovieBuddy!");
      fetchTeamData();
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUpdate = async (id) => {
    const { error } = await supabase.from("team_updates").delete().eq("id", id);
    if (!error) {
      setUpdates((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const roleLabel =
    userRole === "admin"
      ? "Lead Admin"
      : userRole === "director"
      ? "Growth Director"
      : "Media Curator";

  if (loading) {
    return (
      <div className="team-page-container">
        <p className="team-muted">Loading team &amp; updates...</p>
      </div>
    );
  }

  return (
    <div className="team-page-container">
      <header className="team-hero">
        <h1>Behind MovieBuddy</h1>
        <p>Meet the team building, scaling, and curating your cinema discovery experience.</p>
      </header>

      {statusMsg && <div className="cms-toast">{statusMsg}</div>}

      {/* CMS CONTROL PANEL (Visible to Team Staff) */}
      {isTeamStaff && (
        <section className="cms-admin-panel">
          <div className="cms-panel-header">
            <h2>⚡ Team CMS Studio ({roleLabel})</h2>
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
              <div className="cms-file-upload-box">
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px" }}>
                  Upload Profile Photo (Image File)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  disabled={uploadingAvatar}
                />
                {uploadingAvatar && <p className="team-muted">Uploading photo...</p>}
                {profileForm.avatar_url && (
                  <img
                    src={profileForm.avatar_url}
                    alt="Avatar preview"
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginTop: "8px"
                    }}
                  />
                )}
              </div>
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
              <button type="submit" className="cms-primary-btn" disabled={saving || uploadingAvatar}>
                {saving ? "Saving..." : "Save Public Profile"}
              </button>
            </form>
          )}

          {/* Publish New Feature Alert / Walkthrough / Project / Idea */}
          <form onSubmit={handlePublishUpdate} className="cms-post-form">
            <h3>📢 Publish Feature Alert, Walkthrough, or Update</h3>
            <div className="cms-row">
              <select
                value={postForm.category}
                onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
              >
                <option value="Feature Alert">🚀 Feature Alert</option>
                <option value="Site Walkthrough">📖 Site Walkthrough / Guide</option>
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
              placeholder="Write update details, step-by-step walkthrough, or guidance for users..."
              value={postForm.content}
              onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
              required
            />

            <div className="cms-row">
              <div className="cms-file-upload-box">
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px" }}>
                  Attach Image or Short Video (MP4 / WebM, max 25MB)
                </label>
                <input
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  onChange={handlePostMediaChange}
                  disabled={saving}
                />
              </div>

              <input
                type="url"
                placeholder="Or YouTube Walkthrough Link (optional)"
                value={postForm.video_url}
                onChange={(e) => setPostForm({ ...postForm, video_url: e.target.value })}
                disabled={Boolean(mediaFile)}
              />
            </div>

            {mediaPreview && (
              <div className="cms-media-preview">
                {mediaPreview.isVideo ? (
                  <video
                    src={mediaPreview.url}
                    controls
                    playsInline
                    preload="metadata"
                    style={{ maxWidth: "100%", maxHeight: "220px", borderRadius: "10px" }}
                  />
                ) : (
                  <img
                    src={mediaPreview.url}
                    alt="Post preview"
                    style={{ maxWidth: "100%", maxHeight: "220px", borderRadius: "10px" }}
                  />
                )}
                <button type="button" onClick={clearPostMedia}>
                  Remove Media
                </button>
              </div>
            )}

            <div className="cms-row">
              <input
                type="url"
                placeholder="Optional Link (Social post, demo, or form URL)"
                value={postForm.external_link}
                onChange={(e) => setPostForm({ ...postForm, external_link: e.target.value })}
              />
              <button type="submit" className="cms-primary-btn" disabled={saving || uploadingAvatar}>
                {saving ? "Publishing..." : "Publish Live"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* PUBLIC TEAM CARDS */}
      <section className="team-cards-grid">
        {members.length === 0 ? (
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
                loading="lazy"
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
        <h2>Latest Updates &amp; Community Board</h2>
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

                {item.media_url && item.media_type === "image" && (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    loading="lazy"
                    className="update-media-img"
                  />
                )}

                {item.media_url && item.media_type === "video" && (
                  <video
                    src={item.media_url}
                    controls
                    playsInline
                    preload="metadata"
                    className="update-media-video"
                  />
                )}

                {item.media_url && item.media_type === "youtube" && (
                  <div className="update-video-embed">
                    <iframe
                      src={item.media_url}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

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