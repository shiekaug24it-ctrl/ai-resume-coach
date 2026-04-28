import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

interface User {
  id: number;
  email: string;
  displayName: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/api/auth/me")
      .then((res) => {
        setUser({
          id: res.data.userId,
          email: res.data.email,
          displayName: res.data.displayName,
        });
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signOut = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
