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

    setPreferences(resolvedPrefs);
    setRecommendations(resolvedRecs);
    setUser({
      id: authUser.id,
      email: authUser.email,
      name: displayName,
      isVerified: Boolean(authUser.email_confirmed_at),
    });
  };

  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 6000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      await loadUserProfile(session?.user ?? null);
      if (isMounted) setLoading(false);
    });

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

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });

    if (error) {
      // Catch Supabase's duplicate email error and provide a smart message
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.status === 422 ||
        error.code === "user_already_exists"
      ) {
        throw new Error("An account with this email already exists. Please sign in instead.");
      }
      throw new Error(error.message);
    }

    // If Supabase returns an identity with an empty ID or signals it's a duplicate user sign-up
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    setPreferences(DEFAULT_PREFS);
    setRecommendations([]);

    if (data.user) {
      setUser({
        id: data.user.id,
        email: trimmedEmail,
        name: displayName,
        isVerified: Boolean(data.user.email_confirmed_at),
      });
    }
    return data.user;
  };

  const refreshVerification = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw new Error(error.message);
    if (data?.user) {
      await loadUserProfile(data.user);
      return Boolean(data.user.email_confirmed_at);
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPreferences(DEFAULT_PREFS);
    setRecommendations([]);
  };

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
    refreshVerification,
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