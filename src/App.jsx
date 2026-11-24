import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Favourites from "./pages/Favourites";
import Watchlist from "./pages/Watchlist";
import MovieDetails from "./pages/MovieDetails";
import NavBar from "./components/NavBar";
import Toast from "./components/Toast";
import OnboardingModal from "./components/OnboardingModal";
import AuthModal from "./components/AuthModal";
import AIAssistant from "./components/AIAssistant";
import { MovieProvider } from "./contexts/MovieContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DailyFeed from "./pages/DailyFeed";
import { supabase } from "./services/supabaseClient";
import './App.css'
import Team from "./pages/Team";
import Footer from "./components/Footer";

function VerifyEmailGate() {
  const { user, logout, refreshVerification } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const handleCheck = async () => {
    setChecking(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const verified = await refreshVerification();
      if (!verified) {
        setStatusMsg({
          type: "error",
          text: "Your email is still unconfirmed. Please open your inbox and click the verification link first.",
        });
      }
    } catch {
      setStatusMsg({
        type: "error",
        text: "Unable to verify right now. Please click the link sent to your email first.",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email) return;
    setResending(true);
    setStatusMsg({ type: "", text: "" });

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });

    setResending(false);

    if (error) {
      setStatusMsg({
        type: "error",
        text: `Failed to resend: ${error.message}`,
      });
    } else {
      setStatusMsg({
        type: "success",
        text: "New verification link sent! Please check your inbox and spam folder.",
      });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "#0b0f19",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "430px",
          width: "100%",
          backgroundColor: "#161e2e",
          padding: "32px 24px",
          borderRadius: "16px",
          textAlign: "center",
          border: "1px solid #28334a",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📩</div>
        <h2 style={{ marginBottom: "10px", fontSize: "1.4rem" }}>
          Confirm Your Email First
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "20px" }}>
          We sent a confirmation link to <strong>{user?.email}</strong>. You must click that verification link before you can access MovieBuddy.
        </p>

        {statusMsg.text && (
          <div
            style={{
              backgroundColor: statusMsg.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(229, 9, 20, 0.15)",
              border: `1px solid ${statusMsg.type === "success" ? "#10b981" : "#e50914"}`,
              color: statusMsg.type === "success" ? "#6ee7b7" : "#fca5a5",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              marginBottom: "16px",
            }}
          >
            {statusMsg.text}
          </div>
        )}

        <button
          onClick={handleCheck}
          disabled={checking}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#e50914",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "0.95rem",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          {checking ? "Checking Confirmation..." : "I've Confirmed My Email — Continue"}
        </button>

        <button
          onClick={handleResend}
          disabled={resending}
          style={{
            width: "100%",
            padding: "11px",
            backgroundColor: "#1e293b",
            color: "#e2e8f0",
            border: "1px solid #334155",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "0.9rem",
            cursor: "pointer",
            marginBottom: "14px",
          }}
        >
          {resending ? "Sending Link..." : "Resend Verification Link"}
        </button>

        <button
          onClick={logout}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            fontSize: "0.85rem",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Sign out / Use a different email
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, preferences } = useAuth();
  const navigate = useNavigate();
  const prevVerifiedUserRef = useRef(false);

  const isVerifiedUser = Boolean(user && user.isVerified);
  const showOnboarding = Boolean(isVerifiedUser && !preferences?.onboardingComplete);

  // Smart initial navigation on sign-in / session restore
  useEffect(() => {
    if (!prevVerifiedUserRef.current && isVerifiedUser) {
      if (!preferences?.onboardingComplete) {
        navigate("/home", { replace: true });
      } else {
        navigate("/feed", { replace: true });
      }
    }
    prevVerifiedUserRef.current = isVerifiedUser;
  }, [isVerifiedUser, preferences?.onboardingComplete, navigate]);

  // Gate 1: Must be logged in
  if (!user) {
    return (
      <div className="app-container">
        <AuthModal isOpen={true} onClose={() => {}} />
      </div>
    );
  }

  // Gate 2: Must have confirmed email
  if (!user.isVerified) {
    return (
      <div className="app-container">
        <VerifyEmailGate />
      </div>
    );
  }

  return (
    <div className="app-container">
      <NavBar />

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              preferences?.onboardingComplete
                ? <Navigate to="/feed" replace />
                : <Navigate to="/home" replace />
            }
          />

          <Route path="/feed" element={<DailyFeed />} />
          <Route path="/home" element={<Home />} />
          <Route path="/favorites" element={<Favourites />} />
          <Route path="/watchlist" element={<Watchlist />} />
          
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/team" element={<Team />} />
          <Route path="/tv/:id" element={<MovieDetails />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toast />
      </main>
      <Footer/>

      {/* Onboarding trigger: When completed, explicitly navigates to /home */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => {
          navigate("/home", { replace: true });
        }}
      />

      <AIAssistant />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MovieProvider>
        <AppContent />
      </MovieProvider>
    </AuthProvider>
  );
}