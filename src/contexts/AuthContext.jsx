import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext();

const DEFAULT_PREFS = { genres: [], countries: [], onboardingComplete: false };

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFS);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user's profile (preferences & cached recommendations) from Supabase safely
   const loadUserProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setPreferences(DEFAULT_PREFS);
      setRecommendations([]);
      return;
    }

    let displayName =
      authUser.user_metadata?.full_name || authUser.email.split("@")[0];
    let resolvedPrefs = DEFAULT_PREFS;
    let resolvedRecs = [];

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, preferences, recommendations")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!error && data) {
        if (data.full_name) displayName = data.full_name;
        if (data.preferences) resolvedPrefs = data.preferences;
        if (data.recommendations) resolvedRecs = data.recommendations;
      }
    } catch (err) {
      console.warn("Profile fetch warning (using defaults):", err.message);
    }

    // Update all states together so React renders once with the true onboarding status
    setPreferences(resolvedPrefs);
    setRecommendations(resolvedRecs);
    setUser({
      id: authUser.id,
      email: authUser.email,
      name: displayName,
    });
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Guarantees loading state clears after 6 seconds max no matter what
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Auth initialization safety timeout triggered.");
        setLoading(false);
      }
    }, 6000);

    // Check active session on page load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      await loadUserProfile(session?.user ?? null);
      if (isMounted) setLoading(false);
    });

    // Listen for auth changes (login, signup, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        await loadUserProfile(session?.user ?? null);
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message || "Invalid email or password.");
    }

    await loadUserProfile(data.user);
    return data.user;
  };

  const signup = async (email, name, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || trimmedEmail.split("@")[0];

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    // 1. Create the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { full_name: displayName },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // 2. Automatically trigger your Resend welcome email
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "MovieBuddy <onboarding@resend.dev>",
          to: [trimmedEmail],
          subject: `Welcome to MovieBuddy, ${displayName}!`,
          html: `
            <h2>Hello ${displayName},</h2>
            <p>Welcome to MovieBuddy! We are thrilled to have you onboard. Your account is now active, allowing you to seamlessly track your personal watchlist, save your favorite films, and explore custom recommendations.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <h3>💻 Built by Kazeem Khalid</h3>
            <p>MovieBuddy is a high-performance web application engineered and designed by <strong>Kazeem Khalid</strong>, a professional frontend and full-stack web developer dedicated to building responsive, feature-rich, and user-centric digital experiences.</p>
            <p>If you have any feedback, project inquiries, or would like to collaborate, let's connect:</p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:khalidolaonipekun43@gmail.com">khalidolaonipekun43@gmail.com</a></li>
              <li><strong>WhatsApp:</strong> <a href="https://wa.me/2349063990709" target="_blank">Chat with me on WhatsApp</a></li>
            </ul>
            <p style="margin-top: 30px;">
              <a href="${window.location.origin}" style="background: #e50914; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Jump Back Into MovieBuddy 🚀
              </a>
            </p>
          `,
        }),
      });
      console.log("✅ Welcome email dispatched successfully via Resend!");
    } catch (emailErr) {
      // Prevents email failure from breaking the signup process
      console.warn("⚠️ Welcome email dispatch failed:", emailErr.message);
    }

    // Initialize clean onboarding state for the new user
    setPreferences(DEFAULT_PREFS);
    setRecommendations([]);
    if (data.user) {
      setUser({ id: data.user.id, email: trimmedEmail, name: displayName });
    }
    return data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPreferences(DEFAULT_PREFS);
    setRecommendations([]);
  };

  // Saves genres & countries from OnboardingModal directly to Supabase
  const savePreferences = async (newPrefs) => {
    const updatedPrefs = { ...newPrefs, onboardingComplete: true };
    setPreferences(updatedPrefs);

    if (user?.id) {
      const { error } = await supabase
        .from("profiles")
        .update({ preferences: updatedPrefs, updated_at: new Date() })
        .eq("id", user.id);

      if (error) console.error("Failed to save preferences:", error.message);
    }
  };

  // Saves AI / TMDB "Recommended for You" movies to Supabase
  const saveRecommendations = async (recsArray) => {
    setRecommendations(recsArray);

    if (user?.id) {
      const { error } = await supabase
        .from("profiles")
        .update({ recommendations: recsArray, updated_at: new Date() })
        .eq("id", user.id);

      if (error) console.error("Failed to save recommendations:", error.message);
    }
  };

  // Sends a secure password reset email via Supabase Auth
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: window.location.origin }
    );
    if (error) throw new Error(error.message);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    preferences,
    savePreferences,
    recommendations,
    saveRecommendations,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};