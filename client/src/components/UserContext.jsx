import { createContext, useEffect, useState } from "react";
import api from "../utils/api";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      api.get("/profile").then(({data}) => {
        setUser(data);
        setReady(true); // to check the user data is loaded from backend
      });
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, isReady}}>
      {children}
    </UserContext.Provider>
  );
}
