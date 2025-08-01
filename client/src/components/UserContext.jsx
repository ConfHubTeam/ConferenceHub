import { createContext, useEffect, useState } from "react";
import api from "../utils/api";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setReady] = useState(false);

  const refreshUserProfile = async () => {
    try {
      const { data } = await api.get("/users/profile");
      setUser(data);
      setReady(true);
      return data;
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setReady(true);
      return null;
    }
  };

  // Enhanced setUser that also refreshes profile to ensure all data is up to date
  const setUserWithRefresh = async (userData) => {
    setUser(userData);
    // If user data is provided, also refresh to get complete profile
    if (userData && userData.id) {
      setTimeout(() => {
        refreshUserProfile();
      }, 100); // Small delay to ensure token is properly set
    }
  };

  useEffect(() => {
    refreshUserProfile();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser: setUserWithRefresh, isReady, refreshUserProfile }}>
      {children}
    </UserContext.Provider>
  );
}
