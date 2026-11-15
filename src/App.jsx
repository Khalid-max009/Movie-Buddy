import { useEffect, useRef } from "react";
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

function AppContent() {
  const { user, preferences } = useAuth();
  const navigate = useNavigate();
  const prevUserRef = useRef(user);

  const showOnboarding = Boolean(user && !preferences?.onboardingComplete);

  // Automatically navigate upon login / signup transition
  useEffect(() => {
    // Detect the transition from logged out (null) to logged in (user active)
    if (!prevUserRef.current && user) {
      if (!preferences?.onboardingComplete) {
        // New user: land on Explore/Home (OnboardingModal will pop up over it)
        navigate("/explore", { replace: true });
      } else {
        // Existing user: land directly on Daily Feed
        navigate("/feed", { replace: true });
      }
    }
    prevUserRef.current = user;
  }, [user, preferences, navigate]);

  // 1. STRICT AUTH GATE: Every visitor MUST authenticate first
  if (!user) {
    return (
      <div className="app-container">
        <AuthModal isOpen={true} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <NavBar />

      <main className="main-content">
        <Routes>
          {/* Default entry fallback redirects based on user onboarding status */}
          <Route 
            path="/" 
            element={
              preferences?.onboardingComplete 
                ? <Navigate to="/feed" replace /> 
                : <Navigate to="/home" replace />
            } 
          />
          
          {/* Main App Routes */}
          <Route path="/feed" element={<DailyFeed />} />
          <Route path="/home" element={<Home />} />
          
          {/* User Pages */}
          <Route path="/favorites" element={<Favourites />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/tv/:id" element={<MovieDetails />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toast />
      </main>

      {/* Onboarding trigger for new users */}
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