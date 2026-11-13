 import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Always start user as null so EVERY visitor must authenticate on site launch
  const [user, setUser] = useState(null);

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const savedList = localStorage.getItem("mb_registered_users");
      return savedList ? JSON.parse(savedList) : [];
    } catch (err) {
      return [];
    }
  });

  const [preferences, setPreferences] = useState(() => {
    try {
      const savedPrefs = localStorage.getItem("mb_user_preferences");
      return savedPrefs ? JSON.parse(savedPrefs) : { genres: [], countries: [], onboardingComplete: false };
    } catch (err) {
      return { genres: [], countries: [], onboardingComplete: false };
    }
  });

  useEffect(() => {
    localStorage.setItem("mb_registered_users", JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem("mb_user_preferences", JSON.stringify(preferences));
  }, [preferences]);

  const login = (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = registeredUsers.find((u) => u.email.toLowerCase() === trimmedEmail);
    
    if (!existingUser) {
      throw new Error("No account found with this email. Please sign up first.");
    }

    if (existingUser.password !== password) {
      throw new Error("Incorrect password. Please try again.");
    }

    const userData = { email: existingUser.email, name: existingUser.name };
    setUser(userData);
  };

  const signup = (email, name, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const emailExists = registeredUsers.some((u) => u.email.toLowerCase() === trimmedEmail);

    if (emailExists) {
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const newUser = { email: trimmedEmail, name: name || email.split("@")[0], password };
    const updatedUsers = [...registeredUsers, newUser];
    
    // Reset preferences for new user onboarding
    const initialPrefs = { genres: [], countries: [], onboardingComplete: false };
    setPreferences(initialPrefs);
    localStorage.setItem("mb_user_preferences", JSON.stringify(initialPrefs));

    setRegisteredUsers(updatedUsers);
    setUser({ email: newUser.email, name: newUser.name });
  };
  
  const logout = () => {
    setUser(null);
  };

  const savePreferences = (newPrefs) => {
    setPreferences({ ...newPrefs, onboardingComplete: true });
  };

  const resetPassword = (email, newPassword) => {
    const trimmedEmail = email.trim().toLowerCase();
    const existingIndex = registeredUsers.findIndex((u) => u.email.toLowerCase() === trimmedEmail);

    if (existingIndex === -1) {
      throw new Error("No account found with this email.");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    const updatedUsers = [...registeredUsers];
    updatedUsers[existingIndex].password = newPassword;

    setRegisteredUsers(updatedUsers);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    preferences,
    savePreferences,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};