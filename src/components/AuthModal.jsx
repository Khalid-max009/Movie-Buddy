import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../css/AuthModal.css";

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup, resetPassword } = useAuth();
  
  const [viewMode, setViewMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  // Only reset fields when the modal first opens, preserving email during view switches
  useEffect(() => {
    if (isOpen) {
      console.log("🔍 AuthModal opened. Resetting fields.");
      setEmail("");
      setName("");
      setPassword("");
      setNewPassword("");
      setShowPassword(false);
      setIsLoading(false);
      setStatusMessage({ text: "", type: "" });
      setViewMode("login");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    console.log("🚀 handleSubmit triggered. Current viewMode:", viewMode);
    console.log("📧 Input Email:", email);

    setIsLoading(true);
    setStatusMessage({ text: "", type: "" });

    try {
      if (viewMode === "forgot") {
        if (!email) {
          throw new Error("Please enter your email address.");
        }
        console.log("🔄 Calling resetPassword...");
        await resetPassword(email);
        console.log("✅ resetPassword succeeded.");
        
        setStatusMessage({
          text: "Password reset link sent! Check your email inbox.",
          type: "success"
        });
        
        setTimeout(() => {
          setViewMode("login");
          setNewPassword("");
          setStatusMessage({ text: "", type: "" });
        }, 2500);

      } else if (viewMode === "login") {
        console.log("🔄 Calling login...");
        await login(email, password);
        console.log("✅ login succeeded.");
        onClose();

      } else if (viewMode === "signup") {
        console.log("🔄 Calling signup with name:", name);
        await signup(email, name, password);
        console.log("✅ signup succeeded.");
        onClose();
      }
    } catch (err) {
      console.error("❌ Auth Error caught in handleSubmit:", err.message);
      setStatusMessage({ text: err.message, type: "error" });
    } finally {
      console.log("🏁 handleSubmit finished. Resetting isLoading to false.");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose} type="button">✕</button>
        
        <h2>
          {viewMode === "login" && "Welcome Back to Movie Buddy"}
          {viewMode === "signup" && "Create Your Account"}
          {viewMode === "forgot" && "Set New Password"}
        </h2>
        
        <p className="auth-subtitle">
          {viewMode === "login" && "Sign in to access your custom AI preferences & digests."}
          {viewMode === "signup" && "Sign up to start tracking movies and personalized recommendations."}
          {viewMode === "forgot" && "Enter your email and type a new password to reset your account."}
        </p>

        {statusMessage.text && (
          <div className="auth-status-banner" style={{
            background: statusMessage.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(229, 9, 20, 0.15)",
            border: `1px solid ${statusMessage.type === "success" ? "#22c55e" : "#e50914"}`,
            color: statusMessage.type === "success" ? "#4ade80" : "#f87171",
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "0.88rem",
            fontWeight: "600",
            marginBottom: "18px",
            lineHeight: "1.4"
          }}>
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          {viewMode === "signup" && (
            <div className="input-group">
              <label>Your Name</label>
              <input
                type="text"
                placeholder="e.g. Khalid"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          {viewMode === "forgot" && (
            <div className="input-group">
              <label>New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈 Hide" : "👁️ Show"}
                </button>
              </div>
            </div>
          )}

          {viewMode !== "forgot" && (
            <div className="input-group">
              <div className="label-row">
                <label>Password</label>
                {viewMode === "login" && (
                  <button 
                    type="button" 
                    className="forgot-link"
                    onClick={() => setViewMode("forgot")}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={viewMode === "login" ? "current-password" : "new-password"}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈 Hide" : "👁️ Show"}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className={`auth-submit-btn ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-spinner"></span>
            ) : (
              <>
                {viewMode === "login" && "Sign In"}
                {viewMode === "signup" && "Sign Up"}
                {viewMode === "forgot" && "Update Password"}
              </>
            )}
          </button>
        </form>

        <div className="auth-switch-mode">
          <p>
            {viewMode === "login" && (
              <>
                Don't have an account?{" "}
                <button 
                  type="button" 
                  className="switch-link" 
                  onClick={() => setViewMode("signup")}
                >
                  Sign Up
                </button>
              </>
            )}

            {viewMode === "signup" && (
              <>
                Already have an account?{" "}
                <button 
                  type="button" 
                  className="switch-link" 
                  onClick={() => setViewMode("login")}
                >
                  Sign In
                </button>
              </>
            )}

            {viewMode === "forgot" && (
              <button 
                type="button" 
                className="switch-link" 
                onClick={() => setViewMode("login")}
              >
                ← Back to Sign In
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}