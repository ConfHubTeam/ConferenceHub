import { createContext, useEffect, useState } from "react";
import api from "../utils/api";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      api.get("/users/profile").then(({data}) => {
        setUser(data);
        setReady(true); // to check the user data is loaded from backend
      }).catch(err => {
        console.error("Failed to fetch user profile:", err);
        setReady(true); // Set ready even if there's an error to prevent infinite loading
      });
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isReady}}>
      {children}
    </UserContext.Provider>
  );
}
